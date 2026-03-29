import type { CommandDefinition } from "../types.js";

export const COMMAND_CATALOG: CommandDefinition[] = [
  { name: "/add-dir", aliases: [], usage: "/add-dir PATH", description: "将目录加入允许访问列表。", strategy: "local" },
  { name: "/agent", aliases: [], usage: "/agent", description: "选择当前会话使用的 agent。", strategy: "delegate" },
  { name: "/allow-all", aliases: ["/yolo"], usage: "/allow-all | /yolo", description: "启用全量权限放行模式。", strategy: "local" },
  { name: "/clear", aliases: ["/new"], usage: "/clear | /new", description: "清空上下文并创建新会话。", strategy: "local" },
  { name: "/compact", aliases: [], usage: "/compact", description: "请求当前会话进行上下文压缩。", strategy: "delegate" },
  { name: "/context", aliases: [], usage: "/context", description: "显示上下文窗口和 token 使用情况。", strategy: "delegate" },
  { name: "/cwd", aliases: ["/cd"], usage: "/cwd | /cd [PATH]", description: "查看或切换工作目录。", strategy: "local" },
  { name: "/delegate", aliases: [], usage: "/delegate [PROMPT]", description: "将任务交由专门 agent 处理。", strategy: "delegate" },
  { name: "/diff", aliases: [], usage: "/diff", description: "查看当前目录变更。", strategy: "delegate" },
  { name: "/exit", aliases: ["/quit"], usage: "/exit | /quit", description: "退出 code-cli。", strategy: "local" },
  { name: "/experimental", aliases: [], usage: "/experimental [on|off]", description: "切换实验功能。", strategy: "delegate" },
  { name: "/feedback", aliases: [], usage: "/feedback", description: "提交 CLI 反馈。", strategy: "delegate" },
  { name: "/fleet", aliases: [], usage: "/fleet [PROMPT]", description: "并行执行子任务。", strategy: "delegate" },
  { name: "/help", aliases: [], usage: "/help", description: "显示帮助。", strategy: "local" },
  { name: "/ide", aliases: [], usage: "/ide", description: "连接 IDE 工作区。", strategy: "delegate" },
  { name: "/init", aliases: [], usage: "/init", description: "初始化 Copilot 自定义配置。", strategy: "delegate" },
  { name: "/list-dirs", aliases: [], usage: "/list-dirs", description: "列出允许访问目录。", strategy: "local" },
  { name: "/login", aliases: [], usage: "/login", description: "登录 Copilot。", strategy: "delegate" },
  { name: "/logout", aliases: [], usage: "/logout", description: "退出 Copilot 登录。", strategy: "delegate" },
  { name: "/lsp", aliases: [], usage: "/lsp [show|test|reload|help] [SERVER-NAME]", description: "管理语言服务器配置。", strategy: "delegate" },
  { name: "/mcp", aliases: [], usage: "/mcp [show|add|edit|delete|disable|enable] [SERVER-NAME]", description: "管理 MCP 服务器。", strategy: "delegate" },
  { name: "/model", aliases: ["/models"], usage: "/model [MODEL] | /models [MODEL]", description: "查看或切换模型。", strategy: "sdk" },
  { name: "/plan", aliases: [], usage: "/plan [PROMPT]", description: "在编码前生成实现计划。", strategy: "delegate" },
  { name: "/plugin", aliases: [], usage: "/plugin [marketplace|install|uninstall|update|list] [ARGS...]", description: "管理插件和市场。", strategy: "delegate" },
  { name: "/rename", aliases: [], usage: "/rename NAME", description: "重命名当前会话。", strategy: "delegate" },
  { name: "/reset-allowed-tools", aliases: [], usage: "/reset-allowed-tools", description: "清空本地授权并恢复默认审批策略。", strategy: "local" },
  { name: "/resume", aliases: [], usage: "/resume [SESSION-ID]", description: "列出或恢复会话。", strategy: "sdk" },
  { name: "/review", aliases: [], usage: "/review [PROMPT]", description: "运行代码评审 agent。", strategy: "delegate" },
  { name: "/session", aliases: [], usage: "/session [checkpoints [n]|files|plan|rename NAME]", description: "查看会话信息和工作区内容。", strategy: "sdk" },
  { name: "/share", aliases: [], usage: "/share [file|gist] [PATH]", description: "共享当前会话。", strategy: "delegate" },
  { name: "/skills", aliases: [], usage: "/skills [list|info|add|remove|reload] [ARGS...]", description: "管理技能。", strategy: "delegate" },
  { name: "/terminal-setup", aliases: [], usage: "/terminal-setup", description: "配置多行输入。", strategy: "delegate" },
  { name: "/theme", aliases: [], usage: "/theme [show|set|list] [auto|THEME-ID]", description: "查看或设置主题。", strategy: "delegate" },
  { name: "/usage", aliases: [], usage: "/usage", description: "显示当前会话使用统计。", strategy: "sdk" },
  { name: "/user", aliases: [], usage: "/user [show|list|switch]", description: "管理当前 GitHub 用户。", strategy: "mixed" },
];

export function findCommand(token: string): CommandDefinition | undefined {
  return COMMAND_CATALOG.find((command) => command.name === token || command.aliases.includes(token));
}

export function formatHelp(): string {
  const lines = ["可用命令：", ""];
  const width = Math.max(...COMMAND_CATALOG.map((command) => command.usage.length));

  for (const command of COMMAND_CATALOG) {
    lines.push(`${command.usage.padEnd(width)}  ${command.description}`);
  }

  return lines.join("\n");
}