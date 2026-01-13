# Structured Output with LangChain

This guide explains how to get validated JSON responses from an LLM instead of raw text.

**Prerequisite**: Read [LangChain Polyglot Tool](./langchain-polyglot-tool.md) first.

---

## What Structured Output Does

Normally, `model.invoke()` returns whatever text the LLM generates. You have to parse it yourself and hope the format is consistent.

Structured output changes this. You define a schema describing what you want, and LangChain:
1. Tells the LLM to return data matching that schema
2. Parses the response
3. Validates it against your schema
4. Returns typed data you can use directly

---

## Before and After

The polyglot tool originally returned a plain string:

```text
"monde"
```

With structured output, it returns validated JSON:

```json
{
  "detectedLanguage": "French",
  "greeting": "bonjour",
  "worldTranslation": "monde",
  "languageFamily": "Romance"
}
```

Same LLM call, but now you get rich, typed data instead of text you'd need to parse.

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
