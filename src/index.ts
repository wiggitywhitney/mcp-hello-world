/**
 * MCP Hello World Server
 *
 * Creates an MCP server that Claude can connect to. MCP (Model Context Protocol)
 * is a standard way to give AI assistants access to external tools and data.
 *
 * This server has two tools:
 * - "hello" - returns "world" (static example)
 * - "polyglot" - returns "world" in the language of the input greeting (uses LangChain)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

/**
 * Zod validates tool parameters. MCP uses it to check inputs before your handler runs.
 */
import { z } from "zod";

/**
 * ChatAnthropic is LangChain's wrapper for calling Claude.
 * It handles API auth, message formatting, and response parsing.
 */
import { ChatAnthropic } from "@langchain/anthropic";

/**
 * Creates and configures the MCP server with its tools.
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: "hello-world-server",
    version: "1.0.0",
  });

  /**
   * The "hello" tool - a minimal example.
   * Takes no parameters, returns "world".
   *
   * Uses registerTool (the new API) instead of the deprecated tool() method.
   * The config object groups description and inputSchema together.
   */
  server.registerTool(
    "hello",
    {
      description: "A simple greeting tool. Call this tool to receive a 'world' response.",
    },
    async () => {
      return {
        content: [{ type: "text" as const, text: "world" }],
      };
    }
  );

  /**
   * The "polyglot" tool - demonstrates MCP + LangChain integration.
   *
   * This is "Claude calling Claude": the host Claude calls this MCP tool,
   * which uses LangChain to call another Claude instance via the API.
   *
   * Uses registerTool with inputSchema to define parameters.
   */
  server.registerTool(
    "polyglot",
    {
      description:
        "Responds to greetings in any language with 'world' in that same language. " +
        "Send a greeting like 'hello', 'hola', 'bonjour', or 'こんにちは' and receive " +
        "'world' translated into that language.",
      inputSchema: {
        greeting: z
          .string()
          .describe("A greeting in any language, like 'hello', 'hola', or 'bonjour'"),
      },
    },
    async ({ greeting }) => {
      /**
       * Create ChatAnthropic inside the handler (per-call) for clarity.
       * In production you might reuse a single instance for efficiency.
       * API key comes from ANTHROPIC_API_KEY env var (injected by Teller).
       */
      const model = new ChatAnthropic({
        model: "claude-haiku-4-5-20251001",
      });

      const prompt = `Given the greeting "${greeting}", reply with the word "world" in that language. One word only. Example: hello → world`;

      try {
        const response = await model.invoke(prompt);

        // response.content can be string or array of content blocks
        const responseText =
          typeof response.content === "string"
            ? response.content
            : response.content
                .filter((block): block is { type: "text"; text: string } => block.type === "text")
                .map((block) => block.text)
                .join("");

        return {
          content: [{ type: "text" as const, text: responseText.trim() }],
        };
      } catch (error) {
        // Return error as text so Claude gets a useful message
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        return {
          content: [{ type: "text" as const, text: `Error calling LLM: ${errorMessage}` }],
        };
      }
    }
  );

  return server;
}

/**
 * Starts the MCP server using stdio transport.
 * Stdio is the standard transport - Claude launches the server as a subprocess
 * and communicates through stdin/stdout.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr because stdout is reserved for MCP protocol messages
  console.error("Hello World MCP server is running");
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
