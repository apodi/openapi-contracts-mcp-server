import type { Kind } from "./localStore.js";
import { createLocalStore } from "./localStore.js";
import { createS3Store } from "./s3Store.js";
import { normalizeSpec } from "../utils/normalize.js";

export type Source = "local" | "s3";

export interface SpecStoreConfig {
  localContractsDir: string;
  s3?: { region: string; bucket: string; prefix: string };
}

export interface SpecStore {
  isS3Enabled(): boolean;
  listContracts(source: Source, kind: Kind): Promise<string[]>;
  loadSpec(source: Source, kind: Kind, name: string): Promise<any>;
  getSafeInfo(): any;
}

export function createSpecStore(cfg: SpecStoreConfig): SpecStore {
  const local = createLocalStore(cfg.localContractsDir);
  const s3 = cfg.s3 ? createS3Store(cfg.s3) : null;

  // Cache normalized specs (resource reads are naturally cacheable)
  const cache = new Map<string, any>();

  return {
    isS3Enabled() {
      return !!s3;
    },

    async listContracts(source, kind) {
      if (source === "local") return local.list(kind);
      if (source === "s3") {
        if (!s3) throw new Error("S3 is not enabled.");
        return s3.list(kind);
      }
      throw new Error(`Unknown source: ${source}`);
    },

    async loadSpec(source, kind, name) {
      const key = `${source}:${kind}:${name}`;
      if (cache.has(key)) return cache.get(key);

      const raw =
        source === "local"
          ? await local.load(kind, name)
          : await (s3 ? s3.load(kind, name) : Promise.reject(new Error("S3 is not enabled.")));

      const normalized = normalizeSpec(raw);
      cache.set(key, normalized);
      return normalized;
    },

    getSafeInfo() {
      return {
        localContractsDir: cfg.localContractsDir,
        s3Enabled: !!s3,
        s3: s3 ? { region: cfg.s3!.region, bucket: cfg.s3!.bucket, prefix: cfg.s3!.prefix } : undefined
      };
    }
  };
}