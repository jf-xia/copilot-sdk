import { readFile } from "node:fs/promises";
import path from "node:path";

import type { GetAuthStatusResponse, ModelInfo, SessionMetadata } from "@github/copilot-sdk";

import type {
  ActiveSessionInfo,
  AgentUserInputHandler,
  CopilotGateway,
  CopilotSessionHandle,
  UsageSummary,
  UserPrompter,
} from "../types.js";
import { collectRelativeEntries } from "../storage/path-utils.js";
import { ConfigService } from "./config-service.js";
import { PermissionService } from "./permission-service.js";
import { UsageService } from "./usage-service.js";

interface ActiveSession {
  handle: CopilotSessionHandle;
  info: ActiveSessionInfo;
}

export class SessionService {
  private activeSession?: ActiveSession;

  constructor(
    private readonly gateway: CopilotGateway,
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
    private readonly usageService = new UsageService(),
    private readonly userPrompter?: UserPrompter,
  ) {}

  async start(resume: string | boolean | undefined): Promise<ActiveSessionInfo> {
    await this.gateway.start();

    if (typeof resume === "string" && resume.trim()) {
      return (await this.resumeSession(resume.trim())).info;
    }

    if (resume === true) {
      const recentSessionId = this.configService.getConfig().activeSessionId ?? this.configService.getConfig().recentSessionIds[0];
      if (recentSessionId) {
        try {
          return (await this.resumeSession(recentSessionId)).info;
        } catch {
          return (await this.createNewSession()).info;
        }
      }
    }

    const activeSessionId = this.configService.getConfig().activeSessionId;
    if (activeSessionId) {
      try {
        return (await this.resumeSession(activeSessionId)).info;
      } catch {
        return (await this.createNewSession()).info;
      }
    }

    return (await this.createNewSession()).info;
  }

  async stop(): Promise<void> {
    if (this.activeSession) {
      await this.activeSession.handle.disconnect();
      this.activeSession = undefined;
    }

    await this.gateway.stop();
  }

  async ensureSession(): Promise<ActiveSessionInfo> {
    if (this.activeSession) {
      return this.activeSession.info;
    }

    return (await this.createNewSession()).info;
  }

  getCurrentSessionInfo(): ActiveSessionInfo | undefined {
    return this.activeSession?.info;
  }

  async createNewSession(options?: { model?: string; workingDirectory?: string }): Promise<ActiveSession> {
    const config = this.configService.getConfig();
    const model = options?.model ?? config.model;
    const workingDirectory = options?.workingDirectory ?? config.workingDirectory;
    const handle = await this.gateway.createSession({
      model,
      workingDirectory,
      permissionHandler: this.permissionService.createHandler(),
      userInputHandler: this.buildUserInputHandler(),
    });

    return this.attachSession(handle, model, workingDirectory);
  }

  async resumeSession(sessionId: string, options?: { model?: string; workingDirectory?: string }): Promise<ActiveSession> {
    const config = this.configService.getConfig();
    const model = options?.model ?? config.model;
    const workingDirectory = options?.workingDirectory ?? config.workingDirectory;
    const handle = await this.gateway.resumeSession(sessionId, {
      model,
      workingDirectory,
      permissionHandler: this.permissionService.createHandler(),
      userInputHandler: this.buildUserInputHandler(),
    });

    return this.attachSession(handle, model, workingDirectory);
  }

  async switchModel(model: string): Promise<ActiveSessionInfo> {
    return (await this.createNewSession({ model })).info;
  }

  async send(input: string): Promise<string | undefined> {
    const activeSession = await this.getActiveSession();
    return activeSession.handle.send(input);
  }

  async listSessions(): Promise<SessionMetadata[]> {
    return this.gateway.listSessions();
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.gateway.listModels();
  }

  async getAuthStatus(): Promise<GetAuthStatusResponse> {
    return this.gateway.getAuthStatus();
  }

  async getUsageSummary(): Promise<UsageSummary> {
    const activeSession = await this.getActiveSession();
    const events = await activeSession.handle.getMessages();
    return this.usageService.summarize(activeSession.info, events);
  }

  async readPlan(): Promise<string | undefined> {
    const activeSession = await this.getActiveSession();
    const workspacePath = this.getWorkspacePath(activeSession);
    if (!workspacePath) {
      return undefined;
    }

    try {
      return await readFile(path.join(workspacePath, "plan.md"), "utf8");
    } catch {
      return undefined;
    }
  }

  async listWorkspaceFiles(limit = 200): Promise<string[]> {
    const activeSession = await this.getActiveSession();
    const workspacePath = this.getWorkspacePath(activeSession);
    if (!workspacePath) {
      return [];
    }

    return collectRelativeEntries(path.join(workspacePath, "files"), limit);
  }

  async listCheckpoints(limit?: number): Promise<string[]> {
    const activeSession = await this.getActiveSession();
    const workspacePath = this.getWorkspacePath(activeSession);
    if (!workspacePath) {
      return [];
    }

    const checkpoints = await collectRelativeEntries(path.join(workspacePath, "checkpoints"), limit ?? 200);
    return typeof limit === "number" ? checkpoints.slice(0, limit) : checkpoints;
  }

  private buildUserInputHandler(): AgentUserInputHandler | undefined {
    const userPrompter = this.userPrompter;
    if (!userPrompter) {
      return undefined;
    }

    return async (request) => {
      const suffix = request.choices && request.choices.length > 0 ? ` [${request.choices.join("/")}]` : "";
      const answer = await userPrompter.ask(`${request.question}${suffix}: `);

      return {
        answer,
        wasFreeform: !request.choices?.includes(answer),
      };
    };
  }

  private async getActiveSession(): Promise<ActiveSession> {
    if (this.activeSession) {
      return this.activeSession;
    }

    await this.start(undefined);

    if (!this.activeSession) {
      throw new Error("No active session is available.");
    }

    return this.activeSession;
  }

  private async attachSession(handle: CopilotSessionHandle, model: string, workingDirectory: string): Promise<ActiveSession> {
    const previousSession = this.activeSession;
    const nextSession: ActiveSession = {
      handle,
      info: {
        sessionId: handle.sessionId,
        model,
        workingDirectory,
        workspacePath: handle.workspacePath,
      },
    };

    this.activeSession = nextSession;
    await this.configService.setModel(model);
    await this.configService.setWorkingDirectory(workingDirectory);
    await this.configService.setActiveSession(handle.sessionId);

    if (previousSession && previousSession.handle !== handle) {
      await previousSession.handle.disconnect();
    }

    return nextSession;
  }

  private getWorkspacePath(activeSession: ActiveSession): string | undefined {
    const workspacePath = activeSession.handle.workspacePath ?? activeSession.info.workspacePath;
    if (workspacePath) {
      activeSession.info.workspacePath = workspacePath;
    }

    return workspacePath;
  }
}