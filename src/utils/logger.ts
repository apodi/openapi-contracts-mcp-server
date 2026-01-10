import { ENV } from "../env.js";

type Level = "INFO" | "ERROR" | "DEBUG";

export function createLogger(scope: string) {
  function log(level: Level, msg: string) {
    if (level === "DEBUG" && !ENV.DEBUG_MCP) return;
    // Important: MCP uses stdout for JSON-RPC. Log to stderr only.
    console.error(`[${new Date().toISOString()}] [${scope}] [${level}] ${msg}`);
  }

  return {
    info: (m: string) => log("INFO", m),
    error: (m: string) => log("ERROR", m),
    debug: (m: string) => log("DEBUG", m)
  };
}