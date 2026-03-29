import { approveAll, type PermissionHandler, type PermissionRequest, type PermissionRequestResult } from "@github/copilot-sdk";

import type { AppConfig } from "../types.js";
import { isPathInsideDirectory, normalizeDirectory } from "../storage/path-utils.js";
import { ConfigService } from "./config-service.js";

const APPROVED: PermissionRequestResult = { kind: "approved" };
const PATH_ACCESS_RULE = "Path access is limited to the working directory or explicitly allowed directories.";
const TOOL_ACCESS_RULE = "Tool access is limited to allow-all mode or explicitly allowed tool names.";
const REQUEST_PATH_FIELDS = ["fileName", "filePath", "path", "directory", "directoryPath", "targetPath", "sourcePath"];
const REQUEST_PATH_LIST_FIELDS = ["paths", "fileNames", "directories", "directoryPaths"];

export class PermissionService {
  constructor(private readonly configService: ConfigService) {}

  createHandler(): PermissionHandler {
    return (request, invocation) => {
      const config = this.configService.getConfig();

      if (config.allowAll) {
        return approveAll(request, invocation);
      }

      return this.handlePermissionRequest(request, config);
    };
  }

  handlePermissionRequest(request: PermissionRequest, config: AppConfig): PermissionRequestResult {
    if (config.allowAll) {
      return APPROVED;
    }

    if (request.kind === "read" || request.kind === "write") {
      const requestedPaths = this.getRequestedPaths(request);

      if (requestedPaths.length > 0 && requestedPaths.every((requestedPath) => this.isFileAllowed(requestedPath, config))) {
        return APPROVED;
      }

      return {
        kind: "denied-by-rules",
        rules: [PATH_ACCESS_RULE],
      };
    }

    if (request.kind === "shell") {
      const toolName = typeof request.toolName === "string" ? request.toolName : "shell";

      if (config.allowedTools.includes(toolName) || config.allowedTools.includes("shell")) {
        return APPROVED;
      }

      return {
        kind: "denied-by-rules",
        rules: ["Shell commands are restricted unless allow-all is enabled or shell is explicitly allowed tool"],
      };
    }

    if (request.kind === "custom-tool" || request.kind === "mcp") {
      const toolName = typeof request.toolName === "string" ? request.toolName : undefined;

      if (toolName && config.allowedTools.includes(toolName)) {
        return APPROVED;
      }

      return {
        kind: "denied-by-rules",
        rules: [TOOL_ACCESS_RULE],
      };
    }

    if (request.kind === "url" || request.kind === "memory" || request.kind === "hook") {
      return {
        kind: "denied-by-rules",
        rules: ["URL/memory/hook operations are restricted unless allow-all is enabled."],
      };
    }

    return { kind: "denied-no-approval-rule-and-could-not-request-from-user" };
  }

  private getRequestedPaths(request: PermissionRequest): string[] {
    const requestedPaths: string[] = [];

    for (const field of REQUEST_PATH_FIELDS) {
      const value = request[field];

      if (typeof value === "string" && value.trim()) {
        requestedPaths.push(value);
      }
    }

    for (const field of REQUEST_PATH_LIST_FIELDS) {
      const value = request[field];

      if (!Array.isArray(value)) {
        continue;
      }

      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) {
          requestedPaths.push(entry);
        }
      }
    }

    return [...new Set(requestedPaths)];
  }

  private isFileAllowed(fileName: string, config: AppConfig): boolean {
    const normalizedFileName = normalizeDirectory(fileName, config.workingDirectory);

    return config.allowedDirectories.some((directory) => isPathInsideDirectory(normalizedFileName, directory));
  }
}