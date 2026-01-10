#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { ENV } from "./env.js";
import { createLogger } from "./utils/logger.js";
import { createSpecStore } from "./store/specStore.js";
import { registerContractResources } from "./resources/contracts.resources.js";
import { diffWithOpenapiDiff } from "./tools/diff.tool.js";

async function main() {
  const log = createLogger("openapi-contract-navigator");
  log.info("Starting MCP server...");

  const server = new McpServer({
    name: "openapi-contract-navigator",
    version: "1.0.0"
  });

  const store = createSpecStore({
    localContractsDir: ENV.OPENAPI_CONTRACT_DIR,
    s3: ENV.S3_ENABLED
      ? { region: ENV.AWS_REGION, bucket: ENV.S3_BUCKET, prefix: ENV.S3_PREFIX }
      : undefined
  });

  registerContractResources(server, store);

  // Tool: Diff two contracts (provider/consumer aware) using openapi-diff
  server.registerTool(
    "diff_contracts",
    {
      title: "Diff OpenAPI contracts (breaking/non-breaking)",
      description:
        "Diff two OpenAPI JSON specs using openapi-diff and return structured results, including breaking changes.",
      inputSchema: z.object({
        base: z.object({
          source: z.string(),
          kind: z.string(),
          name: z.string()
        }),
        compare: z.object({
          source: z.string(),
          kind: z.string(),
          name: z.string()
        })
      }),
      outputSchema: z.object({
        breakingDifferencesFound: z.boolean(),
        nonBreakingDifferences: z.array(z.any()),
        unclassifiedDifferences: z.array(z.any()),
        breakingDifferences: z.array(z.any()).optional()
      })
    },
    async ({ base, compare }: { base: any; compare: any }) => {
      try {
        const baseSpec = await store.loadSpec(base.source, base.kind, base.name);
        const compareSpec = await store.loadSpec(compare.source, compare.kind, compare.name);

        const result = await diffWithOpenapiDiff(baseSpec, compareSpec);

        // Return the full result
        const output = {
          breakingDifferencesFound: Boolean(result.breakingDifferencesFound),
          nonBreakingDifferences: result.nonBreakingDifferences || [],
          unclassifiedDifferences: result.unclassifiedDifferences || [],
          breakingDifferences: result.nonBreakingDifferences || []
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      } catch (error) {
        console.error("Error in diff_contracts tool:", error);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error diffing contracts: ${message}` }],
          isError: true
        };
      }
    }
  );

  // Tool: Validate consumer against provider
  server.registerTool(
    "validate_compatibility",
    {
      title: "Validate consumer vs provider compatibility",
      description:
        "Contract testing helper: checks whether consumer changes introduce breaking differences compared to provider.",
      inputSchema: z.object({
        provider: z.object({
          source: z.enum(["local", "s3"]),
          name: z.string()
        }),
        consumer: z.object({
          source: z.enum(["local", "s3"]),
          name: z.string()
        })
      }),
      outputSchema: z.object({
        isCompatible: z.boolean(),
        breakingDifferencesFound: z.boolean().optional(),
        breakingDifferences: z.any().optional(),
        raw: z.any()
      })
    },
    async ({ provider, consumer }: { provider: any; consumer: any }) => {
      try {
        const providerSpec = await store.loadSpec(provider.source, "provider", provider.name);
        const consumerSpec = await store.loadSpec(consumer.source, "consumer", consumer.name);

        const result = await diffWithOpenapiDiff(providerSpec, consumerSpec);

        // Normalize the decision in an MCP-friendly way.
        const breakingFound = Boolean(result?.breakingDifferencesFound);

        const output = {
          isCompatible: !breakingFound,
          breakingDifferencesFound: breakingFound,
          breakingDifferences: result?.nonBreakingDifferences,
          raw: result
        };

        return {
          content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
          structuredContent: output
        };
      } catch (error) {
        console.error("Error in validate_compatibility tool:", error);
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: "text", text: `Error validating compatibility: ${message}` }],
          isError: true
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Server connected and waiting for requests.");
}

try {
  await main();
} catch (err: any) {
  console.error(`[${new Date().toISOString()}] [ERROR] Fatal: ${err?.stack ?? err}`);
  process.exit(1);
}