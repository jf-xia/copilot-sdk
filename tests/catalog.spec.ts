import { describe, expect, it } from "vitest";

import { COMMAND_CATALOG, findCommand } from "../src/commands/catalog.js";

describe("COMMAND_CATALOG", () => {
  it("covers every documented command and alias from the reference sheet", () => {
    const documentedTokens = [
      "/add-dir",
      "/agent",
      "/allow-all",
      "/yolo",
      "/clear",
      "/new",
      "/compact",
      "/context",
      "/cwd",
      "/cd",
      "/delegate",
      "/diff",
      "/exit",
      "/quit",
      "/experimental",
      "/feedback",
      "/fleet",
      "/help",
      "/ide",
      "/init",
      "/list-dirs",
      "/login",
      "/logout",
      "/lsp",
      "/mcp",
      "/model",
      "/models",
      "/plan",
      "/plugin",
      "/rename",
      "/reset-allowed-tools",
      "/resume",
      "/review",
      "/session",
      "/share",
      "/skills",
      "/terminal-setup",
      "/theme",
      "/usage",
      "/user",
    ];

    for (const token of documentedTokens) {
      expect(findCommand(token), `${token} should resolve from the command catalog`).toBeDefined();
    }
  });

  it("uses unique primary command names", () => {
    const primaryNames = COMMAND_CATALOG.map((command) => command.name);
    expect(new Set(primaryNames).size).toBe(primaryNames.length);
  });
});