import pc from "picocolors";

import type { ActiveSessionInfo } from "../types.js";

export class Renderer {
  printWelcome(session: ActiveSessionInfo, configPath: string): void {
    console.log(pc.bold("code-cli"));
    console.log(`session: ${session.sessionId}`);
    console.log(`model: ${session.model}`);
    console.log(`cwd: ${session.workingDirectory}`);
    console.log(`config: ${configPath}`);
    console.log("输入 /help 查看命令。\n");
  }

  printOutput(output?: string): void {
    if (!output) {
      return;
    }

    console.log(output);
  }

  printError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(pc.red(message));
  }
}