# LangChain Polyglot Tool

This guide explains how to build an MCP tool that calls an external LLM using LangChain.

---

## What Parts Are Actually LangChain?

In this project, LangChain is just **two lines of code**:

```typescript
// Line 1: Create the model
const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001" });

// Line 2: Call the model
const response = await model.invoke(prompt);
```

Plus one import:

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
```

That's it. Everything else (MCP server setup, Zod validation, response parsing) is not LangChain.

---

## LangChain vs. Anthropic SDK: A Comparison

Here's what the polyglot tool looks like with LangChain vs. calling the Anthropic SDK directly.

**With LangChain:**

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001" });
const response = await model.invoke(prompt);
const text = response.content; // may need parsing
```

**With Anthropic SDK directly:**

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // uses ANTHROPIC_API_KEY env var
const response = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 100,
  messages: [{ role: "user", content: prompt }]
});
const text = response.content[0].text;
```

For this simple use case, both approaches are about the same complexity. The direct SDK is arguably clearer because there's no abstraction layer to learn.

---

## When Is LangChain Actually Useful?

LangChain adds value when you need its built-in patterns. Here's a real example: a RAG (Retrieval-Augmented Generation) system that answers questions from your documents.

**Without LangChain** you'd need to manually:
1. Load and chunk documents
2. Generate embeddings for each chunk
3. Store embeddings in a vector database
4. On each query: embed the question, search for similar chunks, build a prompt with context, call the LLM

**With LangChain:**

```typescript
import { ChatAnthropic } from "@langchain/anthropic";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { AnthropicEmbeddings } from "@langchain/anthropic";
import { createRetrievalChain } from "langchain/chains/retrieval";

// Load and chunk documents
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
const docs = await splitter.createDocuments([myDocumentText]);

// Create vector store with embeddings
const vectorStore = await MemoryVectorStore.fromDocuments(
  docs,
  new AnthropicEmbeddings()
);

// Create a retrieval chain
const model = new ChatAnthropic({ model: "claude-sonnet-4-20250514" });
const chain = await createRetrievalChain({
  llm: model,
  retriever: vectorStore.asRetriever(),
});

// Ask questions - LangChain handles retrieval + prompt building + LLM call
const answer = await chain.invoke({ input: "What does the document say about X?" });
```

LangChain handles the orchestration: splitting, embedding, storing, retrieving, and prompting. That's a lot of boilerplate you don't have to write.

**Other cases where LangChain helps:**
- **Agents**: LLM decides which tools to call based on the task
- **Memory**: Maintain conversation history across calls
- **Chains**: Multi-step workflows (summarize → translate → format)
- **Output parsers**: Structured JSON responses with validation

**When to skip LangChain:**
- Single API calls (like our polyglot tool)
- When you want full control over prompts and responses
- When debugging abstraction layers would slow you down

---

## LangChain in This Project

We use LangChain here for learning exposure, not because it's necessary. The polyglot tool is simple enough that the direct SDK would work just as well.

---

## Zod

Zod is a TypeScript library for validating data. MCP uses it to define what parameters a tool accepts.

When Claude calls your tool, it sends JSON. Zod automatically:
1. Checks required parameters are present
2. Verifies each parameter is the correct type
3. Rejects invalid inputs with clear errors

**Example:**

```typescript
import { z } from "zod";

// Define a schema
{ greeting: z.string() }

// Valid: { greeting: "hello" }
// Invalid: { greeting: 123 } - wrong type
// Invalid: {} - missing field
```

**Common types:**

| Zod Type | Validates | Example |
|----------|-----------|---------|
| `z.string()` | Text | `"hello"` |
| `z.number()` | Numbers | `42` |
| `z.boolean()` | True/false | `true` |
| `z.array(z.string())` | String array | `["a", "b"]` |
| `z.optional(z.string())` | String or undefined | `"hello"` or `undefined` |

**Adding descriptions:**

```typescript
{ greeting: z.string().describe("A greeting in any language") }
```

The `.describe()` text helps Claude understand what to pass.

---

## ChatAnthropic

`ChatAnthropic` is LangChain's class for calling Claude. It handles API auth, message formatting, and response parsing.

**Basic usage:**

```typescript
import { ChatAnthropic } from "@langchain/anthropic";

const model = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
});

const response = await model.invoke("What is 2 + 2?");
console.log(response.content); // "4"
```

Note: Use specific model versions (with dates) in production for consistent behavior. The alias `claude-haiku-4-5` points to the latest snapshot but may change.

**Where to create the instance?**

| Approach | Clarity | Performance |
|----------|---------|-------------|
| Inside handler (per-call) | Everything in one place | Tiny overhead each call |
| Outside handler (reused) | Split across locations | Slightly more efficient |

This implementation uses per-call because clarity matters more than micro-optimization in a learning context.

---

## The Polyglot Tool

The tool receives a greeting in any language and responds with "world" in that language.

```text
Input: "bonjour" → Output: "monde"
```

**Architecture:**

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude (host)  │────▶│   MCP Server    │────▶│  Claude (LLM)   │
│                 │◀────│  polyglot tool  │◀────│  via LangChain  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

This "model calling model" pattern is common in AI applications—an orchestrator routing to specialized models.
