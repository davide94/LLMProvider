/**
 * LLM Provider - Unified interface for multiple LLM providers with Langfuse tracing
 */

// Core exports
export { LLM, createLLM, generate, generateStructured, detectProvider } from './core/llm'
export {
  LLMProvider,
  LLMReasoning,
  type LLMConfig,
  type LLMResponse,
  type LLMMessage,
  type LLMMessageContent,
  type LLMContentPart,
  type LLMContentPartText,
  type LLMContentPartImage,
  type LLMContentPartFileURL,
  type LLMContentPartFileId,
  type LLMContentPartFileBase64,
  type MessageRole,
  type OpenAIConfig,
  type AnthropicConfig,
  type GeminiConfig,
  type LLMProviderConfig
} from './core/types'

// Error exports
export {
  LLMError,
  APIKeyError,
  TimeoutError,
  UnsupportedProviderError,
  createLLMError
} from './core/errors'

// Provider exports (for advanced usage)
export { generateWithOpenAI } from './providers/openai'
