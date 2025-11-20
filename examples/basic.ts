/**
 * Basic usage examples for LLM Provider
 */
import { generate, createLLM, generateStructured } from '../src'

async function main() {
  // Example 1: Simple generation with auto-detected provider
  console.log('--- Simple Generation ---')
  const text = await generate('gpt-4', 'What is 2 + 2?')
  console.log('Response:', text)

  // Example 2: Using LLM class with configuration
  console.log('\n--- LLM Class ---')
  const llm = createLLM({
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 500,
    systemPrompt: 'You are a helpful assistant. Be concise.'
  })

  const response = await llm.generate('Explain recursion in one sentence')
  console.log('Response:', response.content)
  console.log('Usage:', response.usage)

  // Example 3: Structured output
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

  // Example 4: Multi-turn conversation
  console.log('\n--- Multi-turn Conversation ---')
  const chatLLM = createLLM({ model: 'gpt-4' })
  const chatResponse = await chatLLM.generate([
    { role: 'user', content: 'My name is Alice' },
    { role: 'assistant', content: 'Hello Alice! Nice to meet you.' },
    { role: 'user', content: 'What is my name?' }
  ])
  console.log('Response:', chatResponse.content)
}

main().catch(console.error)
