import openapiDiff from "openapi-diff";
import { dereferenceOpenApi } from "./dereferenceOpenApi.js";

export async function diffWithOpenapiDiff(
  sourceSpec: unknown,
  destinationSpec: unknown
) {
  try {
    // 🔑 CRITICAL STEP: dereference both specs in memory
    const sourceResolved = await dereferenceOpenApi(sourceSpec);
    const destinationResolved = await dereferenceOpenApi(destinationSpec);

    // Now diff fully-resolved specs
    return await openapiDiff.diffSpecs({
      sourceSpec: {
        content: JSON.stringify(sourceResolved),
        location: "openapi://memory/source",
        format: "openapi3"
      },
      destinationSpec: {
        content: JSON.stringify(destinationResolved),
        location: "openapi://memory/destination",
        format: "openapi3"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to diff OpenAPI specs: ${message}`);
  }
}
