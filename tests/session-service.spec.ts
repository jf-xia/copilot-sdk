import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ConfigService } from "../src/services/config-service.js";
import { PermissionService } from "../src/services/permission-service.js";
import { SessionService } from "../src/services/session-service.js";
import { ConfigStore } from "../src/storage/config-store.js";
import { FakeCopilotGateway } from "./helpers/fake-copilot.js";

async function createHarness() {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-session-"));
  const configService = new ConfigService(new ConfigStore(path.join(rootDirectory, "config.json")));
  await configService.load(rootDirectory);
  const permissionService = new PermissionService(configService);
  const gateway = new FakeCopilotGateway();
  const sessionService = new SessionService(gateway, configService, permissionService);

  return {
    rootDirectory,
    configService,
    permissionService,
    gateway,
    sessionService,
  };
}

describe("SessionService", () => {
  it("creates an initial session and stores it in config", async () => {
    const harness = await createHarness();
    const session = await harness.sessionService.start(undefined);

    expect(session.sessionId).toBe("session-1");
    expect(harness.configService.getConfig().activeSessionId).toBe("session-1");
  });

  it("switches model by creating a fresh session", async () => {
    const harness = await createHarness();
    await harness.sessionService.start(undefined);
    const nextSession = await harness.sessionService.switchModel("claude-sonnet-4.5");

    expect(nextSession.sessionId).toBe("session-2");
    expect(nextSession.model).toBe("claude-sonnet-4.5");
    expect(harness.configService.getConfig().model).toBe("claude-sonnet-4.5");
  });

  it("reads plan, files, and checkpoints from the workspace path", async () => {
    const harness = await createHarness();
    const session = await harness.sessionService.start(undefined);
    const workspacePath = await mkdtemp(path.join(tmpdir(), "code-cli-workspace-"));

    await mkdir(path.join(workspacePath, "files", "src"), { recursive: true });
    await mkdir(path.join(workspacePath, "checkpoints"), { recursive: true });
    await writeFile(path.join(workspacePath, "plan.md"), "# plan\n");
    await writeFile(path.join(workspacePath, "files", "src", "index.ts"), "export {};\n");
    await writeFile(path.join(workspacePath, "checkpoints", "step-1.md"), "checkpoint\n");

    const fakeSession = harness.gateway.getSession(session.sessionId);
    if (!fakeSession) {
      throw new Error("Expected fake session to exist.");
    }

    fakeSession.workspacePath = workspacePath;

    expect(await harness.sessionService.readPlan()).toContain("# plan");
    expect(await harness.sessionService.listWorkspaceFiles()).toEqual(["src/index.ts"]);
    expect(await harness.sessionService.listCheckpoints()).toEqual(["step-1.md"]);
  });

  it("sends raw prompts through to the active session", async () => {
    const harness = await createHarness();
    const session = await harness.sessionService.start(undefined);
    const fakeSession = harness.gateway.getSession(session.sessionId);
    if (!fakeSession) {
      throw new Error("Expected fake session to exist.");
    }

    fakeSession.setResponse("/review fix it", "delegated review");

    await expect(harness.sessionService.send("/review fix it")).resolves.toBe("delegated review");
    expect(fakeSession.sentInputs).toContain("/review fix it");
  });
});