# LLM Provider

Unified LLM provider abstraction with built-in Langfuse tracing. Supports OpenAI, Anthropic, and Google Gemini with a single, consistent interface.

## Provider Status

- ✅ **OpenAI** - Implemented
- 🚧 **Anthropic** - Coming soon
- 🚧 **Google Gemini** - Coming soon

## Installation

Configure npm to use GitHub registry for the `@davide94` scope:

```bash
# Option 1: npm config
npm config set @davide94:registry https://npm.pkg.github.com

# Option 2: Add to .npmrc in your project
echo "@davide94:registry=https://npm.pkg.github.com" >> .npmrc
```

Then install:

```bash
npm install @davide94/llm-provider
```

## Quick Start

```typescript
import { generate, generateStructured } from '@davide94/llm-provider'

// Simple generation (provider auto-detected from model name)
const result = await generate('gpt-4', 'Hello, world!')

// With configuration
const response = await generate('gpt-4', 'Explain quantum computing', {
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful assistant.'
})
console.log(response)
```

## Using with Langfuse

Fetch prompts and model configuration from Langfuse:

```typescript
import { LangfuseClient } from '@langfuse/client'
import { generate } from '@davide94/llm-provider'

const langfuse = new LangfuseClient()

// Get prompt from Langfuse
const prompt = await langfuse.prompt.get('my-prompt', { label: 'production' })
const systemPrompt = prompt.compile()
const { model, temperature } = prompt.config as { model: string; temperature: number }

const response = await generate(model, 'User input here', {
  temperature,
  systemPrompt
})
```

## Structured Output

```typescript
import { generateStructured } from '@davide94/llm-provider'

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name', 'age']
}

const result = await generateStructured(
  'gpt-4',
  'Extract: John is 30 years old',
  schema
)
// { name: 'John', age: 30 }
```

## Multi-modal Input

```typescript
import { generate } from '@davide94/llm-provider'

const response = await generate('gpt-4-vision-preview', [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      { type: 'input_image', image_url: 'https://...' }
    ]
  }
])
```

## Environment Variables

```bash
# Required for each provider you use
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...  # or GEMINI_API_KEY

# For Langfuse tracing
LANGFUSE_PUBLIC_KEY=pk-...
LANGFUSE_SECRET_KEY=sk-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com  # optional
```

## API Reference

### `generate(model, prompt, options?): Promise<string>`

Quick text generation helper.

### `generateStructured<T>(model, prompt, schema, options?): Promise<T>`

Generate structured output matching a JSON schema.

## Examples

- [Basic usage](examples/basic.ts) - Simple generation, structured output, multi-turn conversations
- [Langfuse integration](examples/langfuse-prompt.ts) - Fetching prompts and config from Langfuse

## License

MIT
