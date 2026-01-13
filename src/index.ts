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
 * Schema for the polyglot tool's structured response.
 *
 * This defines what the LLM should return when processing a greeting.
 * Each .describe() tells the LLM what to put in that field - this is how
 * structured output knows what data to extract.
 *
 * Used with LangChain's .withStructuredOutput() to get typed, validated responses
 * instead of parsing raw text.
 */
const polyglotResponseSchema = z.object({
  detectedLanguage: z.string().describe("The language of the input greeting (e.g., 'French', 'Spanish', 'Japanese')"),
  greeting: z.string().describe("The original greeting that was provided"),
  worldTranslation: z.string().describe("The word 'world' translated into the detected language"),
  languageFamily: z.string().describe("The language family (e.g., 'Romance', 'Germanic', 'Slavic', 'Japonic')"),
});

/**
 * TypeScript type inferred from the schema.
 * Use this when you need to type variables holding the structured response.
 */
type PolyglotResponse = z.infer<typeof polyglotResponseSchema>;

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
       * LANGCHAIN: Create ChatAnthropic instance and configure for structured output.
       *
       * withStructuredOutput() wraps the model to return validated, typed data
       * instead of raw text. The Zod schema (defined at top of file) tells the
       * LLM what fields to return, and LangChain validates the response.
       *
       * We must pass { name: "PolyglotResponse" } because Zod can't infer schema
       * names - without this, the model won't know what to call the output structure.
       */
      const model = new ChatAnthropic({
        model: "claude-haiku-4-5-20251001",
      });

      const structuredModel = model.withStructuredOutput(polyglotResponseSchema, {
        name: "PolyglotResponse",
      });

      const prompt = `Analyze this greeting: "${greeting}"

Determine:
1. What language is this greeting from?
2. What language family does it belong to (e.g., Romance, Germanic, Slavic, Japonic)?
3. How do you say "world" in that language?`;

      try {
        /**
         * LANGCHAIN: Call the structured model.
         *
         * Unlike regular invoke() which returns raw message content,
         * structuredModel.invoke() returns a validated object matching
         * our Zod schema. No parsing or extraction needed.
         */
        const response = await structuredModel.invoke(prompt);

        // response is typed as PolyglotResponse - return as formatted JSON
        return {
          content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
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
