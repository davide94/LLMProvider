/**
 * LLM Provider Types and Configuration
 * Provides a unified interface for working with multiple LLM providers
 */

/**
 * Supported LLM providers
 */
export enum LLMProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Gemini = 'gemini'
}

export enum LLMReasoning {
  None = 'none',
  Minimal = 'minimal',
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

/**
 * LLM model configuration
 */
export interface LLMConfig {
  /** The model identifier (e.g., 'gpt-4', 'claude-3-5-sonnet-20241022', 'gemini-pro') */
  model: string

  /** Optional: Explicitly specify the provider (auto-detected from model name if not provided) */
  provider?: LLMProvider

  /** Temperature for sampling (0.0 - 2.0). Higher values make output more random */
  temperature?: number

  /** Maximum number of tokens to generate */
  maxTokens?: number

  /** Optional: JSON schema for structured output validation */
  schema?: Record<string, unknown>

  /** Optional: System prompt/instructions */
  systemPrompt?: string

  /** Optional: Top-p sampling parameter */
  topP?: number

  /** Optional: Timeout in milliseconds (defaults to 90000) */
  timeout?: number

  /** Optional: Reasoning level */
  reasoning?: LLMReasoning

  /** Optional: Enable Langfuse tracing */
  enableTracing?: boolean

  /** Optional: Langfuse trace metadata */
  traceMetadata?: {
    userId?: string
    sessionId?: string
    tags?: string[]
    [key: string]: unknown
  }
}

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant'

/**
 * Text content part
 */
export interface LLMContentPartText {
  type: 'text'
  text: string
}

/**
 * Image URL content part
 */
export interface LLMContentPartImage {
  type: 'input_image'
  image_url: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

/**
 * File URL content part
 */
export interface LLMContentPartFileURL {
  type: 'input_file'
  file_url: {
    url?: string
  }
}

/**
 * File id content part
 */
export interface LLMContentPartFileId {
  type: 'input_file'
  file_url: {
    file_id?: string
  }
}

/**
 * File base64 content part
 */
export interface LLMContentPartFileBase64 {
  type: 'input_file'
  file_url: {
    file_data?: string
    filename?: string
  }
}

/**
 * Union type for all content parts
 */
export type LLMContentPart =
  | LLMContentPartText
  | LLMContentPartImage
  | LLMContentPartFileURL
  | LLMContentPartFileId
  | LLMContentPartFileBase64

/**
 * Message content - can be a string or array of content parts
 */
export type LLMMessageContent = string | Array<LLMContentPart>

/**
 * Message in a conversation
 */
export interface LLMMessage {
  role: MessageRole
  content: LLMMessageContent
}

/**
 * Standard LLM response (non-streaming)
 */
export interface LLMResponse {
  /** Generated text content */
  content: string

  /** Provider that generated the response */
  provider: LLMProvider

  /** Model used for generation */
  model: string

  /** Token usage information */
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }

  /** Optional: Parsed structured output (when schema is provided) */
  structuredOutput?: Record<string, unknown>

  /** Optional: Langfuse trace ID */
  traceId?: string
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends LLMConfig {
  provider: LLMProvider.OpenAI
  /** Frequency penalty (-2.0 to 2.0) */
  frequencyPenalty?: number
  /** Presence penalty (-2.0 to 2.0) */
  presencePenalty?: number
  /** Response format type */
  responseFormat?: 'text' | 'json_object'
}

/**
 * Anthropic-specific configuration
 */
export interface AnthropicConfig extends LLMConfig {
  provider: LLMProvider.Anthropic
  /** Top-k sampling parameter */
  topK?: number
}

/**
 * Gemini-specific configuration
 */
export interface GeminiConfig extends LLMConfig {
  provider: LLMProvider.Gemini
  /** Safety settings */
  safetySettings?: Array<{
    category: string
    threshold: string
  }>
}

/**
 * Union type for all provider-specific configurations
 */
export type LLMProviderConfig = OpenAIConfig | AnthropicConfig | GeminiConfig
