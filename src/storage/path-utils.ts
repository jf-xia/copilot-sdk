import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export function expandHomeDirectory(value: string): string {
  if (value === "~") {
    return homedir();
  }

  if (value.startsWith("~/")) {
    return path.join(homedir(), value.slice(2));
  }

  return value;
}

export function normalizeDirectory(value: string, cwd = process.cwd()): string {
  return path.resolve(cwd, expandHomeDirectory(value));
}

export function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const absoluteFilePath = path.resolve(filePath);
  const absoluteDirectory = path.resolve(directory);
  const relativePath = path.relative(absoluteDirectory, absoluteFilePath);

  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

export function dedupeDirectories(directories: string[]): string[] {
  return [...new Set(directories.map((directory) => path.resolve(directory)))].sort((left, right) =>
    left.localeCompare(right),
  );
}

export async function collectRelativeEntries(baseDirectory: string, limit = 200): Promise<string[]> {
  const entries: string[] = [];

  async function walk(currentDirectory: string): Promise<void> {
    let directoryEntries;

    try {
      directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
    } catch {
      return;
    }

    directoryEntries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of directoryEntries) {
      if (entries.length >= limit) {
        return;
      }

      const absolutePath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      entries.push(path.relative(baseDirectory, absolutePath));
    }
  }

  await walk(baseDirectory);
  return entries;
}