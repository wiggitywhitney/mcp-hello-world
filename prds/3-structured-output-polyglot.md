# PRD #3: Structured Output for Polyglot Tool

**Status**: Not Started
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

## Milestones

- [ ] **M1**: Define Zod schema for structured polyglot response
- [ ] **M2**: Implement `.withStructuredOutput()` in polyglot handler
- [ ] **M3**: Update MCP tool response to return formatted structured data
- [ ] **M4**: Update documentation (README, langchain-polyglot-tool.md) with structured output explanation
- [ ] **M5**: Manual testing with various greetings to verify structured responses

## Out of Scope

- Chaining multiple LLM calls (that's PRD #4)
- Adding new tools
- Changing the hello tool
- Adding automated tests (project doesn't have a test suite yet)

## Dependencies

- Existing polyglot tool implementation
- LangChain's structured output feature (available in @langchain/anthropic)

## Design Decisions

*(To be filled in during implementation)*

---

## Progress Log

*(To be filled in during implementation)*
