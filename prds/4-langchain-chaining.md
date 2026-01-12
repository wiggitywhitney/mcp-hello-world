# PRD #4: LangChain Chaining for Polyglot Tool

**Status**: Not Started
**Created**: 2026-01-12
**GitHub Issue**: [#4](https://github.com/wiggitywhitney/mcp-hello-world/issues/4)

---

## Problem Statement

The polyglot tool currently makes a single LLM call, which doesn't showcase one of LangChain's core strengths: chaining multiple operations together. For learning purposes, we want to demonstrate what "chain" actually means in LangChain and when multi-step workflows are useful.

## Solution

Create a new MCP tool called `greet-with-context` (or enhance polyglot) that chains three LLM calls together:

1. **Detect language** - Identify the language of the input greeting
2. **Translate "world"** - Get the translation based on detected language
3. **Generate cultural note** - Create a brief note about greeting customs in that culture

This demonstrates LangChain's `.pipe()` pattern for composing multi-step workflows.

### Response Format

```json
{
  "detectedLanguage": "French",
  "greeting": "bonjour",
  "worldTranslation": "monde",
  "culturalNote": "In France, greetings often include a handshake or 'la bise' (cheek kisses) between friends and family."
}
```

## User Experience

When Claude calls the chained tool, it receives richer context:

> User: "How do people greet each other in Japan?"
> Claude calls greet-with-context("こんにちは")
> Tool returns structured response with cultural context
> Claude: "In Japanese, 'world' is '世界' (sekai). Japanese greetings are accompanied by bowing, with the depth of the bow indicating the level of respect."

## Technical Approach

### LangChain Chaining with .pipe()

```typescript
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

// Step 1: Detect language
const detectLanguagePrompt = ChatPromptTemplate.fromTemplate(
  "What language is this greeting in? Reply with just the language name: {greeting}"
);

// Step 2: Translate "world"
const translatePrompt = ChatPromptTemplate.fromTemplate(
  "Translate the word 'world' into {language}. Reply with just the translation."
);

// Step 3: Cultural note
const culturalNotePrompt = ChatPromptTemplate.fromTemplate(
  "Write one sentence about greeting customs in {language}-speaking cultures."
);

// Chain them together
const chain = RunnableSequence.from([
  detectLanguagePrompt,
  model,
  // ... parse and pass to next step
]);
```

### Why This Shows LangChain Value

With the raw Anthropic SDK, you'd need to:
1. Make three separate API calls manually
2. Parse each response
3. Pass data between calls
4. Handle errors at each step
5. Manage the flow control yourself

LangChain's chaining:
1. Declaratively defines the workflow
2. Handles data flow between steps
3. Provides consistent error handling
4. Makes the multi-step logic readable and maintainable

## Success Criteria

- [ ] New tool returns response with all three pieces: language, translation, cultural note
- [ ] Implementation uses LangChain's chaining pattern (`.pipe()` or `RunnableSequence`)
- [ ] Each step in the chain is clearly visible in the code
- [ ] Documentation explains chaining concept with before/after comparison
- [ ] Manual testing confirms chain executes all three steps
- [ ] New standalone learning document created (`docs/langchain-chaining.md`) covering the new concepts

## Milestones

- [ ] **M1**: Research latest LangChain chaining documentation and best practices (avoid outdated patterns)
- [ ] **M2**: Design chain architecture - decide on tool name and chain structure
- [ ] **M3**: Implement three-step chain with `.pipe()` or `RunnableSequence`
- [ ] **M4**: Integrate chain into new MCP tool with structured output
- [ ] **M5**: Create new standalone learning document (`docs/langchain-chaining.md`) - plain language, succinct, no overlap with existing docs
- [ ] **M6**: Manual testing with various greetings to verify full chain execution

## Learning Document Requirements

The new `docs/langchain-chaining.md` must:
- **Be a new file**: Do not edit existing documents - create a standalone file for this feature
- **Use plain language**: No jargon, zero assumptions about prior knowledge
- **Be succinct**: Explain concepts clearly without unnecessary verbosity
- **Not overlap**: Don't repeat material from `langchain-polyglot-tool.md` or `structured-output.md` - focus only on chaining concepts

## Dependencies

- **PRD #3 (Structured Output)**: Should be completed first so we can use structured output within the chain
- Existing polyglot tool implementation as reference
- LangChain's `@langchain/core` for chaining primitives

## Out of Scope

- Conversation memory (potential future PRD)
- Agents with tool selection
- Parallel chain execution
- Automated tests

## Design Decisions

*(To be filled in during implementation)*

**Open Questions:**
- Should this be a new tool (`greet-with-context`) or enhance the existing `polyglot` tool?
- Should we use `RunnableSequence` or the `.pipe()` syntax?

---

## Progress Log

*(To be filled in during implementation)*
