# PRD: Polyglot MCP Tool with LangChain

**Issue**: #1
**Status**: In Progress
**Created**: 2025-01-11
**Last Updated**: 2025-01-12

---

## Problem Statement

The current hello-world MCP server demonstrates basic MCP concepts with a static tool. However, it doesn't show how MCP tools can integrate with external AI services—a key pattern for building intelligent tools.

**Learning Gap**: Someone studying this repo can't yet see how to:
- Connect an MCP tool to LangChain
- Call an external LLM from within an MCP tool
- Handle async AI operations in the MCP request/response cycle

## Solution Overview

Add a `polyglot` tool to the MCP server that:
1. Accepts a greeting in any language ("hello", "hola", "bonjour", "こんにちは", "hey", etc.)
2. Uses LangChain to call Claude (Anthropic)
3. Detects the language and responds with "world" in that same language

This creates a learning path: static tool (`hello`) → intelligent tool (`polyglot`).

## Learning Objectives

By studying this implementation, someone should understand:

1. **LangChain Basics**
   - Setting up LangChain with Anthropic as the provider
   - Creating and using prompt templates
   - Making LLM calls through LangChain

2. **MCP + External AI Integration**
   - How an MCP tool can call external services
   - Async patterns for AI operations within MCP
   - Error handling for external API calls

3. **Secrets Management**
   - Using Teller to inject API keys
   - Keeping secrets out of code

4. **Zod for Parameter Validation**
   - What Zod is and why MCP uses it for tool parameters
   - Common Zod types (`z.string()`, `z.number()`, etc.)
   - Using `.describe()` to document parameters for Claude

5. **ChatAnthropic Instance Management**
   - Creating instances inside handlers vs reusing across calls
   - Trade-offs: clarity vs performance
   - When to choose each approach

## User Journey

```
User says: "bonjour"
    ↓
Claude calls MCP `polyglot` tool with input "bonjour"
    ↓
MCP tool uses LangChain → calls Claude API
    ↓
LLM detects French, returns "monde"
    ↓
Claude responds to user: "monde"
```

## Technical Approach

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Claude (host)  │────▶│   MCP Server    │────▶│  Claude (LLM)   │
│                 │     │                 │     │  via LangChain  │
│                 │◀────│  polyglot tool  │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Dependencies

- `langchain` - Core LangChain framework
- `@langchain/anthropic` - Anthropic provider for LangChain
- Existing: `@modelcontextprotocol/sdk`

### Secrets Management

Using Teller with Google Secrets Manager (existing setup):

```yaml
# .teller.yml
project: mcp-hello-world
providers:
  google_secrets_manager:
    kind: google_secretmanager
    maps:
      - id: secrets
        path: projects/demoo-ooclock
        keys:
          anthropic-api-key: ANTHROPIC_API_KEY
```

Run with: `teller run -- npm start`

### Tool Definition

```typescript
server.tool(
  "polyglot",
  "Responds to greetings in any language with 'world' in that same language",
  { greeting: z.string().describe("A greeting in any language") },
  async ({ greeting }) => {
    // LangChain call to detect language and respond
  }
);
```

## Success Criteria

1. **Functional**: Tool correctly responds to greetings in multiple languages
2. **Educational**: Code has comprehensive doc strings explaining each step
3. **Documented**: Standalone documentation suitable for Anki card creation
4. **Integrated**: Works seamlessly alongside existing `hello` tool

## Milestones

- [x] LangChain dependencies installed and configured with Anthropic
- [x] `polyglot` tool implemented with LangChain integration
- [x] Teller secrets management configured for this project
- [x] Code documented with comprehensive doc strings
- [x] Standalone documentation created (`docs/langchain-polyglot-tool.md`)
- [ ] Tool tested with various languages and greeting variations

## Documentation Deliverables

### 1. Code Documentation (Doc Strings)
Every function and significant code block should have doc strings explaining:
- What the code does
- Why it does it that way
- How it fits into the larger picture

### 2. Standalone Guide (`docs/langchain-polyglot-tool.md`)
A learning-focused document covering:
- What is LangChain and why use it
- How LangChain connects to Anthropic
- The MCP + LangChain integration pattern
- Step-by-step walkthrough of the `polyglot` tool
- Key concepts for Anki card creation

**Zod Documentation** (added per design decision):
- What Zod is and why MCP uses it
- Common Zod types with examples
- The `.describe()` method for parameter documentation

**ChatAnthropic Instance Placement** (added per design decision):
- Per-call instantiation vs reused instance
- Comparison table of trade-offs (clarity, performance, memory, configuration)
- Recommendation: per-call for learning repos, reused for production

### 3. README Update
Add a section pointing to the new tool and its documentation.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | Tool fails under heavy use | Add error handling, document limits |
| LLM response variability | Inconsistent output format | Keep prompt simple, accept natural variation |
| Secret misconfiguration | Tool fails to authenticate | Clear documentation, error messages |

## Out of Scope

- Caching/memoization of responses
- Support for non-Anthropic LLM providers
- Conversation memory (each call is stateless)

---

## Design Decisions

### DD-1: Zod Documentation Requirement
**Date**: 2025-01-12
**Decision**: The standalone documentation must include comprehensive Zod coverage suitable for Anki card creation.
**Rationale**: Zod is a foundational concept for MCP tool development. Understanding parameter validation helps learners build their own tools correctly.
**Impact**: Added Zod section to Learning Objectives and Documentation Deliverables.

### DD-2: ChatAnthropic Instance Placement
**Date**: 2025-01-12
**Decision**: Use per-call instantiation (inside handler) rather than reused instance.
**Rationale**: For a learning repository, code clarity is more important than micro-optimization. Having everything in one place makes the code easier to follow and understand.
**Impact**: Documentation covers both approaches with trade-offs, but implementation uses per-call pattern. Added to Learning Objectives.

## Dependencies

- Existing `hello` tool must continue working
- Requires `ANTHROPIC_API_KEY` in Google Secrets Manager (already exists)
- Requires Teller installed locally

---

## Progress Log

| Date | Update |
|------|--------|
| 2025-01-11 | PRD created |
| 2025-01-12 | Installed @langchain/anthropic and @langchain/core; added ChatAnthropic import to src/index.ts; verified TypeScript build |
| 2025-01-12 | Configured Teller secrets management (.teller.yml) to inject ANTHROPIC_API_KEY from Google Secrets Manager |
| 2025-01-12 | Created standalone documentation (`docs/langchain-polyglot-tool.md`) with Zod and ChatAnthropic instance placement sections |
| 2025-01-12 | Design decisions recorded: DD-1 (Zod documentation requirement), DD-2 (per-call ChatAnthropic instantiation) |
| 2025-01-12 | Implemented polyglot tool with LangChain integration, Zod parameter validation, and error handling |
| 2025-01-12 | Revised documentation to follow project guidelines (plain language, succinct, no assumptions) |
| 2025-01-12 | Updated README with polyglot tool section and greetings table for testing |
| 2025-01-12 | Verified tool appears in Claude after restart |
