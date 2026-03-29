#!/usr/bin/env node

import { runCli } from "./cli.js";

try {
  process.exitCode = await runCli(process.argv);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}