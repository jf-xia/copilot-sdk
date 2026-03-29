#!/usr/bin/env node

import { runCli } from "./cli.js";

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
  process.exitCode = 1;
});

process.on("uncaughtException", (error) => {
  console.error("uncaughtException:", error);
  process.exitCode = 1;
});

try {
  process.exitCode = await runCli(process.argv);
} catch (error) {
  if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error("runCli rejected with:", error);
  }
  process.exitCode = 1;
}