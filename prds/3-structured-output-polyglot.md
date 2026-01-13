# PRD #3: Structured Output for Polyglot Tool

**Status**: In Progress
**Created**: 2026-01-12
**GitHub Issue**: [#3](https://github.com/wiggitywhitney/mcp-hello-world/issues/3)

---

## Problem Statement

The polyglot tool currently returns just a plain string (e.g., "monde", "mundo"). This doesn't demonstrate any real value from using LangChain - the same result could be achieved with the raw Anthropic SDK in roughly the same amount of code.

For learning purposes, we want to show when LangChain actually adds value over direct API calls.

## Solution

Enhance the polyglot tool to use LangChain's `.withStructuredOutput()` feature, which:
1. Returns rich, validated JSON instead of a plain string
2. Integrates with Zod (already used in the project) for type-safe responses
3. Demonstrates a real LangChain pattern that would be more complex with the raw SDK

### New Response Format

**Before (plain string):**
```
"monde"
```

**After (structured output):**
```json
{
  "detectedLanguage": "French",
  "greeting": "bonjour",
  "worldTranslation": "monde",
  "languageFamily": "Romance"
}
```

## User Experience

When Claude calls the polyglot tool, it will receive structured data that it can use more intelligently in responses. For example:

> User: "Say hello in French"
> Claude calls polyglot("bonjour")
> Tool returns: { detectedLanguage: "French", greeting: "bonjour", worldTranslation: "monde", languageFamily: "Romance" }
> Claude: "In French, 'world' is 'monde'. French is part of the Romance language family."

## Technical Approach

### LangChain's withStructuredOutput

```typescript
import { z } from "zod";

const polyglotSchema = z.object({
  detectedLanguage: z.string().describe("The language of the input greeting"),
  greeting: z.string().describe("The original greeting that was provided"),
  worldTranslation: z.string().describe("The word 'world' in the detected language"),
  languageFamily: z.string().describe("The language family (e.g., Romance, Germanic, Slavic)"),
});

const structuredModel = model.withStructuredOutput(polyglotSchema);
const response = await structuredModel.invoke(prompt);
// response is now typed and validated: { detectedLanguage, greeting, worldTranslation, languageFamily }
```

### Why This Shows LangChain Value

With the raw Anthropic SDK, you'd need to:
1. Craft a prompt asking for JSON output
2. Parse the response string as JSON
3. Validate the JSON structure manually
4. Handle parsing errors

LangChain's `.withStructuredOutput()`:
1. Automatically formats the prompt for structured output
2. Parses the response
3. Validates against the Zod schema
4. Returns typed data

## Success Criteria

- [ ] Polyglot tool returns structured JSON instead of plain string
- [ ] Response includes: detectedLanguage, greeting, worldTranslation, languageFamily
- [ ] Zod schema validates the LLM response
- [ ] Documentation updated to explain the structured output pattern
- [ ] Existing greeting tests still work (verify with manual testing)
- [ ] New standalone learning document created (`docs/structured-output.md`) covering the new concepts

## Milestones

> **IMPORTANT**: Before starting any milestone, read `docs/research/prd-3-structured-output.md` for current LangChain patterns and best practices. Do not rely on training data—use the researched documentation.

- [x] **M1**: Research latest LangChain structured output documentation and best practices (avoid outdated patterns)
  - **Output**: `docs/research/prd-3-structured-output.md`

- [x] **M2**: Define Zod schema for structured polyglot response
  - **Reference**: See "Usage Pattern" in `docs/research/prd-3-structured-output.md`
  - **Key requirement**: Use `.describe()` on each field to guide the LLM

- [ ] **M3**: Implement `.withStructuredOutput()` in polyglot handler
  - **Reference**: See "Method Signature" and "Critical Best Practice" in `docs/research/prd-3-structured-output.md`
  - **Key requirement**: Always pass `{ name: "PolyglotResponse" }` as second argument

- [ ] **M4**: Update MCP tool response to return formatted structured data
  - **Reference**: See research file for expected response shape
  - **Key requirement**: Return JSON string of the structured response

- [ ] **M5**: Create new standalone learning document (`docs/structured-output.md`) - plain language, succinct, no overlap with existing docs
  - **Reference**: Use `docs/research/prd-3-structured-output.md` as source material, but rewrite for learners

- [ ] **M6**: Manual testing with various greetings to verify structured responses

## Learning Document Requirements

The new `docs/structured-output.md` must:
- **Be a new file**: Do not edit existing documents - create a standalone file for this feature
- **Use plain language**: No jargon, zero assumptions about prior knowledge
- **Be succinct**: Explain concepts clearly without unnecessary verbosity
- **Not overlap**: Don't repeat material from `langchain-polyglot-tool.md` - focus only on structured output concepts

## Out of Scope

- Chaining multiple LLM calls (that's PRD #4)
- Adding new tools
- Changing the hello tool
- Adding automated tests (project doesn't have a test suite yet)

## Dependencies

- Existing polyglot tool implementation
- LangChain's structured output feature (available in @langchain/anthropic)

## Design Decisions

- **Research-first approach**: All implementation work must reference `docs/research/prd-3-structured-output.md` rather than relying on AI training data, which may contain outdated LangChain patterns.
- **Always provide schema name**: Zod cannot infer schema names, so we must always pass `{ name: "PolyglotResponse" }` to `withStructuredOutput()`.
- **Zod v4 compatible**: Project uses Zod 4.3.5, which is compatible with current LangChain packages.

---

## Progress Log

### 2026-01-13: M1 Complete - Research
- Researched current LangChain structured output documentation from official sources
- Confirmed `withStructuredOutput()` is the correct approach
- Documented findings in `docs/research/prd-3-structured-output.md`
- Key finding: Must always provide `{ name: "SchemaName" }` because Zod can't infer names
- Verified Zod v4 compatibility with current LangChain packages

### 2026-01-13: M2 Complete - Zod Schema
- Added `polyglotResponseSchema` to `src/index.ts` with all 4 fields
- Each field uses `.describe()` to guide the LLM on expected content
- Added `PolyglotResponse` TypeScript type inferred from schema
- Build passes successfully
