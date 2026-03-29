import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ConfigService } from "../src/services/config-service.js";
import { PermissionService } from "../src/services/permission-service.js";
import { ConfigStore } from "../src/storage/config-store.js";

async function createConfigService(rootDirectory: string): Promise<ConfigService> {
  const configService = new ConfigService(new ConfigStore(path.join(rootDirectory, "config.json")));
  await configService.load(rootDirectory);
  return configService;
}

describe("PermissionService", () => {
  it("allows reads inside the working directory by default", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    const result = permissionService.handlePermissionRequest(
      { kind: "read", fileName: path.join(rootDirectory, "src", "index.ts") } as never,
      configService.getConfig(),
    );

    expect(result).toEqual({ kind: "approved" });
  });

  it("allows extra directories added via config", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const extraDirectory = path.join(rootDirectory, "fixtures");
    await mkdir(extraDirectory, { recursive: true });

    const configService = await createConfigService(rootDirectory);
    await configService.addAllowedDirectory(extraDirectory);
    const permissionService = new PermissionService(configService);

    const result = permissionService.handlePermissionRequest(
      { kind: "write", fileName: path.join(extraDirectory, "output.txt") } as never,
      configService.getConfig(),
    );

    expect(result).toEqual({ kind: "approved" });
  });

  it("denies shell access until allow-all is enabled", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    expect(permissionService.handlePermissionRequest({ kind: "shell" } as never, configService.getConfig())).toEqual({
      kind: "denied-no-approval-rule-and-could-not-request-from-user",
    });

    await configService.setAllowAll(true);

    expect(permissionService.handlePermissionRequest({ kind: "shell" } as never, configService.getConfig())).toEqual({
      kind: "approved",
    });
  });
});