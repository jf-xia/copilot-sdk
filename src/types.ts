import type {
  GetAuthStatusResponse,
  ModelInfo,
  PermissionHandler,
  SessionEvent,
  SessionMetadata,
} from "@github/copilot-sdk";

export const DEFAULT_MODEL = "gpt-5";
export const CONFIG_VERSION = 1;

export interface AppConfig {
  version: number;
  model: string;
  workingDirectory: string;
  activeSessionId?: string;
  recentSessionIds: string[];
  allowAll: boolean;
  allowedDirectories: string[];
  allowedTools: string[];
  theme: string;
}

export interface ActiveSessionInfo {
  sessionId: string;
  model: string;
  workingDirectory: string;
  workspacePath?: string;
}

export interface UsageSummary {
  sessionId: string;
  model: string;
  workingDirectory: string;
  totalEvents: number;
  userMessages: number;
  slashCommands: number;
  assistantMessages: number;
  toolExecutions: number;
  lastAssistantMessage?: string;
}

export type CommandStrategy = "local" | "sdk" | "delegate" | "mixed";

export interface CommandDefinition {
  name: string;
  aliases: string[];
  usage: string;
  description: string;
  strategy: CommandStrategy;
}

export interface ParsedInput {
  raw: string;
  tokens: string[];
  command?: string;
  args: string[];
  isSlashCommand: boolean;
}

export interface CommandResult {
  output?: string;
  exit?: boolean;
}

export interface GatewaySessionConfig {
  model: string;
  workingDirectory: string;
  permissionHandler: PermissionHandler;
  userInputHandler?: AgentUserInputHandler;
}

export interface CopilotSessionHandle {
  sessionId: string;
  workspacePath?: string;
  send(input: string): Promise<string | undefined>;
  getMessages(): Promise<SessionEvent[]>;
  disconnect(): Promise<void>;
  onEvent(handler: (event: SessionEvent) => void): () => void;
}

export interface CopilotGateway {
  start(): Promise<void>;
  stop(): Promise<void>;
  createSession(config: GatewaySessionConfig): Promise<CopilotSessionHandle>;
  resumeSession(sessionId: string, config: GatewaySessionConfig): Promise<CopilotSessionHandle>;
  listSessions(): Promise<SessionMetadata[]>;
  listModels(): Promise<ModelInfo[]>;
  getAuthStatus(): Promise<GetAuthStatusResponse>;
}

export interface UserPrompter {
  ask(question: string): Promise<string>;
}

export interface AgentUserInputRequest {
  question: string;
  choices?: string[];
  allowFreeform?: boolean;
}

export interface AgentUserInputResponse {
  answer: string;
  wasFreeform: boolean;
}

export type AgentUserInputHandler = (request: AgentUserInputRequest) => Promise<AgentUserInputResponse>;