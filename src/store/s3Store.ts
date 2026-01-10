import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import type { Kind } from "./localStore.js";

export interface S3StoreConfig {
  region: string;
  bucket: string;
  prefix: string; // e.g. "openapi-contracts"
}

export interface S3Store {
  list(kind: Kind): Promise<string[]>;
  load(kind: Kind, name: string): Promise<any>;
}

export function createS3Store(cfg: S3StoreConfig): S3Store {
  if (!cfg.bucket) throw new Error("S3_BUCKET is required when S3_ENABLED=true");

  const s3 = new S3Client({ region: cfg.region });

  function cleanPrefix() {
    return cfg.prefix.replace(/\/+$/, "");
  }

  function prefixFor(kind: Kind) {
    return `${cleanPrefix()}/${kind}/`;
  }

  function keyFor(kind: Kind, name: string) {
    if (!name.endsWith(".json")) throw new Error(`S3 contract must be .json: ${name}`);
    return `${cleanPrefix()}/${kind}/${name}`;
  }

  return {
    async list(kind) {
      const prefix = prefixFor(kind);
      const out: string[] = [];

      let token: string | undefined;
      do {
        const resp = await s3.send(
          new ListObjectsV2Command({
            Bucket: cfg.bucket,
            Prefix: prefix,
            ContinuationToken: token
          })
        );

        for (const obj of resp.Contents ?? []) {
          const key = obj.Key ?? "";
          if (!key.endsWith(".json")) continue;
          const name = key.substring(prefix.length);
          if (name) out.push(name);
        }

        token = resp.IsTruncated ? resp.NextContinuationToken : undefined;
      } while (token);

      return out.sort((a, b) => a.localeCompare(b));
    },

    async load(kind, name) {
      const Key = keyFor(kind, name);
      const resp = await s3.send(
        new GetObjectCommand({
          Bucket: cfg.bucket,
          Key
        })
      );

      if (!resp.Body) throw new Error(`Empty S3 body for s3://${cfg.bucket}/${Key}`);

      const text = await streamToString(resp.Body as any);
      return JSON.parse(text);
    }
  };
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}