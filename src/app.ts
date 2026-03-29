import { CommandRouter } from "./commands/router.js";
import { ConfigService } from "./services/config-service.js";
import { SessionService } from "./services/session-service.js";
import { Renderer } from "./ui/renderer.js";
import { Repl } from "./ui/repl.js";

export interface AppRunOptions {
  prompt?: string;
  resume?: string | boolean;
}

export class CodeCliApp {
  constructor(
    private readonly sessionService: SessionService,
    private readonly commandRouter: CommandRouter,
    private readonly renderer: Renderer,
    private readonly configService: ConfigService,
    private readonly repl: Repl,
  ) {}

  async run(options: AppRunOptions): Promise<number> {
    try {
      const session = await this.sessionService.start(options.resume);

      if (options.prompt) {
        const result = await this.commandRouter.execute(options.prompt);
        this.renderer.printOutput(result.output);
        return 0;
      }

      this.renderer.printWelcome(session, this.configService.getConfigPath());
      await this.repl.run(async (line) => {
        try {
          const result = await this.commandRouter.execute(line);
          this.renderer.printOutput(result.output);
          return !result.exit;
        } catch (error) {
          this.renderer.printError(error);
          return true;
        }
      });

      return 0;
    } finally {
      this.repl.close();
      await this.sessionService.stop();
    }
  }
}