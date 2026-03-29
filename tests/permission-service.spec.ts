import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ConfigService } from "../src/services/config-service.js";
import { PermissionService } from "../src/services/permission-service.js";
import { ConfigStore, createDefaultConfig } from "../src/storage/config-store.js";

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

  it("allows path-based reads when the SDK sends a path field", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    const result = permissionService.handlePermissionRequest(
      { kind: "read", path: path.join(rootDirectory, "src") } as never,
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

  it("allows explicitly approved SDK tools", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    const result = permissionService.handlePermissionRequest(
      { kind: "custom-tool", toolName: "grep_search" } as never,
      { ...configService.getConfig(), allowedTools: ["grep_search"] },
    );

    expect(result).toEqual({ kind: "approved" });
  });

  it("denies shell access until allow-all is enabled", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    expect(permissionService.handlePermissionRequest({ kind: "shell" } as never, configService.getConfig())).toEqual({
      kind: "denied-by-rules",
      rules: ["Shell commands are restricted unless allow-all is enabled or shell is explicitly allowed tool"],
    });

    await configService.setAllowAll(true);

    expect(permissionService.handlePermissionRequest({ kind: "shell" } as never, configService.getConfig())).toEqual({
      kind: "approved",
    });
  });

  it("approves SDK tool requests when allow-all is enabled", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    await configService.setAllowAll(true);

    expect(
      permissionService.handlePermissionRequest(
        { kind: "custom-tool", toolName: "grep_search" } as never,
        configService.getConfig(),
      ),
    ).toEqual({ kind: "approved" });
  });

  it("approves shell requests when shell tool is explicitly allowed", async () => {
    const rootDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-permissions-"));
    const configService = await createConfigService(rootDirectory);
    const permissionService = new PermissionService(configService);

    const config = await configService.addAllowedDirectory(rootDirectory); // ensure base config exists
    const nextConfig = await configService.setAllowAll(false);
    nextConfig.allowedTools.push("shell");

    expect(
      permissionService.handlePermissionRequest(
        { kind: "shell", fullCommandText: "echo hi" } as never,
        { ...nextConfig },
      ),
    ).toEqual({ kind: "approved" });
  });

  it("keeps the current working directory in the allowed directory list when loading an existing config", async () => {
    const configRoot = await mkdtemp(path.join(tmpdir(), "code-cli-config-"));
    const previousDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-previous-"));
    const currentDirectory = await mkdtemp(path.join(tmpdir(), "code-cli-current-"));
    const store = new ConfigStore(path.join(configRoot, "config.json"));
    await store.save(createDefaultConfig(previousDirectory));

    const configService = new ConfigService(store);
    const config = await configService.load(currentDirectory);

    expect(config.allowedDirectories).toContain(previousDirectory);
    expect(config.allowedDirectories).toContain(currentDirectory);
  });
});