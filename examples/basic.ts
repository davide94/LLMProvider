/**
 * Basic usage examples for LLM Provider
 */
import { generate, generateStructured } from '@davide94/llm-provider'

async function main() {
  // Example 1: Simple generation with auto-detected provider
  console.log('--- Simple Generation ---')
  const text = await generate('gpt-4', 'What is 2 + 2?')
  console.log('Response:', text)

  // Example 2: Structured output
  console.log('\n--- Structured Output ---')
  const schema = {
    type: 'object',
    properties: {
      sentiment: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
      confidence: { type: 'number' },
      keywords: { type: 'array', items: { type: 'string' } }
    },
    required: ['sentiment', 'confidence', 'keywords']
  }

  const analysis = await generateStructured(
    'gpt-4',
    'Analyze: "I love this product! It works great."',
    schema
  )
  console.log('Analysis:', analysis)

  // Example 3: Multi-turn conversation
  console.log('\n--- Multi-turn Conversation ---')
  const chatResponse = await generate('gpt-4', [
    { role: 'user', content: 'My name is Alice' },
    { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
    { role: 'user', content: 'What is my name?' },
    { role: 'assistant', content: 'Your name is Alice.' }
  ])
  console.log('Response:', chatResponse)
}

main().catch(console.error)
