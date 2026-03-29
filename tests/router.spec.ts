import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CommandRouter } from "../src/commands/router.js";
import { ConfigService } from "../src/services/config-service.js";
import { PermissionService } from "../src/services/permission-service.js";
import { SessionService } from "../src/services/session-service.js";
import { ConfigStore } from "../src/storage/config-store.js";
import { FakeCopilotGateway } from "./helpers/fake-copilot.js";

async function createHarness() {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-router-"));
  const configService = new ConfigService(new ConfigStore(path.join(rootDirectory, "config.json")));
  await configService.load(rootDirectory);
  const permissionService = new PermissionService(configService);
  const gateway = new FakeCopilotGateway();
  const sessionService = new SessionService(gateway, configService, permissionService);
  await sessionService.start(undefined);
  const router = new CommandRouter(configService, sessionService);

  return {
    rootDirectory,
    configService,
    gateway,
    sessionService,
    router,
  };
}

describe("CommandRouter", () => {
  it("renders help output from the command catalog", async () => {
    const harness = await createHarness();
    const result = await harness.router.execute("/help");

    expect(result.output).toContain("/help");
    expect(result.output).toContain("/resume");
  });

  it("adds an allowed directory", async () => {
    const harness = await createHarness();
    const extraDirectory = path.join(harness.rootDirectory, "extra");
    const result = await harness.router.execute(`/add-dir ${extraDirectory}`);

    expect(result.output).toContain(extraDirectory);
    expect(harness.configService.getConfig().allowedDirectories).toContain(extraDirectory);
  });

  it("lists and switches models through SDK commands", async () => {
    const harness = await createHarness();

    const listResult = await harness.router.execute("/model");
    expect(listResult.output).toContain("gpt-5");

    const switchResult = await harness.router.execute("/models claude-sonnet-4.5");
    expect(switchResult.output).toContain("claude-sonnet-4.5");
    expect(harness.configService.getConfig().model).toBe("claude-sonnet-4.5");
  });

  it("delegates unknown slash commands and session rename unchanged", async () => {
    const harness = await createHarness();
    const sessionId = harness.sessionService.getCurrentSessionInfo()?.sessionId;
    if (!sessionId) {
      throw new Error("Expected an active session.");
    }

    const fakeSession = harness.gateway.getSession(sessionId);
    if (!fakeSession) {
      throw new Error("Expected fake session to exist.");
    }

    fakeSession.setResponse("/session rename demo", "renamed");
    fakeSession.setResponse("/unknown foo", "delegated");

    await expect(harness.router.execute("/session rename demo")).resolves.toMatchObject({ output: "renamed" });
    await expect(harness.router.execute("/unknown foo")).resolves.toMatchObject({ output: "delegated" });
    expect(fakeSession.sentInputs).toEqual(expect.arrayContaining(["/session rename demo", "/unknown foo"]));
  });

  it("delegates /skills commands unchanged to the active Copilot session", async () => {
    const harness = await createHarness();
    const sessionId = harness.sessionService.getCurrentSessionInfo()?.sessionId;
    if (!sessionId) {
      throw new Error("Expected an active session.");
    }

    const fakeSession = harness.gateway.getSession(sessionId);
    if (!fakeSession) {
      throw new Error("Expected fake session to exist.");
    }

    const skillsCommand = '/skills info "find-skills" --json';
    fakeSession.setResponse(skillsCommand, "skills passthrough");

    await expect(harness.router.execute(skillsCommand)).resolves.toMatchObject({ output: "skills passthrough" });
    expect(fakeSession.sentInputs).toContain(skillsCommand);
  });

  it("uses SDK auth status for /user show", async () => {
    const harness = await createHarness();
    const result = await harness.router.execute("/user show");

    expect(result.output).toContain("octocat");
    expect(result.output).toContain("authenticated: true");
  });

  it("summarizes usage after chat messages", async () => {
    const harness = await createHarness();
    await harness.router.execute("hello world");
    const result = await harness.router.execute("/usage");

    expect(result.output).toContain("assistantMessages");
    expect(result.output).toContain("slashCommands");
  });

  it("returns an exit signal for /quit", async () => {
    const harness = await createHarness();
    const result = await harness.router.execute("/quit");

    expect(result.exit).toBe(true);
  });
});
