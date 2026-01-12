# LangChain Polyglot Tool

This guide explains how to build an MCP tool that calls an external LLM using LangChain.

---

## LangChain

LangChain is a framework for building LLM applications. It provides a consistent interface across AI providers.

**Why use it instead of calling the API directly?**

- **Provider abstraction** - Switch from Claude to GPT by changing one line
- **Consistent interface** - Same `.invoke()` method works across all providers
- **Built-in patterns** - Chains, agents, memory ready to use

For simple tools, the direct API works fine. We use LangChain here because it's widely used in production and worth learning.

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
