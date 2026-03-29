import type { AppConfig } from "../types.js";
import { sanitizeConfig, type ConfigStore } from "../storage/config-store.js";
import { normalizeDirectory } from "../storage/path-utils.js";

function cloneConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    recentSessionIds: [...config.recentSessionIds],
    allowedDirectories: [...config.allowedDirectories],
    allowedTools: [...config.allowedTools],
  };
}

export class ConfigService {
  private config?: AppConfig;

  constructor(private readonly store: ConfigStore) {}

  async load(initialWorkingDirectory: string): Promise<AppConfig> {
    this.config = await this.store.load(initialWorkingDirectory);
    await this.store.save(this.config);
    return this.config;
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error("Configuration has not been loaded yet.");
    }

    return this.config;
  }

  getConfigPath(): string {
    return this.store.path;
  }

  async setModel(model: string): Promise<AppConfig> {
    return this.update((draft) => {
      draft.model = model;
    });
  }

  async setWorkingDirectory(directory: string): Promise<AppConfig> {
    const workingDirectory = normalizeDirectory(directory, this.getConfig().workingDirectory);

    return this.update((draft) => {
      draft.workingDirectory = workingDirectory;
      if (!draft.allowedDirectories.includes(workingDirectory)) {
        draft.allowedDirectories.push(workingDirectory);
      }
    });
  }

  async addAllowedDirectory(directory: string): Promise<AppConfig> {
    const normalizedDirectory = normalizeDirectory(directory, this.getConfig().workingDirectory);

    return this.update((draft) => {
      draft.allowedDirectories.push(normalizedDirectory);
    });
  }

  async setAllowAll(allowAll: boolean): Promise<AppConfig> {
    return this.update((draft) => {
      draft.allowAll = allowAll;
    });
  }

  async resetAllowedTools(): Promise<AppConfig> {
    return this.update((draft) => {
      draft.allowAll = false;
      draft.allowedTools = [];
    });
  }

  async setActiveSession(sessionId?: string): Promise<AppConfig> {
    return this.update((draft) => {
      draft.activeSessionId = sessionId;

      if (!sessionId) {
        return;
      }

      draft.recentSessionIds = [sessionId, ...draft.recentSessionIds.filter((value) => value !== sessionId)].slice(0, 20);
    });
  }

  private async update(mutator: (draft: AppConfig) => void): Promise<AppConfig> {
    const currentConfig = this.getConfig();
    const draft = cloneConfig(currentConfig);
    mutator(draft);
    const nextConfig = sanitizeConfig(draft, draft.workingDirectory);
    this.config = nextConfig;
    await this.store.save(nextConfig);
    return nextConfig;
  }
}