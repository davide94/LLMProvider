/**
 * Example: Using Langfuse prompts with LLM Provider
 *
 * This shows how to fetch prompt configuration from Langfuse
 * and use it with the unified LLM interface.
 */
import { LangfuseClient } from '@langfuse/client'
import { createLLM, generateStructured } from '../src'

// Initialize Langfuse client
const langfuse = new LangfuseClient()

async function main() {
  // Fetch prompt from Langfuse
  const prompt = await langfuse.prompt.get('my-prompt', { label: 'production' })

  // Compile the prompt template (if it has variables)
  const systemPrompt = prompt.compile()

  // Extract model configuration from Langfuse
  const { model, temperature } = prompt.config as {
    model: string
    temperature: number
  }

  // Create LLM with Langfuse configuration
  const llm = createLLM({
    model,
    temperature,
    systemPrompt
  })

  // Example: Generate response
  const response = await llm.generate('Your user input here...')
  console.log('Response:', response.content)

  // Example: With structured output
  const schema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' }
    },
    required: ['title', 'summary']
  }

  const structured = await generateStructured(
    model,
    [
      {
        role: 'user',
        content: 'Extract information from this document...'
      }
    ],
    schema,
    { temperature, systemPrompt }
  )

  console.log('Structured Output:', structured)
}

main().catch(console.error)
