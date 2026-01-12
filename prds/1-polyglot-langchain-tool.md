# PRD: Polyglot MCP Tool with LangChain

**Issue**: #1
**Status**: Draft
**Created**: 2025-01-11
**Last Updated**: 2025-01-11

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

- [ ] LangChain dependencies installed and configured with Anthropic
- [ ] `polyglot` tool implemented with LangChain integration
- [ ] Teller secrets management configured for this project
- [ ] Code documented with comprehensive doc strings
- [ ] Standalone documentation created (`docs/langchain-polyglot-tool.md`)
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

## Dependencies

- Existing `hello` tool must continue working
- Requires `ANTHROPIC_API_KEY` in Google Secrets Manager (already exists)
- Requires Teller installed locally

---

## Progress Log

| Date | Update |
|------|--------|
| 2025-01-11 | PRD created |
