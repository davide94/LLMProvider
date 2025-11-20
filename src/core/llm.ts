import { generateWithOpenAI } from '../providers/openai'
import { UnsupportedProviderError } from './errors'
import type { LLMConfig, LLMMessage, LLMProvider, LLMResponse } from './types'

/**
 * Default timeout for LLM requests (90 seconds)
 */
const DEFAULT_TIMEOUT = 90000

/**
 * Auto-detect LLM provider from model name
 */
export function detectProvider(model: string): LLMProvider {
  const modelLower = model.toLowerCase()

  // OpenAI models
  if (
    modelLower.includes('gpt') ||
    modelLower.includes('o1') ||
    modelLower.includes('o3') ||
    modelLower.includes('davinci') ||
    modelLower.includes('curie') ||
    modelLower.includes('babbage') ||
    modelLower.includes('ada')
  ) {
    return 'openai' as LLMProvider
  }

  // Anthropic models
  if (modelLower.includes('claude')) {
    return 'anthropic' as LLMProvider
  }

  // Gemini models
  if (modelLower.includes('gemini') || modelLower.includes('palm')) {
    return 'gemini' as LLMProvider
  }

  // Default to OpenAI if can't detect
  console.warn(`Could not detect provider for model "${model}", defaulting to OpenAI`)
  return 'openai' as LLMProvider
}

/**
 * Main LLM class - provides unified interface for all providers
 */
export class LLM {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      provider: config.provider || detectProvider(config.model),
      timeout: config.timeout || DEFAULT_TIMEOUT,
      enableTracing: config.enableTracing ?? true
    }
  }

  /**
   * Generate text (non-streaming)
   * @param prompt - String prompt or array of messages
   * @returns LLM response with generated text
   */
  async generate(prompt: string | LLMMessage[]): Promise<LLMResponse> {
    // Route to appropriate provider
    switch (this.config.provider) {
      case 'openai':
        return generateWithOpenAI(prompt, this.config)
      default:
        throw new UnsupportedProviderError(this.config.provider as string)
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config }
  }
}

/**
 * Helper function to create an LLM instance
 * @param config - LLM configuration
 * @returns LLM instance
 */
export function createLLM(config: LLMConfig): LLM {
  return new LLM(config)
}

/**
 * Helper function for quick text generation
 * @param model - Model name
 * @param prompt - Prompt string or array of messages
 * @param options - Optional configuration
 * @returns Generated text
 */
export async function generate(
  model: string,
  prompt: string | LLMMessage[],
  options?: Partial<LLMConfig>
): Promise<string> {
  const llm = createLLM({ model, ...options })
  const response = await llm.generate(prompt)
  return response.content
}

/**
 * Helper function for quick structured generation
 * @param model - Model name
 * @param prompt - Prompt string or array of messages
 * @param schema - JSON schema for output
 * @param options - Optional configuration
 * @returns Parsed structured output
 */
export async function generateStructured<T = Record<string, unknown>>(
  model: string,
  prompt: string | LLMMessage[],
  schema: Record<string, unknown>,
  options?: Partial<LLMConfig>
): Promise<T> {
  const llm = createLLM({ model, schema, ...options })
  const response = await llm.generate(prompt)
  return (response.structuredOutput ?? {}) as T
}
