import type { GetAuthStatusResponse, ModelInfo, SessionEvent, SessionMetadata } from "@github/copilot-sdk";

import type { CopilotGateway, CopilotSessionHandle, GatewaySessionConfig } from "../../src/types.js";

function createModel(id: string, name = id): ModelInfo {
  return {
    id,
    name,
    capabilities: {
      supports: {
        vision: false,
        reasoningEffort: true,
      },
      limits: {
        max_context_window_tokens: 200_000,
      },
    },
    supportedReasoningEfforts: ["low", "medium", "high"],
    defaultReasoningEffort: "medium",
  };
}

export class FakeSessionHandle implements CopilotSessionHandle {
  readonly sentInputs: string[] = [];
  readonly messages: SessionEvent[] = [];
  readonly responses = new Map<string, string | undefined>();
  readonly eventHandlers = new Set<(event: SessionEvent) => void>();
  disconnected = false;

  constructor(
    public readonly sessionId: string,
    public workspacePath?: string,
  ) {}

  setResponse(input: string, output: string | undefined): void {
    this.responses.set(input, output);
  }

  async send(input: string): Promise<string | undefined> {
    this.sentInputs.push(input);

    const userEvent = { type: "user.message", data: { content: input } } as SessionEvent;
    this.push(userEvent);

    const output = this.responses.has(input) ? this.responses.get(input) : `mock:${input}`;
    if (output !== undefined) {
      const assistantEvent = { type: "assistant.message", data: { content: output } } as SessionEvent;
      this.push(assistantEvent);
    }

    return output;
  }

  async getMessages(): Promise<SessionEvent[]> {
    return [...this.messages];
  }

  async disconnect(): Promise<void> {
    this.disconnected = true;
  }

  onEvent(handler: (event: SessionEvent) => void): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  private push(event: SessionEvent): void {
    this.messages.push(event);
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }
}

export class FakeCopilotGateway implements CopilotGateway {
  started = false;
  createCount = 0;
  readonly sessions = new Map<string, FakeSessionHandle>();
  readonly sessionMetadata = new Map<string, SessionMetadata>();
  models: ModelInfo[] = [createModel("gpt-5", "GPT-5"), createModel("claude-sonnet-4.5", "Claude Sonnet 4.5")];
  authStatus: GetAuthStatusResponse = {
    isAuthenticated: true,
    authType: "user",
    host: "https://github.com",
    login: "octocat",
    statusMessage: "Authenticated",
  };

  async start(): Promise<void> {
    this.started = true;
  }

  async stop(): Promise<void> {
    this.started = false;
  }

  async createSession(config: GatewaySessionConfig): Promise<CopilotSessionHandle> {
    const sessionId = `session-${++this.createCount}`;
    const session = new FakeSessionHandle(sessionId);
    this.sessions.set(sessionId, session);
    this.sessionMetadata.set(sessionId, this.createMetadata(sessionId, config));
    return session;
  }

  async resumeSession(sessionId: string, config: GatewaySessionConfig): Promise<CopilotSessionHandle> {
    const existingSession = this.sessions.get(sessionId);
    if (existingSession) {
      this.sessionMetadata.set(sessionId, this.createMetadata(sessionId, config));
      return existingSession;
    }

    const session = new FakeSessionHandle(sessionId);
    this.sessions.set(sessionId, session);
    this.sessionMetadata.set(sessionId, this.createMetadata(sessionId, config));
    return session;
  }

  async listSessions(): Promise<SessionMetadata[]> {
    return [...this.sessionMetadata.values()];
  }

  async listModels(): Promise<ModelInfo[]> {
    return this.models;
  }

  async getAuthStatus(): Promise<GetAuthStatusResponse> {
    return this.authStatus;
  }

  getSession(sessionId: string): FakeSessionHandle | undefined {
    return this.sessions.get(sessionId);
  }

  private createMetadata(sessionId: string, config: GatewaySessionConfig): SessionMetadata {
    const now = new Date();
    return {
      sessionId,
      startTime: now,
      modifiedTime: now,
      isRemote: false,
      summary: `Session for ${config.model}`,
      context: {
        cwd: config.workingDirectory,
      },
    };
  }
}