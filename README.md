# OpenAPI Contracts MCP Server

An MCP (Model Context Protocol) server for managing, browsing, and comparing OpenAPI contracts between providers and consumers. This server enables AI assistants like Claude to access and analyze OpenAPI specifications for contract testing and compatibility validation.

## 🌟 Features

- 📄 **MCP Resources**: Browse and read OpenAPI contracts as MCP resources
- 🔍 **Contract Comparison**: Diff provider and consumer contracts to identify breaking changes
- ✅ **Compatibility Validation**: Check if consumer changes are compatible with provider specs
- 💾 **Flexible Storage**: Local filesystem and/or AWS S3 support
- 🚀 **Easy Integration**: Works with VS Code, Claude Desktop, and any MCP client
- 🔄 **Auto-dereferencing**: Automatically resolves $ref pointers in OpenAPI specs
- 📝 **JSON Format**: Supports OpenAPI 3.0+ specifications in JSON format

## 📋 Table of Contents

- [What is MCP?](#what-is-mcp)
- [Why Use This MCP Server?](#why-use-this-mcp-server)
- [Installation](#installation)
- [Configuration](#configuration)
  - [VS Code Setup](#vs-code-setup)
  - [Claude Desktop Setup](#claude-desktop-setup)
- [Usage](#usage)
- [MCP Resources](#mcp-resources)
- [MCP Tools](#mcp-tools)
- [Project Structure](#project-structure)
- [Examples](#examples)

## 🤔 What is MCP?

**Model Context Protocol (MCP)** is an open protocol that enables AI assistants to securely connect to external data sources and tools. In this context:

- **MCP Server** (this project): Exposes OpenAPI contracts and comparison tools that AI assistants can use
- **MCP Client**: An application that connects to MCP servers (e.g., VS Code with GitHub Copilot, Claude Desktop)
- **MCP Agent**: The AI assistant (e.g., Claude, GitHub Copilot) that uses the resources and tools provided by the server

### How It Works

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│   AI Assistant  │ ◄─────► │   MCP Client    │ ◄─────► │   MCP Server     │
│  (Claude/Copilot)│         │(VS Code/Desktop)│         │ (This Project)   │
└─────────────────┘         └─────────────────┘         └──────────────────┘
                                                                  │
                                                                  ▼
                                                         ┌──────────────────┐
                                                         │ OpenAPI Contracts│
                                                         │  Local / S3      │
                                                         └──────────────────┘
```

When you ask the AI assistant about OpenAPI contracts, it can:
1. **Browse** available contracts via MCP resources
2. **Read** contract specifications
3. **Compare** provider vs consumer contracts
4. **Validate** compatibility between versions

## 🎯 Why Use This MCP Server?

### Benefits Over Direct Copy-Paste

You might wonder: "Why not just copy-paste OpenAPI contracts into AI chat?" Here are the key advantages:

#### 1. **Centralized Contract Management**
- **Single Source of Truth**: Store all provider and consumer contracts in one location
- **Version Control**: Track contract changes over time with Git
- **Team Collaboration**: Share contracts across your organization via S3
- **No Manual Updates**: AI always accesses the latest version automatically

#### 2. **Structured Access & Discovery**
- **Automatic Indexing**: List all available contracts with `openapi://index`
- **Organized by Role**: Separate provider and consumer contracts
- **Multi-Source Support**: Access both local and S3-stored contracts seamlessly
- **Resource Templates**: Standard URIs for predictable access patterns

#### 3. **AI Context Efficiency**
- **Reduced Token Usage**: AI can fetch only the contracts it needs, when it needs them
- **Persistent Context**: Contracts are available across multiple chat sessions
- **Smart Caching**: Frequently accessed specs are cached for performance
- **No Repetition**: Never paste the same contract multiple times

#### 4. **Advanced Tooling**
- **Contract Comparison**: Built-in `diff_contracts` tool shows breaking changes
- **Compatibility Validation**: `validate_compatibility` ensures provider-consumer alignment
- **Automated Analysis**: AI can compare multiple versions without manual intervention
- **Error Prevention**: Catch breaking changes before deployment

#### 5. **Enterprise Features**
- **S3 Integration**: Store contracts in cloud storage for distributed teams
- **Access Control**: Use IAM roles and policies for security
- **Scalability**: Handle hundreds of contracts without cluttering your workspace
- **Audit Trail**: Track which contracts are accessed and when

#### 6. **Developer Experience**
- **IDE Integration**: Access contracts directly in VS Code via MCP
- **No Context Switching**: Stay in your development environment
- **Intelligent Suggestions**: AI can proactively suggest relevant contracts
- **Workflow Automation**: Integrate with CI/CD pipelines

### Example Workflow

**Without MCP Server** ❌
```
1. Find contract file in your project
2. Open it in editor
3. Copy entire content
4. Paste into AI chat
5. Ask AI to analyze
6. Repeat for each contract
7. Manually track versions
```

**With MCP Server** ✅
```
1. Ask: "Compare banking-api-v4 and v5"
2. AI automatically fetches both contracts
3. AI uses diff_contracts tool
4. Get detailed breaking changes analysis
5. All contracts always up-to-date
```

### Real-World Use Cases

1. **API Versioning**: Quickly compare v1, v2, v3 to understand evolution
2. **Consumer Validation**: Ensure mobile app still works after API changes
3. **Documentation Generation**: AI generates docs from latest contracts
4. **Breaking Change Detection**: Automated checks before deployment
5. **Contract Testing**: Validate consumer expectations against provider specs

### When to Use Direct Copy-Paste

Direct paste might be simpler for:
- One-time analysis of a single contract
- Contracts not stored in your workspace
- Quick prototyping without setup

But for **production workflows**, **team collaboration**, and **ongoing API development**, this MCP server provides significant value! 🚀

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- (Optional) AWS credentials for S3 support

### Install Dependencies

```bash
npm install
```

### Build the Server

```bash
npm run build
```

### Run Tests

```bash
# Run all tests
npm test

## ⚙️ Configuration

### Environment Variables

Create a `.env` file or set these environment variables:

```bash
# Local Storage (default)
OPENAPI_CONTRACT_DIR=./contracts    # Path to local contracts directory

# AWS S3 (optional)
S3_ENABLED=false                    # Set to 'true' to enable S3
AWS_REGION=us-east-1               # Your AWS region
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY  # Your AWS access key ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET  # Your AWS secret access key
S3_BUCKET=my-openapi-contracts     # S3 bucket name
S3_PREFIX=openapi-contracts        # Prefix path in bucket

# Debug
DEBUG_MCP=false                    # Set to 'true' for verbose logging
```

### AWS S3 Configuration

To use AWS S3 for storing contracts:

1. **Set S3_ENABLED to true**
2. **Provide AWS credentials** using one of these methods:

   **Option 1: Environment Variables** (Recommended for development)
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key-id
   export AWS_SECRET_ACCESS_KEY=your-secret-access-key
   export AWS_REGION=us-east-1
   ```

   **Option 2: AWS Credentials File** (Recommended for production)
   ```bash
   # Create ~/.aws/credentials
   [default]
   aws_access_key_id = your-access-key-id
   aws_secret_access_key = your-secret-access-key
   ```

   **Option 3: IAM Role** (Recommended for EC2/ECS)
   - Attach an IAM role with S3 read permissions to your compute instance
   - No credentials needed in environment variables

3. **Set S3 bucket details**:
   ```bash
   S3_ENABLED=true
   S3_BUCKET=my-openapi-contracts
   S3_PREFIX=openapi-contracts
   ```

4. **Required IAM Permissions**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::my-openapi-contracts",
           "arn:aws:s3:::my-openapi-contracts/*"
         ]
       }
     ]
   }
   ```

**Security Note**: Never commit AWS credentials to version control. Use `.env` files (excluded in `.gitignore`) or AWS credential files.

### Directory Structure

Organize your OpenAPI contracts:

```
contracts/
├── provider/                # Provider API specifications (JSON files)
│   ├── banking-api-v1.json
│   ├── banking-api-v2.json
│   └── banking-api-v3.json
└── consumer/                # Consumer contract expectations (JSON files)
    ├── mobile-app-consumer.json
    ├── web-portal-consumer.json
    └── api-gateway-consumer.json
```

**Important:** All OpenAPI specification files must be in **JSON format** with `.json` extension. YAML files are not currently supported.

## 🔧 VS Code Setup

To use this MCP server with GitHub Copilot in VS Code:

### 1. Install VS Code Extension

Install the **GitHub Copilot** extension from the VS Code marketplace.

### 2. Configure MCP Server

Create or edit `.vscode/mcp.json` in your home directory or project root:

**Location:**
- **macOS/Linux**: `~/.vscode/mcp.json` or project's `.vscode/mcp.json`
- **Windows**: `%USERPROFILE%\.vscode\mcp.json`

**Development Mode Configuration:**

```json
{
  "servers": {
    "openapi-contract-navigator": {
      "command": "npm",
      "args": [
        "run",
        "dev"
      ],
      "env": {
        "OPENAPI_CONTRACT_DIR": "/Users/apoorva/Lab/mcp/openapi-contracts-mcp-server/contracts",
        "S3_ENABLED": "true",
        "AWS_REGION": "eu-west-2",
        "S3_BUCKET": "openapi-contracts-adx",
        "S3_PREFIX": "openapi-contracts",
        "DEBUG_MCP": "false"
      },
      "cwd": "/absolute/path/to/openapi-contracts-mcp-server"
    }
  }
}
```

**Production Mode Configuration:**

```json
{
  "servers": {
    "openapi-contract-navigator": {
      "command": "node",
      "args": ["build/index.js"],
      "env": {
        "OPENAPI_CONTRACT_DIR": "/absolute/path/to/contracts",
        "S3_ENABLED": "false",
        "AWS_REGION": "us-east-1",
        "S3_BUCKET": "my-openapi-contracts",
        "S3_PREFIX": "openapi-contracts",
        "DEBUG_MCP": "false"
      },
      "cwd": "/absolute/path/to/openapi-contract-mcp-server"
    }
  }
}
```

**AWS Credentials:**

For S3 access, provide credentials via:

1. **Environment variables in mcp.json** (Quick setup, less secure):
   ```json
   "env": {
     "AWS_ACCESS_KEY_ID": "your-access-key-id",
     "AWS_SECRET_ACCESS_KEY": "your-secret-access-key"
   }
   ```

2. **AWS credentials file** (Recommended, more secure):
   - Create `~/.aws/credentials`:
     ```ini
     [default]
     aws_access_key_id = your-access-key-id
     aws_secret_access_key = your-secret-access-key
     ```
   - AWS SDK will automatically use these credentials

3. **IAM Role** (Best for EC2/ECS):
   - No credentials needed in configuration

**Important Notes:**
- Use absolute paths for `OPENAPI_CONTRACT_DIR` and `cwd`
- Development mode (`npm run dev`) uses `tsx` for hot reload
- Production mode requires running `npm run build` first
- ⚠️ **Never commit AWS credentials to version control**

### 3. Restart VS Code

Restart VS Code to load the MCP server.

### 4. Verify Connection

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and look for MCP-related commands, or ask Copilot:

```
"List all OpenAPI contracts"
"Compare banking-api-v1 and banking-api-v2"
```

## 🖥️ Claude Desktop Setup

To use this MCP server with Claude Desktop:

### 1. Locate Claude Config

Find your Claude Desktop configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### 2. Add Server Configuration

Edit `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openapi-contract-navigator": {
      "command": "node",
      "args": [
        "/Users/apoorva/Lab/mcp/openapi-contracts-mcp-server/build/index.js"
      ],
      "env": {
        "OPENAPI_CONTRACT_DIR": "/Users/apoorva/Lab/mcp/openapi-contracts-mcp-server/contracts",
        "S3_ENABLED": "true",
        "AWS_REGION": "eu-west-2",
        "S3_BUCKET": "openapi-contracts-adx",
        "S3_PREFIX": "openapi-contracts",
        "DEBUG_MCP": "false"
      }
    }
  }
}
```

**AWS Credentials:**

For S3 access, provide credentials via:

1. **Environment variables in config** (Quick setup):
   ```json
   "env": {
     "AWS_ACCESS_KEY_ID": "your-access-key-id",
     "AWS_SECRET_ACCESS_KEY": "your-secret-access-key"
   }
   ```

2. **AWS credentials file** (Recommended, more secure):
   - Create `~/.aws/credentials`:
     ```ini
     [default]
     aws_access_key_id = your-access-key-id
     aws_secret_access_key = your-secret-access-key
     ```
   - AWS SDK will automatically use these credentials
   - **No need to add credentials to the config file**

3. **IAM Role** (Best for EC2/ECS):
   - No credentials needed in configuration

**Important Notes:**
- Use absolute paths for all file paths
- Ensure the server is built: `npm run build`
- ⚠️ **Never commit AWS credentials to version control**
- If using AWS credentials file, omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from the config

### 3. Restart Claude Desktop

Completely quit and restart Claude Desktop.

### 4. Verify Connection

In Claude, you should see a 🔌 icon indicating connected MCP servers. You can now ask:

```
"Show me all available OpenAPI provider contracts"
"What are the differences between banking-api-v1 and banking-api-v2?"
"Validate if mobile-app-consumer is compatible with banking-api-v3"
```

## 📖 Usage

### Run in Development Mode

```bash
npm run dev
```

### Run in Production Mode

```bash
npm run build
npm start
```

### Standalone Testing

You can also run the server standalone for testing:

```bash
node build/index.js
```

The server communicates via stdio (standard input/output) using the MCP protocol.

## 📚 MCP Resources

The server exposes OpenAPI contracts as resources that can be read by AI assistants:

### Available Resources

| Resource URI | Description |
|-------------|-------------|
| `openapi://index` | Index of all available contracts (local & S3) |
| `openapi://server/info` | Server configuration information |
| `openapi://contracts/local/provider` | List of local provider contracts |
| `openapi://contracts/local/consumer` | List of local consumer contracts |
| `openapi://spec/local/provider/{name}` | Read a specific local provider contract |
| `openapi://spec/local/consumer/{name}` | Read a specific local consumer contract |
| `openapi://contracts/s3/provider` | List of S3 provider contracts (if enabled) |
| `openapi://contracts/s3/consumer` | List of S3 consumer contracts (if enabled) |
| `openapi://spec/s3/provider/{name}` | Read a specific S3 provider contract |
| `openapi://spec/s3/consumer/{name}` | Read a specific S3 consumer contract |

### Accessing Resources

When chatting with Claude or Copilot, reference resources naturally:

```
"Read the banking-api-v1 provider contract"
"Show me the mobile-app-consumer specification"
"List all available contracts"
```

The AI will automatically use the appropriate resource URI.

## 🛠️ MCP Tools

The server provides tools for contract analysis:

### 1. `diff_contracts`

Compare two OpenAPI contracts and identify differences.

**Parameters:**
- `base`: The baseline contract (`{source: "local"|"s3", kind: "provider"|"consumer", name: "filename"}`)
- `compare`: The contract to compare (`{source, kind, name}`)

**Example Request (via AI):**
```
"Compare banking-api-v1 (provider) with banking-api-v2 (provider)"
```

**Returns:**
- Breaking changes
- Non-breaking changes
- Unclassified changes
- Summary statistics

### 2. `validate_compatibility`

Check if a consumer contract is compatible with a provider contract.

**Parameters:**
- `provider`: Provider contract reference (`{source, name}`)
- `consumer`: Consumer contract reference (`{source, name}`)

**Example Request (via AI):**
```
"Is mobile-app-consumer compatible with banking-api-v3?"
"Validate compatibility between web-portal-consumer and banking-api-v2"
```

**Returns:**
- Compatibility status (compatible/incompatible)
- List of breaking changes (if any)
- Detailed diff information

## 📁 Project Structure

```
openapi-contracts-mcp-server/
├── contracts/                    # Local contract storage
│   ├── provider/                 # Provider OpenAPI specs
│   │   ├── banking-api-v1.json
│   │   ├── banking-api-v2.json
│   │   └── banking-api-v3.json
│   └── consumer/                 # Consumer OpenAPI specs
│       ├── mobile-app-consumer.json
│       └── web-portal-consumer.json
├── src/
│   ├── index.ts                  # Main MCP server entry point
│   ├── env.ts                    # Environment configuration
│   ├── resources/
│   │   └── contracts.resources.ts # MCP resource definitions
│   ├── store/
│   │   ├── specStore.ts          # Main storage interface
│   │   ├── localStore.ts         # Local filesystem storage
│   │   └── s3Store.ts            # AWS S3 storage
│   ├── tools/
│   │   ├── diff.tool.ts          # Contract diff tool
│   │   └── dereferenceOpenApi.ts # OpenAPI $ref resolver
│   └── utils/
│       ├── logger.ts             # Logging utilities
│       ├── normalize.ts          # Path normalization
│       └── temp.ts               # Temporary file handling
├── build/                        # Compiled JavaScript output
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 💡 Examples

### Example 1: List All Contracts

**User:** "List all OpenAPI contracts"

**AI Response:**
```
I found the following contracts:

Local Providers:
- banking-api-v1.json
- banking-api-v2.json
- banking-api-v3.json

Local Consumers:
- mobile-app-consumer.json
- web-portal-consumer.json
```

### Example 2: Compare Two Versions

**User:** "What changed between banking-api-v1 and banking-api-v2?"

**AI Response:**
```
Comparing banking-api-v1.json (base) with banking-api-v2.json:

Breaking Changes (2):
- Removed endpoint: DELETE /api/v1/accounts/{id}
- Changed response schema for GET /api/v1/users (removed field: phoneNumber)

Non-Breaking Changes (3):
- Added endpoint: POST /api/v2/transfers
- Added optional field 'email' to User schema
- Updated description for /api/v1/accounts endpoint
```

### Example 3: Validate Compatibility

**User:** "Is mobile-app-consumer compatible with banking-api-v3?"

**AI Response:**
```
✅ Compatible

The mobile-app-consumer contract is compatible with banking-api-v3.
No breaking changes detected. The provider API satisfies all consumer expectations.
```

### Example 4: Read Specific Contract

**User:** "Show me the banking-api-v1 contract"

**AI Response:**
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Banking API",
    "version": "1.0.0"
  },
  "paths": {
    "/api/v1/accounts": {
      "get": { ... }
    }
  }
}
```

## 🔐 Security Considerations

- **S3 Access**: Ensure AWS credentials have appropriate read-only permissions
- **Local Files**: The server only reads files from the configured directory
- **No Write Operations**: This server does not modify contracts
- **Stdio Communication**: MCP uses stdio, which is secure for local processes

## 🐛 Troubleshooting

### Server Not Connecting

1. **Check paths**: Ensure all paths in config are absolute
2. **Verify build**: Run `npm run build` to ensure the server is compiled
3. **Check logs**: Enable `DEBUG_MCP=true` for verbose logging
4. **Restart client**: Completely restart VS Code or Claude Desktop

### S3 Access Issues

1. **AWS Credentials**: Ensure `~/.aws/credentials` is configured
2. **Bucket Permissions**: Verify IAM permissions for S3 bucket access
3. **Region**: Check that `AWS_REGION` matches your bucket's region

### Contracts Not Found

1. **Directory Path**: Verify `OPENAPI_CONTRACT_DIR` points to correct location
2. **File Structure**: Ensure contracts are in `provider/` and `consumer/` subdirectories
3. **File Format**: Contracts must be valid **JSON** files with `.json` extension
   - ✅ Supported: `banking-api-v1.json`
   - ❌ Not supported: `banking-api-v1.yaml`, `banking-api-v1.yml`
4. **Valid OpenAPI**: Files must be valid OpenAPI 3.0+ specifications

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 🔗 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [OpenAPI Specification](https://swagger.io/specification/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)

---

**Built with ❤️ for contract-driven API development**
