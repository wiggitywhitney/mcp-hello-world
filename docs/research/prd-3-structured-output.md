# Research: LangChain Structured Output (PRD #3)

**Researched**: 2026-01-13
**LangChain versions**: `@langchain/anthropic@1.3.7`, `@langchain/core@1.1.12`
**Zod version**: `4.3.5`

---

## Summary

`withStructuredOutput()` is the current, recommended approach for getting typed responses from LangChain models. The PRD's proposed approach is correct.

---

## Method Signature

From the [LangChain.js API Reference](https://v03.api.js.langchain.com/classes/langchain_anthropic.ChatAnthropic.html):

```typescript
withStructuredOutput<RunOutput>(
  outputSchema: Record<string, any> | InteropZodType<RunOutput>,
  config?: StructuredOutputMethodOptions<false>
): Runnable<BaseLanguageModelInput, RunOutput, RunnableConfig>
```

---

## Usage Pattern

```typescript
import { z } from "zod";

const schema = z.object({
  field1: z.string().describe("Description for the LLM"),
  field2: z.number().optional().describe("Another field"),
}).describe("Overall schema description");

const structuredLlm = model.withStructuredOutput(schema, { name: "SchemaName" });
const result = await structuredLlm.invoke("Your prompt here");
// result is typed: { field1: string, field2?: number }
```

---

## Configuration Options

From [StructuredOutputMethodOptions](https://v03.api.js.langchain.com/types/_langchain_core.language_models_base.StructuredOutputMethodOptions.html):

| Option | Type | Notes |
|--------|------|-------|
| `name` | `string` | **Required in practice** - Zod can't infer schema names |
| `method` | `"functionCalling" \| "jsonMode" \| "jsonSchema"` | Default varies by provider |
| `includeRaw` | `boolean` | Get raw message alongside parsed output |
| `strict` | `boolean` | OpenAI-only; not relevant for Anthropic |

---

## Critical Best Practice: Always Provide `name`

From the [official extraction tutorial](https://docs.langchain.com/oss/javascript/langchain/structured-output):

> "Even though we defined our schema with the variable name personSchema, Zod is unable to infer this name and therefore does not pass it along to the model."

**Always use:**
```typescript
model.withStructuredOutput(schema, { name: "PolyglotResponse" })
```

---

## Zod v4 Compatibility

This project uses Zod 4.3.5. There was an [open issue #8357](https://github.com/langchain-ai/langchainjs/issues/8357) about Zod v4 compatibility (June 2025), but since `@langchain/anthropic@1.3.7` and `@langchain/core@1.1.12` both depend on Zod 4.x, we are on compatible versions.

---

## Official Documentation Sources

- [ChatAnthropic API Reference](https://v03.api.js.langchain.com/classes/_langchain_anthropic.index.ChatAnthropic.html)
- [StructuredOutputMethodOptions Type](https://v03.api.js.langchain.com/types/_langchain_core.language_models_base.StructuredOutputMethodOptions.html)
- [Structured Output Concepts](https://docs.langchain.com/oss/javascript/langchain/structured-output)
