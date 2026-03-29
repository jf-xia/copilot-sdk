import type { GetAuthStatusResponse, ModelInfo, SessionMetadata } from "@github/copilot-sdk";

import type { CommandDefinition, CommandResult, ParsedInput, UsageSummary } from "../types.js";
import { ConfigService } from "../services/config-service.js";
import { SessionService } from "../services/session-service.js";
import { COMMAND_CATALOG, findCommand, formatHelp } from "./catalog.js";

function tokenizeInput(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaping = false;

  for (const character of input) {
    if (escaping) {
      current += character;
      escaping = false;
      continue;
    }

    if (character === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (character === quote) {
        quote = null;
      } else {
        current += character;
      }

      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (/\s/.test(character)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }

      continue;
    }

    current += character;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

export function parseInput(raw: string): ParsedInput {
  const trimmed = raw.trim();
  const tokens = tokenizeInput(trimmed);
  const isSlashCommand = tokens[0]?.startsWith("/") ?? false;

  return {
    raw,
    tokens,
    command: isSlashCommand ? tokens[0] : undefined,
    args: isSlashCommand ? tokens.slice(1) : tokens,
    isSlashCommand,
  };
}

function formatModels(models: ModelInfo[], currentModel: string): string {
  const lines = ["可用模型：", ""];

  for (const model of models) {
    const currentMarker = model.id === currentModel ? "*" : " ";
    const reasoning = model.supportedReasoningEfforts?.length
      ? ` reasoning=${model.supportedReasoningEfforts.join(",")}`
      : "";
    lines.push(`${currentMarker} ${model.id} (${model.name})${reasoning}`);
  }

  return lines.join("\n");
}

function formatSessions(sessions: SessionMetadata[], activeSessionId?: string): string {
  if (sessions.length === 0) {
    return "当前没有可恢复的会话。";
  }

  const lines = ["可恢复会话：", ""];
  for (const session of sessions) {
    const marker = session.sessionId === activeSessionId ? "*" : " ";
    const summary = session.summary ? ` | ${session.summary}` : "";
    const cwd = session.context?.cwd ? ` | cwd=${session.context.cwd}` : "";
    lines.push(`${marker} ${session.sessionId}${cwd}${summary}`);
  }

  return lines.join("\n");
}

function formatSessionInfo(session: { sessionId: string; model: string; workingDirectory: string; workspacePath?: string }): string {
  return [
    "当前会话：",
    "",
    `sessionId: ${session.sessionId}`,
    `model: ${session.model}`,
    `cwd: ${session.workingDirectory}`,
    `workspacePath: ${session.workspacePath ?? "(未启用)"}`,
  ].join("\n");
}

function formatUsageSummary(summary: UsageSummary): string {
  return [
    "会话使用统计：",
    "",
    `sessionId: ${summary.sessionId}`,
    `model: ${summary.model}`,
    `cwd: ${summary.workingDirectory}`,
    `events: ${summary.totalEvents}`,
    `userMessages: ${summary.userMessages}`,
    `slashCommands: ${summary.slashCommands}`,
    `assistantMessages: ${summary.assistantMessages}`,
    `toolExecutions: ${summary.toolExecutions}`,
    `lastAssistantMessage: ${summary.lastAssistantMessage ?? "(none)"}`,
  ].join("\n");
}

function formatAuthStatus(status: GetAuthStatusResponse): string {
  return [
    "用户状态：",
    "",
    `authenticated: ${status.isAuthenticated}`,
    `authType: ${status.authType ?? "(unknown)"}`,
    `login: ${status.login ?? "(unknown)"}`,
    `host: ${status.host ?? "(unknown)"}`,
    `status: ${status.statusMessage ?? "(unknown)"}`,
  ].join("\n");
}

function requireArgument(definition: CommandDefinition, value: string | undefined): string {
  if (!value) {
    throw new Error(`缺少参数。用法：${definition.usage}`);
  }

  return value;
}

export class CommandRouter {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(raw: string): Promise<CommandResult> {
    const parsed = parseInput(raw);
    if (parsed.tokens.length === 0) {
      return {};
    }

    if (!parsed.isSlashCommand) {
      return this.runChat(raw);
    }

    const definition = findCommand(parsed.command ?? "");
    if (!definition) {
      return this.runDelegate(raw);
    }

    const strategy = this.resolveStrategy(definition, parsed.args);
    if (strategy === "local") {
      return this.runLocal(definition, parsed.args);
    }

    if (strategy === "sdk") {
      return this.runSdk(definition, raw, parsed.args);
    }

    return this.runDelegate(raw);
  }

  private resolveStrategy(definition: CommandDefinition, args: string[]): CommandDefinition["strategy"] | "delegate" {
    if (definition.name === "/session" && args[0] === "rename") {
      return "delegate";
    }

    if (definition.name === "/user") {
      return args[0] && args[0] !== "show" ? "delegate" : "sdk";
    }

    return definition.strategy;
  }

  private async runChat(raw: string): Promise<CommandResult> {
    const output = await this.sessionService.send(raw);
    return { output: output ?? "请求已发送，但没有返回文本输出。" };
  }

  private async runDelegate(raw: string): Promise<CommandResult> {
    const output = await this.sessionService.send(raw);
    return { output: output ?? "命令已提交，但没有返回文本输出。" };
  }

  private async runLocal(definition: CommandDefinition, args: string[]): Promise<CommandResult> {
    switch (definition.name) {
      case "/help":
        return { output: formatHelp() };

      case "/exit":
        return { output: "正在退出 code-cli。", exit: true };

      case "/clear": {
        const session = await this.sessionService.createNewSession();
        return { output: `已创建新会话 ${session.info.sessionId}，模型 ${session.info.model}。` };
      }

      case "/cwd": {
        const nextDirectory = args.join(" ").trim();
        if (!nextDirectory) {
          return { output: this.configService.getConfig().workingDirectory };
        }

        const config = await this.configService.setWorkingDirectory(nextDirectory);
        const session = await this.sessionService.createNewSession({ workingDirectory: config.workingDirectory });
        return { output: `工作目录已切换到 ${config.workingDirectory}，新会话 ${session.info.sessionId} 已创建。` };
      }

      case "/add-dir": {
        const directory = requireArgument(definition, args.join(" ").trim());
        const config = await this.configService.addAllowedDirectory(directory);
        return { output: `已加入允许目录：${config.allowedDirectories[config.allowedDirectories.length - 1]}` };
      }

      case "/list-dirs": {
        const directories = this.configService.getConfig().allowedDirectories;
        return { output: directories.length > 0 ? directories.join("\n") : "当前没有允许目录。" };
      }

      case "/allow-all": {
        await this.configService.setAllowAll(true);
        return { output: "已启用 allow-all 模式。" };
      }

      case "/reset-allowed-tools": {
        await this.configService.resetAllowedTools();
        return { output: "已重置本地授权策略，allow-all 已关闭。" };
      }

      default:
        throw new Error(`未实现的本地命令：${definition.name}`);
    }
  }

  private async runSdk(definition: CommandDefinition, raw: string, args: string[]): Promise<CommandResult> {
    switch (definition.name) {
      case "/model": {
        const requestedModel = args.join(" ").trim();
        if (!requestedModel) {
          const models = await this.sessionService.listModels();
          return { output: formatModels(models, this.configService.getConfig().model) };
        }

        const session = await this.sessionService.switchModel(requestedModel);
        return { output: `已切换模型到 ${requestedModel}，当前会话 ${session.sessionId}。` };
      }

      case "/resume": {
        const requestedSessionId = args.join(" ").trim();
        if (!requestedSessionId) {
          const sessions = await this.sessionService.listSessions();
          return { output: formatSessions(sessions, this.sessionService.getCurrentSessionInfo()?.sessionId) };
        }

        const session = await this.sessionService.resumeSession(requestedSessionId);
        return { output: `已恢复会话 ${session.info.sessionId}。` };
      }

      case "/session": {
        if (args.length === 0) {
          const session = await this.sessionService.ensureSession();
          return { output: formatSessionInfo(session) };
        }

        if (args[0] === "files") {
          const files = await this.sessionService.listWorkspaceFiles();
          return { output: files.length > 0 ? files.join("\n") : "当前会话没有可列出的文件。" };
        }

        if (args[0] === "plan") {
          const plan = await this.sessionService.readPlan();
          return { output: plan ?? "当前会话没有 plan.md。" };
        }

        if (args[0] === "checkpoints") {
          const limit = args[1] ? Number.parseInt(args[1], 10) : undefined;
          const checkpoints = await this.sessionService.listCheckpoints(Number.isFinite(limit) ? limit : undefined);
          return { output: checkpoints.length > 0 ? checkpoints.join("\n") : "当前会话没有 checkpoint。" };
        }

        if (args[0] === "rename") {
          return this.runDelegate(raw);
        }

        throw new Error(`未知的 /session 子命令。用法：${definition.usage}`);
      }

      case "/usage": {
        const summary = await this.sessionService.getUsageSummary();
        return { output: formatUsageSummary(summary) };
      }

      case "/user": {
        const subcommand = args[0] ?? "show";
        if (subcommand !== "show") {
          return this.runDelegate(raw);
        }

        const authStatus = await this.sessionService.getAuthStatus();
        return { output: formatAuthStatus(authStatus) };
      }

      default:
        throw new Error(`未实现的 SDK 命令：${definition.name}`);
    }
  }
}