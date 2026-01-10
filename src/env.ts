export const ENV = {
  // Local contracts directory (absolute recommended for MCP clients)
  OPENAPI_CONTRACT_DIR: process.env.OPENAPI_CONTRACT_DIR ?? "./contracts",

  // S3 support
  S3_ENABLED: isTrue(process.env.S3_ENABLED),
  AWS_REGION: process.env.AWS_REGION ?? "eu-west-2",
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  S3_PREFIX: process.env.S3_PREFIX ?? "openapi-contracts",

  // Debug logging
  DEBUG_MCP: isTrue(process.env.DEBUG_MCP)
};

function isTrue(v?: string) {
  return v === "1" || v === "true" || v === "TRUE" || v === "yes";
}