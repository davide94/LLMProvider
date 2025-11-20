# LLM Provider

Unified LLM provider abstraction with built-in Langfuse tracing. Supports OpenAI, Anthropic, and Google Gemini with a single, consistent interface.

## Provider Status

- ✅ **OpenAI** - Implemented
- 🚧 **Anthropic** - Coming soon
- 🚧 **Google Gemini** - Coming soon

## Installation

```bash
npm install llm-provider
```

## Quick Start

```typescript
import { generate, createLLM, getPrompt } from 'llm-provider'

// Simple generation (provider auto-detected from model name)
const result = await generate('gpt-4', 'Hello, world!')

// With configuration
const llm = createLLM({
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt: 'You are a helpful assistant.'
})

const response = await llm.generate('Explain quantum computing')
console.log(response.content)
```

## Using with Langfuse

Fetch prompts and model configuration from Langfuse:

```typescript
import { LangfuseClient } from '@langfuse/client'
import { createLLM, getPrompt } from 'llm-provider'

// Get prompt from Langfuse
  const prompt = await langfuse.prompt.get('my-prompt', { label: 'production' })
const { model, temperature } = config as { model: string; temperature: number }

const llm = createLLM({
  model,
  temperature,
  systemPrompt: prompt
})

const response = await llm.generate('User input here')
```

## Structured Output

```typescript
import { generateStructured } from 'llm-provider'

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
import { createLLM } from 'llm-provider'

const llm = createLLM({ model: 'gpt-4-vision-preview' })

const response = await llm.generate([
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is in this image?' },
      { type: 'input_image', image_url: { url: 'https://...' } }
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

### `createLLM(config: LLMConfig): LLM`

Create an LLM instance with configuration.

### `generate(model, prompt, options?): Promise<string>`

Quick text generation helper.

### `generateStructured<T>(model, prompt, schema, options?): Promise<T>`

Generate structured output matching a JSON schema.

## Examples

- [Basic usage](examples/basic.ts) - Simple generation, structured output, multi-turn conversations
- [Langfuse integration](examples/langfuse-prompt.ts) - Fetching prompts and config from Langfuse

## License

MIT
