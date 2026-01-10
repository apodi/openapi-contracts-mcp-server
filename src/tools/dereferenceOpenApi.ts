import $RefParser from "@apidevtools/json-schema-ref-parser";

/**
 * Fully dereference an OpenAPI document in memory.
 * No filesystem access. No network access.
 */
export async function dereferenceOpenApi(spec: unknown): Promise<any> {
  return await $RefParser.dereference(
    // dummy base (never used)
    "openapi://memory/spec",
    spec as any,
    {
      resolve: {
        file: false,
        http: false
      }
    }
  );
}
