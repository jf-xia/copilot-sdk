import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import { CONFIG_VERSION, DEFAULT_MODEL, type AppConfig } from "../types.js";
import { dedupeDirectories, normalizeDirectory } from "./path-utils.js";

export function defaultConfigPath(): string {
  return path.join(homedir(), ".code-cli", "config.json");
}

export function createDefaultConfig(workingDirectory: string): AppConfig {
  const normalizedWorkingDirectory = normalizeDirectory(workingDirectory);

  return {
    version: CONFIG_VERSION,
    model: DEFAULT_MODEL,
    workingDirectory: normalizedWorkingDirectory,
    recentSessionIds: [],
    allowAll: false,
    allowedDirectories: [normalizedWorkingDirectory],
    allowedTools: [],
    theme: "auto",
  };
}

export function sanitizeConfig(config: Partial<AppConfig>, fallbackWorkingDirectory: string): AppConfig {
  const defaults = createDefaultConfig(fallbackWorkingDirectory);
  const workingDirectory = normalizeDirectory(config.workingDirectory ?? defaults.workingDirectory);
  const recentSessionIds = [...new Set((config.recentSessionIds ?? defaults.recentSessionIds).filter(Boolean))];
  const allowedDirectories = dedupeDirectories([
    workingDirectory,
    ...(config.allowedDirectories ?? defaults.allowedDirectories),
  ]);

  return {
    version: CONFIG_VERSION,
    model: config.model ?? defaults.model,
    workingDirectory,
    activeSessionId: config.activeSessionId,
    recentSessionIds,
    allowAll: config.allowAll ?? defaults.allowAll,
    allowedDirectories,
    allowedTools: [...new Set(config.allowedTools ?? defaults.allowedTools)],
    theme: config.theme ?? defaults.theme,
  };
}

export class ConfigStore {
  constructor(private readonly filePath = defaultConfigPath()) {}

  get path(): string {
    return this.filePath;
  }

  async load(fallbackWorkingDirectory: string): Promise<AppConfig> {
    try {
      const fileContents = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(fileContents) as Partial<AppConfig>;

      return sanitizeConfig(parsed, fallbackWorkingDirectory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return createDefaultConfig(fallbackWorkingDirectory);
      }

      throw error;
    }
  }

  async save(config: AppConfig): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  }
}