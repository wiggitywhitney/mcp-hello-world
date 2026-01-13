# Structured Output with LangChain

This guide explains how to get validated JSON responses from an LLM instead of raw text.

**Prerequisite**: Read [LangChain Polyglot Tool](./langchain-polyglot-tool.md) first.

---

## What the Polyglot Tool Does (with Structured Output)

The polyglot tool takes a greeting in any language and returns structured information about that language. Instead of returning raw text that you'd have to parse, it returns validated JSON with specific fields.

### Input

A greeting string in any language.

| Type | Description | Example |
|------|-------------|---------|
| `string` | A greeting word or phrase | `"bonjour"` |

### Output

A structured object with four fields, validated against a Zod schema.

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `detectedLanguage` | `string` | The language of the greeting | `"French"` |
| `greeting` | `string` | The original greeting (echoed back) | `"bonjour"` |
| `worldTranslation` | `string` | The word "world" in that language | `"monde"` |
| `languageFamily` | `string` | The linguistic family | `"Romance"` |

### Complete Example

**Input:**
```text
"bonjour"
```

**Output:**
```json
{
  "detectedLanguage": "French",
  "greeting": "bonjour",
  "worldTranslation": "monde",
  "languageFamily": "Romance"
}
```

---

## How It Works: The Structured Output Flow

This flow shows how LangChain transforms a simple greeting into validated, typed data. There are four participants:

- **Client Code** - Your application
- **LangChain Model** - The wrapper that adds structure
- **LLM API** - Claude (or another LLM)
- **Zod Validator** - The schema checker

### The Flow (with concrete data)

**Starting input:** `"bonjour"`

---

#### Setup Phase (one-time, before any requests)

**Step 1.** Client Code calls `withStructuredOutput(schema, { name: "PolyglotResponse" })`
- Passes in the Zod schema defining the four fields
- Passes the name so the LLM knows what to call the output

**Step 2.** LangChain Model stores the schema and prepares instructions for the LLM
- *This configures how future requests will be handled*

---

#### Request Phase (happens for each greeting)

**Step 3.** Client Code calls `invoke("Analyze this greeting: bonjour")`
- The greeting `"bonjour"` is embedded in the prompt

**Step 4.** LangChain Model sends to LLM API:
- The prompt: `"Analyze this greeting: bonjour"`
- The schema constraint: "Return JSON matching this structure: { detectedLanguage, greeting, worldTranslation, languageFamily }"
- Field descriptions from `.describe()` so the LLM knows what each field means

**Step 5. [KEY TRANSFORMATION]** LLM API generates JSON:
```json
{
  "detectedLanguage": "French",
  "greeting": "bonjour",
  "worldTranslation": "monde",
  "languageFamily": "Romance"
}
```
*This is where the actual intelligence happens - the LLM figures out the language, translates "world", and identifies the language family*

**Step 6.** LLM API returns the JSON string to LangChain Model

---

#### Validation Phase

**Step 7.** LangChain Model parses the JSON string into an object

**Step 8.** LangChain Model sends the object to Zod Validator

**Step 9. [KEY TRANSFORMATION]** Zod Validator checks:
- Are all required fields present? ✓
- Is `detectedLanguage` a string? ✓
- Is `greeting` a string? ✓
- Is `worldTranslation` a string? ✓
- Is `languageFamily` a string? ✓

**Step 10.** Zod Validator returns: validation passed

**Step 11.** LangChain Model returns typed `PolyglotResponse` to Client Code

---

#### Final output received by Client Code:

```typescript
{
  detectedLanguage: "French",
  greeting: "bonjour",
  worldTranslation: "monde",
  languageFamily: "Romance"
}
// TypeScript knows the exact shape - no parsing needed
```

---

### Summary

| Stage | What happens | Data state |
|-------|--------------|------------|
| Input | You provide a greeting | `"bonjour"` (string) |
| LLM Generation | Claude analyzes and generates JSON | `'{"detectedLanguage":"French",...}'` (JSON string) |
| Validation | Zod checks the structure | Object validated against schema |
| Output | You receive typed data | `{ detectedLanguage: "French", ... }` (typed object) |

---

## What Happens When Things Fail

**Step 1 - Invalid Zod schema:**
`withStructuredOutput(schema, {name})` fails immediately at setup time. Zod validates the schema definition itself, so malformed schemas (like `z.string().min("not a number")`) throw before any LLM call happens.

**Step 4 - LLM API call fails:**
Network errors, auth errors, rate limits, etc. throw an exception that bubbles up to your code. Standard error handling.

**Step 5 - LLM generates invalid JSON:**
If the LLM returns malformed JSON (syntax error), LangChain throws a parsing error.

**Steps 8-10 - JSON doesn't match schema:**
This is the interesting case. If the LLM returns valid JSON but it doesn't match your Zod schema (wrong field names, wrong types, missing required fields), Zod throws a validation error.

**LangChain's retry behavior:**
By default, LangChain can be configured to retry when validation fails. It feeds the validation error back to the LLM with something like "Your response didn't match the schema. Here's what was wrong: [Zod error]. Please try again." This gives the LLM a chance to self-correct.

---

## The Pattern

### 1. Define a schema

```typescript
const polyglotResponseSchema = z.object({
  detectedLanguage: z.string().describe("The language of the input greeting"),
  greeting: z.string().describe("The original greeting that was provided"),
  worldTranslation: z.string().describe("The word 'world' in the detected language"),
  languageFamily: z.string().describe("The language family (e.g., Romance, Germanic)"),
});
```

### 2. Wrap the model

```typescript
const model = new ChatAnthropic({ model: "claude-haiku-4-5-20251001" });

const structuredModel = model.withStructuredOutput(polyglotResponseSchema, {
  name: "PolyglotResponse",
});
```

### 3. Call it

```typescript
const response = await structuredModel.invoke(prompt);
// response is typed: { detectedLanguage, greeting, worldTranslation, languageFamily }
```

No parsing. No extraction. The response is already validated and typed.

---

## Key Gotcha: Always Provide a Name

This won't work reliably:

```typescript
// Missing name - don't do this
const structuredModel = model.withStructuredOutput(polyglotResponseSchema);
```

Zod schemas don't carry their variable names at runtime. Even though you wrote `polyglotResponseSchema`, the LLM doesn't know that. You must explicitly tell it:

```typescript
// Always include the name
const structuredModel = model.withStructuredOutput(polyglotResponseSchema, {
  name: "PolyglotResponse",
});
```

---

## How the Schema Guides the LLM

Each `.describe()` in your schema tells the LLM what to put in that field:

```typescript
detectedLanguage: z.string().describe("The language of the input greeting")
```

The LLM sees this description and knows to extract/generate the language name for that field. Without descriptions, the LLM has to guess what each field means from the name alone.

Good descriptions make the difference between getting useful data and getting garbage.

---

## When to Use Structured Output

**Use it when** you need specific data fields from the LLM response—classifications, extractions, or any case where you'll process the output programmatically.

**Skip it when** you just want free-form text, like a summary or explanation.
