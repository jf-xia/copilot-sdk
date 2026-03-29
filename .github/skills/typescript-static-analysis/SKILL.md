---
name: typescript-static-analysis
description: Use ts-morph powered scripts to analyze an entire TypeScript project, a single file, a symbol, a method, or a parameter before refactoring or deep debugging.
---

# TypeScript Static Analysis

Use the built-in `ts-morph` workflows in this repository to inspect architecture, API surface, references, and parameter usage before making structural changes.

## Features

- Full-project hotspot analysis
- Single-file structure analysis
- Symbol and method reference analysis
- Parameter usage analysis inside a function or method body
- Refactoring and debugging guidance based on static evidence

## Predefined Scripts

Run the full project scan:

```bash
npm run analyze:project
```

Inspect one file:

```bash
npm run analyze:file -- --file src/copilot.ts
```

Inspect a symbol or qualified method name:

```bash
npm run analyze:symbol -- --name CopilotClient
npm run analyze:symbol -- --name CopilotClient.buildResumeSessionConfig --file src/copilot.ts
```

Inspect a class method with explicit arguments:

```bash
npm run analyze:method -- --class CopilotClient --name buildCreateSessionConfig --file src/copilot.ts
```

Inspect one parameter in a function or method:

```bash
npm run analyze:parameter -- --symbol CopilotClient.buildResumeSessionConfig --parameter config --file src/copilot.ts
```

Emit JSON for downstream prompts, reports, or automated tooling:

```bash
npm run analyze:project -- --format json
```

## What Each Analysis Answers

`analyze:project`

- Which files dominate the codebase
- Which files are import-only stubs or placeholders
- Which dependencies concentrate risk or integration complexity
- Which functions or methods are the best refactoring candidates

`analyze:file`

- What the file imports and exports
- Which classes, functions, types, and variables it actually owns
- Whether the file is unfinished or has no public surface

`analyze:symbol` and `analyze:method`

- Exact declaration signature
- Parameter list and return type
- Reference sites that matter before a rename, extraction, or behavior change

`analyze:parameter`

- Whether the parameter is optional, variadic, or has a default
- Whether the parameter is actually used in the implementation body
- Where the parameter affects control flow or downstream calls

## Refactoring Workflow

1. Run `analyze:project` to find the real hotspot instead of guessing from file names.
2. Run `analyze:file` on the target module to understand its boundaries and missing pieces.
3. Run `analyze:symbol` or `analyze:method` before renaming, extracting, or splitting a unit.
4. Run `analyze:parameter` before changing a method signature or debugging optional argument behavior.
5. Summarize the output into a change plan: affected files, risky call sites, and safe extraction points.

## Debugging Workflow

1. Start with the failing module or method, not the entire project.
2. Use `analyze:file` to list local declarations and imported integration points.
3. Use `analyze:method` to inspect the concrete method signature and references.
4. Use `analyze:parameter` to verify whether an argument is unused, defaulted, or forwarded incorrectly.
5. Use `--format json` when you want to feed the static facts into another diagnostic or optimization prompt.

## Current Repository Summary

- `src/copilot.ts` is the main implementation center and currently holds most of the typed business logic.
- `index.ts` keeps the public API surface narrow by re-exporting the Copilot wrapper and analysis helpers.
- `src/imapEmail.ts`, `src/sendEmail.ts`, and `src/cronjob.ts` are import-only placeholders and should be treated as implementation backlog or cleanup targets.
- Existing tests validate `CopilotClient` defaults and session configuration, so non-Copilot workflows still need deeper coverage.

## Library Usage

```typescript
import {
	analyzeFile,
	analyzeMethod,
	analyzeParameter,
	analyzeProject,
	analyzeSymbol,
} from 'mail2ai';

const projectAnalysis = analyzeProject('/path/to/your/project');
const fileAnalysis = analyzeFile('/path/to/your/project', 'src/copilot.ts');
const symbolAnalysis = analyzeSymbol('/path/to/your/project', 'CopilotClient');
const methodAnalysis = analyzeMethod('/path/to/your/project', 'CopilotClient', 'buildResumeSessionConfig', 'src/copilot.ts');
const parameterAnalysis = analyzeParameter(
	'/path/to/your/project',
	'CopilotClient.buildResumeSessionConfig',
	'config',
	'src/copilot.ts',
);

console.log({
	projectAnalysis,
	fileAnalysis,
	symbolAnalysis,
	methodAnalysis,
	parameterAnalysis,
});
```

