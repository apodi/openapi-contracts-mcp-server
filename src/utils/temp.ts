import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export async function writeTempJsonFile(fileName: string, json: any): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "openapi-mcp-"));
  const safeName = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  const full = path.join(dir, safeName);
  await fs.writeFile(full, JSON.stringify(json, null, 2), "utf-8");
  return full;
}