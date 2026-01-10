import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpecStore } from "../store/specStore.js";
import type { Kind } from "../store/localStore.js";

/**
 * MCP SDK may pass `uri` as either `string` or `URL` depending on overload/template.
 * MCP protocol requires returned content.uri to be a string. Always stringify.
 */
function resourceJson(uri: unknown, value: unknown, mimeType = "application/json") {
  return {
    contents: [
      {
        uri: String(uri),
        mimeType,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

export function registerContractResources(server: McpServer, store: SpecStore) {
  // ---------------------------------------------------------------------------
  // Contract index resource
  // ---------------------------------------------------------------------------
  server.registerResource(
    "openapi-index",
    "openapi://index",
    {
      title: "OpenAPI Contract Index",
      description: "Lists available OpenAPI provider and consumer contracts",
      mimeType: "application/json"
    },
    async (uri) => {
      const providers = await store.listContracts("local", "provider");
      const consumers = await store.listContracts("local", "consumer");
      const s3Enabled = store.isS3Enabled();

      let s3Providers: string[] = [];
      let s3Consumers: string[] = [];

      if (s3Enabled) {
        try {
          s3Providers = await store.listContracts("s3", "provider");
          s3Consumers = await store.listContracts("s3", "consumer");
        } catch (error) {
          // If S3 fails, continue with empty arrays
          console.warn("Failed to list S3 contracts:", error);
        }
      }

      return resourceJson(uri, {
        local: {
          providers,
          consumers
        },
        s3: s3Enabled ? {
          providers: s3Providers,
          consumers: s3Consumers
        } : null,
        sources: {
          local: true,
          s3: s3Enabled
        }
      });
    }
  );

  // ---------------------------------------------------------------------------
  // Server info resource
  // ---------------------------------------------------------------------------
  server.registerResource(
    "server-info",
    "openapi://server/info",
    {
      title: "OpenAPI MCP Server Info",
      description: "Configuration summary (safe fields only).",
      mimeType: "application/json"
    },
    async (uri) => resourceJson(uri, store.getSafeInfo())
  );

  // ---------------------------------------------------------------------------
  // List local contracts (directory)
  // ---------------------------------------------------------------------------
  server.registerResource(
    "contracts-local",
    new ResourceTemplate("openapi://contracts/local/{kind}", {
      list: async () => ({
        resources: [
          { uri: "openapi://contracts/local/provider", name: "Local Provider Contracts" },
          { uri: "openapi://contracts/local/consumer", name: "Local Consumer Contracts" }
        ]
      })
    }),
    {
      title: "Contract Directory",
      description: "Lists local JSON OpenAPI contracts for provider/consumer.",
      mimeType: "application/json"
    },
    async (uri, { kind }) => {
      const k = toKind(kind);
      const contracts = await store.listContracts("local", k);
      return resourceJson(uri, { source: "local", kind: k, contracts });
    }
  );

  // ---------------------------------------------------------------------------
  // Read local OpenAPI spec
  // ---------------------------------------------------------------------------
  server.registerResource(
    "openapi-local",
    new ResourceTemplate("openapi://spec/local/{kind}/{name}", {
      list: async () => {
        const resources: Array<{ uri: string; name: string }> = [];
        for (const kind of ["provider", "consumer"] as Kind[]) {
          try {
            const contracts = await store.listContracts("local", kind);
            for (const name of contracts) {
              resources.push({
                uri: `openapi://spec/local/${kind}/${name}`,
                name
              });
            }
          } catch {
            // ignore
          }
        }
        return { resources };
      },
      complete: {
        name: async (_uri: string, context?: { arguments?: Record<string, string> }) => {
          const kind = context?.arguments?.kind ?? "";
          const name = context?.arguments?.name ?? "";
          const k = toKind(kind);
          const all = await store.listContracts("local", k);
          const prefix = String(name);
          return all.filter((n) => n.startsWith(prefix)).slice(0, 50);
        }
      }
    }),
    {
      title: "OpenAPI Contract",
      description: "Reads a local OpenAPI JSON spec.",
      mimeType: "application/json"
    },
    async (uri, { kind, name }) => {
      const k = toKind(kind);
      const spec = await store.loadSpec("local", k, String(name));
      return resourceJson(uri, spec);
    }
  );

  // ---------------------------------------------------------------------------
  // S3 resources only if enabled
  // ---------------------------------------------------------------------------
  if (store.isS3Enabled()) {
    server.registerResource(
      "contracts-s3",
      new ResourceTemplate("openapi://contracts/s3/{kind}", {
        list: async () => ({
          resources: [
            { uri: "openapi://contracts/s3/provider", name: "S3 Provider Contracts" },
            { uri: "openapi://contracts/s3/consumer", name: "S3 Consumer Contracts" }
          ]
        })
      }),
      {
        title: "Contract Directory (S3)",
        description: "Lists S3 JSON OpenAPI contracts for provider/consumer.",
        mimeType: "application/json"
      },
      async (uri, { kind }) => {
        const k = toKind(kind);
        const contracts = await store.listContracts("s3", k);
        return resourceJson(uri, { source: "s3", kind: k, contracts });
      }
    );

    server.registerResource(
      "openapi-s3",
      new ResourceTemplate("openapi://spec/s3/{kind}/{name}", {
        list: async () => {
          const resources: Array<{ uri: string; name: string }> = [];
          for (const kind of ["provider", "consumer"] as Kind[]) {
            try {
              const contracts = await store.listContracts("s3", kind);
              for (const name of contracts) {
                resources.push({
                  uri: `openapi://spec/s3/${kind}/${name}`,
                  name
                });
              }
            } catch {
              // ignore
            }
          }
          return { resources };
        },
        complete: {
          name: async (_uri: string, context?: { arguments?: Record<string, string> }) => {
            const kind = context?.arguments?.kind ?? "";
            const name = context?.arguments?.name ?? "";
            const k = toKind(kind);
            const all = await store.listContracts("s3", k);
            const prefix = String(name);
            return all.filter((n) => n.startsWith(prefix)).slice(0, 50);
          }
        }
      }),
      {
        title: "OpenAPI Contract (S3)",
        description: "Reads an S3 OpenAPI JSON spec.",
        mimeType: "application/json"
      },
      async (uri, { kind, name }) => {
        const k = toKind(kind);
        const spec = await store.loadSpec("s3", k, String(name));
        return resourceJson(uri, spec);
      }
    );
  }
}

function toKind(v: unknown): Kind {
  const s = String(v).toLowerCase();
  if (s !== "provider" && s !== "consumer") throw new Error(`Invalid kind: ${v}`);
  return s;
}
