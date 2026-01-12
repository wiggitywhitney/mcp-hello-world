/**
 * MCP Hello World Server
 *
 * This file creates an MCP (Model Context Protocol) server that Claude can connect to.
 * MCP is a standard way to give AI assistants access to external tools and data.
 *
 * How it works:
 * 1. We create a "server" that knows how to speak the MCP protocol
 * 2. We register "tools" that the server can offer to Claude
 * 3. We connect the server to a "transport" (the communication channel)
 * 4. Claude discovers our tools and can call them during conversations
 *
 * This server has one tool: "hello" - when called, it returns "world"
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * LangChain imports for AI-powered tools.
 *
 * ChatAnthropic: The LangChain wrapper for Claude. It handles:
 * - API authentication (uses ANTHROPIC_API_KEY env var)
 * - Message formatting (converts LangChain messages to Anthropic format)
 * - Response parsing (converts Anthropic responses back to LangChain format)
 *
 * This import validates that our LangChain setup is working correctly.
 * The polyglot tool will use this to call Claude for language detection.
 */
import { ChatAnthropic } from "@langchain/anthropic";

/**
 * Creates and configures the MCP server.
 *
 * The server is the central piece - it:
 * - Manages the list of available tools
 * - Handles incoming requests from Claude
 * - Routes tool calls to the right handler functions
 */
function createServer(): McpServer {
  /**
   * Create a new MCP server instance.
   *
   * The configuration object tells Claude what this server is:
   * - name: A unique identifier for this server
   * - version: Helps track which version is running
   */
  const server = new McpServer({
    name: "hello-world-server",
    version: "1.0.0",
  });

  /**
   * Register the "hello" tool.
   *
   * A tool has three parts:
   * 1. Name ("hello") - what Claude uses to call this tool
   * 2. Description - helps Claude understand when to use this tool
   * 3. Handler function - the code that runs when the tool is called
   *
   * The empty object {} means this tool takes no input parameters.
   * Tools can accept parameters (like strings, numbers, etc.) but this one doesn't need any.
   */
  server.tool(
    "hello",
    "A simple greeting tool. Call this tool to receive a 'world' response.",
    {},
    async () => {
      /**
       * This is the handler function - it runs when Claude calls the "hello" tool.
       *
       * The return value must follow MCP's response format:
       * - content: An array of content blocks to return
       * - type: "text" means we're returning plain text (could also be "image", etc.)
       * - text: The actual response value
       */
      return {
        content: [
          {
            type: "text" as const,
            text: "world",
          },
        ],
      };
    }
  );

  return server;
}

/**
 * Starts the MCP server and connects it to a transport.
 *
 * A "transport" is how the server communicates with Claude:
 * - StdioServerTransport: Uses standard input/output (stdin/stdout)
 *   This is the most common transport - Claude launches the server as a
 *   subprocess and sends/receives messages through the command line.
 *
 * Other transports exist (like HTTP) but stdio is the standard for local tools.
 */
async function main(): Promise<void> {
  const server = createServer();

  /**
   * Create the stdio transport.
   * This connects the server to stdin/stdout so Claude can communicate with it.
   */
  const transport = new StdioServerTransport();

  /**
   * Connect the server to the transport and start listening.
   * After this call, the server is running and waiting for requests from Claude.
   */
  await server.connect(transport);

  /**
   * Log to stderr (not stdout!) that the server is running.
   * We use stderr because stdout is reserved for MCP protocol messages.
   * Logging to stdout would corrupt the protocol communication.
   */
  console.error("Hello World MCP server is running");
}

/**
 * Entry point - start the server.
 * The .catch() ensures any startup errors are logged before exiting.
 */
main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
