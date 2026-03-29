import type { PermissionHandler, PermissionRequest, PermissionRequestResult } from "@github/copilot-sdk";

import type { AppConfig } from "../types.js";
import { isPathInsideDirectory, normalizeDirectory } from "../storage/path-utils.js";
import { ConfigService } from "./config-service.js";

const APPROVED: PermissionRequestResult = { kind: "approved" };

export class PermissionService {
  constructor(private readonly configService: ConfigService) {}

  createHandler(): PermissionHandler {
    return (request) => this.handlePermissionRequest(request, this.configService.getConfig());
  }

  handlePermissionRequest(request: PermissionRequest, config: AppConfig): PermissionRequestResult {
    if (config.allowAll) {
      return APPROVED;
    }

    if (request.kind === "read" || request.kind === "write") {
      const fileName = typeof request.fileName === "string" ? request.fileName : undefined;

      if (fileName && this.isFileAllowed(fileName, config)) {
        return APPROVED;
      }

      return {
        kind: "denied-by-rules",
        rules: [`${request.kind} access is limited to the working directory or explicitly allowed directories.`],
      };
    }

    return { kind: "denied-no-approval-rule-and-could-not-request-from-user" };
  }

  private isFileAllowed(fileName: string, config: AppConfig): boolean {
    const normalizedFileName = normalizeDirectory(fileName, config.workingDirectory);

    return config.allowedDirectories.some((directory) => isPathInsideDirectory(normalizedFileName, directory));
  }
}