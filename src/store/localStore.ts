import fs from "node:fs/promises";
import path from "node:path";

export type Kind = "provider" | "consumer";

export interface LocalStore {
  list(kind: Kind): Promise<string[]>;
  load(kind: Kind, name: string): Promise<any>;
}

export function createLocalStore(contractsDir: string): LocalStore {
  function ensureJson(name: string) {
    if (!name.endsWith(".json")) throw new Error(`Contract must be .json: ${name}`);
    return name;
  }

  async function exists(p: string) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }

  function kindDir(kind: Kind) {
    return path.join(contractsDir, kind);
  }

  async function listFiles(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
  }

  return {
    async list(kind) {
      const kd = kindDir(kind);
      if (await exists(kd)) return listFiles(kd);
      // fallback: old structure (single contracts folder)
      return listFiles(contractsDir);
    },

    async load(kind, name) {
      const file = ensureJson(name);
      const kd = kindDir(kind);
      const preferred = path.join(kd, file);
      const fallback = path.join(contractsDir, file);

      const fullPath = (await exists(preferred)) ? preferred : fallback;
      const raw = await fs.readFile(fullPath, "utf-8");
      return JSON.parse(raw);
    }
  };
}