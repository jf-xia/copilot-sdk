import { createInterface, type Interface } from "node:readline/promises";

import type { UserPrompter } from "../types.js";

export class Repl implements UserPrompter {
  private readonly readline: Interface;

  constructor(
    private readonly promptText = "code> ",
    input = process.stdin,
    output = process.stdout,
  ) {
    this.readline = createInterface({ input, output });
  }

  async run(handler: (line: string) => Promise<boolean | void>): Promise<void> {
    while (true) {
      let line: string;

      try {
        line = await this.readline.question(this.promptText);
      } catch {
        break;
      }

      if (!line.trim()) {
        continue;
      }

      const shouldContinue = await handler(line);
      if (shouldContinue === false) {
        break;
      }
    }
  }

  async ask(question: string): Promise<string> {
    return this.readline.question(question);
  }

  close(): void {
    this.readline.close();
  }
}