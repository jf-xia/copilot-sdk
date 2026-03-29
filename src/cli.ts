import { Command } from "commander";

import { CodeCliApp } from "./app.js";
import { CommandRouter } from "./commands/router.js";
import { SdkCopilotGateway } from "./copilot/sdk-copilot-gateway.js";
import { ConfigService } from "./services/config-service.js";
import { PermissionService } from "./services/permission-service.js";
import { SessionService } from "./services/session-service.js";
import { ConfigStore } from "./storage/config-store.js";
import { Renderer } from "./ui/renderer.js";
import { Repl } from "./ui/repl.js";

export async function runCli(argv = process.argv): Promise<number> {
  const program = new Command();

  program
    .name("code-cli")
    .description("Copilot SDK powered compatibility CLI")
    .argument("[input...]", "send one prompt or slash command and exit")
    .option("-p, --prompt <text>", "send one prompt or slash command and exit")
    .option("--config <path>", "override the config file location")
    .option("--cwd <path>", "set the initial working directory")
    .option("--model <model>", "set the default model before startup")
    .option("--resume [sessionId]", "resume the active or specified session")
    .option("--log-level <level>", "SDK log level", "error");

  program.parse(argv);

  const options = program.opts<{
    prompt?: string;
    config?: string;
    cwd?: string;
    model?: string;
    resume?: string | boolean;
    logLevel: "none" | "error" | "warning" | "info" | "debug" | "all";
  }>();

  const argumentPrompt = program.args.length > 0 ? program.args.join(" ") : undefined;
  const prompt = options.prompt ?? argumentPrompt;
  const initialWorkingDirectory = options.cwd ?? process.cwd();

  const configStore = new ConfigStore(options.config);
  const configService = new ConfigService(configStore);
  await configService.load(initialWorkingDirectory);

  if (options.cwd) {
    await configService.setWorkingDirectory(options.cwd);
  }

  if (options.model) {
    await configService.setModel(options.model);
  }

  const repl = new Repl();
  const permissionService = new PermissionService(configService);
  const gateway = new SdkCopilotGateway({ logLevel: options.logLevel });
  const sessionService = new SessionService(gateway, configService, permissionService, undefined, repl);
  const commandRouter = new CommandRouter(configService, sessionService);
  const renderer = new Renderer();
  const app = new CodeCliApp(sessionService, commandRouter, renderer, configService, repl);

  return app.run({ prompt, resume: options.resume });
}