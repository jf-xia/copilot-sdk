import {
  CopilotClient,
  type CopilotClientOptions,
  type CopilotSession,
  type SessionEvent,
} from "@github/copilot-sdk";

import type { CopilotGateway, CopilotSessionHandle, GatewaySessionConfig } from "../types.js";

class SdkSessionHandle implements CopilotSessionHandle {
  constructor(private readonly session: CopilotSession) {}

  get sessionId(): string {
    return this.session.sessionId;
  }

  get workspacePath(): string | undefined {
    return this.session.workspacePath;
  }

  async send(input: string): Promise<string | undefined> {
    const response = await this.session.sendAndWait({ prompt: input }, 120_000);
    const content = (response as { data?: { content?: unknown } } | undefined)?.data?.content;

    return typeof content === "string" ? content : undefined;
  }

  async getMessages(): Promise<SessionEvent[]> {
    return this.session.getMessages();
  }

  async disconnect(): Promise<void> {
    await this.session.disconnect();
  }

  onEvent(handler: (event: SessionEvent) => void): () => void {
    return this.session.on(handler);
  }
}

export class SdkCopilotGateway implements CopilotGateway {
  private readonly client: CopilotClient;

  constructor(options: CopilotClientOptions = {}) {
    this.client = new CopilotClient({
      ...options,
      autoStart: false,
      logLevel: options.logLevel ?? "error",
    });
  }

  async start(): Promise<void> {
    if (this.client.getState() === "connected") {
      return;
    }

    await this.client.start();
  }

  async stop(): Promise<void> {
    if (this.client.getState() === "disconnected") {
      return;
    }

    const errors = await this.client.stop();

    if (errors.length > 0) {
      throw new AggregateError(errors, "Copilot client stopped with cleanup errors.");
    }
  }

  async createSession(config: GatewaySessionConfig): Promise<CopilotSessionHandle> {
    const session = await this.client.createSession({
      clientName: "code-cli",
      model: config.model,
      workingDirectory: config.workingDirectory,
      onPermissionRequest: config.permissionHandler,
      onUserInputRequest: config.userInputHandler,
      infiniteSessions: { enabled: true },
    });

    return new SdkSessionHandle(session);
  }

  async resumeSession(sessionId: string, config: GatewaySessionConfig): Promise<CopilotSessionHandle> {
    const session = await this.client.resumeSession(sessionId, {
      clientName: "code-cli",
      model: config.model,
      workingDirectory: config.workingDirectory,
      onPermissionRequest: config.permissionHandler,
      onUserInputRequest: config.userInputHandler,
      infiniteSessions: { enabled: true },
    });

    return new SdkSessionHandle(session);
  }

  async listSessions() {
    return this.client.listSessions();
  }

  async listModels() {
    return this.client.listModels();
  }

  async getAuthStatus() {
    return this.client.getAuthStatus();
  }
}