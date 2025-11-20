/**
 * LLM Provider Types and Configuration
 * Provides a unified interface for working with multiple LLM providers
 */
/**
 * Supported LLM providers
 */
declare enum LLMProvider {
    OpenAI = "openai",
    Anthropic = "anthropic",
    Gemini = "gemini"
}
declare enum LLMReasoning {
    None = "none",
    Minimal = "minimal",
    Low = "low",
    Medium = "medium",
    High = "high"
}
/**
 * LLM model configuration
 */
interface LLMConfig {
    /** The model identifier (e.g., 'gpt-4', 'claude-3-5-sonnet-20241022', 'gemini-pro') */
    model: string;
    /** Optional: Explicitly specify the provider (auto-detected from model name if not provided) */
    provider?: LLMProvider;
    /** Temperature for sampling (0.0 - 2.0). Higher values make output more random */
    temperature?: number;
    /** Maximum number of tokens to generate */
    maxTokens?: number;
    /** Optional: JSON schema for structured output validation */
    schema?: Record<string, unknown>;
    /** Optional: System prompt/instructions */
    systemPrompt?: string;
    /** Optional: Top-p sampling parameter */
    topP?: number;
    /** Optional: Timeout in milliseconds (defaults to 90000) */
    timeout?: number;
    /** Optional: Reasoning level */
    reasoning?: LLMReasoning;
    /** Optional: Enable Langfuse tracing */
    enableTracing?: boolean;
    /** Optional: Langfuse trace metadata */
    traceMetadata?: {
        userId?: string;
        sessionId?: string;
        tags?: string[];
        [key: string]: unknown;
    };
}
/**
 * Message role in a conversation
 */
type MessageRole = 'system' | 'user' | 'assistant';
/**
 * Text content part
 */
interface LLMContentPartText {
    type: 'text';
    text: string;
}
/**
 * Image URL content part
 */
interface LLMContentPartImage {
    type: 'input_image';
    image_url: {
        url: string;
        detail?: 'auto' | 'low' | 'high';
    };
}
/**
 * File URL content part
 */
interface LLMContentPartFileURL {
    type: 'input_file';
    file_url: {
        url?: string;
    };
}
/**
 * File id content part
 */
interface LLMContentPartFileId {
    type: 'input_file';
    file_url: {
        file_id?: string;
    };
}
/**
 * File base64 content part
 */
interface LLMContentPartFileBase64 {
    type: 'input_file';
    file_url: {
        file_data?: string;
        filename?: string;
    };
}
/**
 * Union type for all content parts
 */
type LLMContentPart = LLMContentPartText | LLMContentPartImage | LLMContentPartFileURL | LLMContentPartFileId | LLMContentPartFileBase64;
/**
 * Message content - can be a string or array of content parts
 */
type LLMMessageContent = string | Array<LLMContentPart>;
/**
 * Message in a conversation
 */
interface LLMMessage {
    role: MessageRole;
    content: LLMMessageContent;
}
/**
 * Standard LLM response (non-streaming)
 */
interface LLMResponse {
    /** Generated text content */
    content: string;
    /** Provider that generated the response */
    provider: LLMProvider;
    /** Model used for generation */
    model: string;
    /** Token usage information */
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
    /** Optional: Parsed structured output (when schema is provided) */
    structuredOutput?: Record<string, unknown>;
    /** Optional: Langfuse trace ID */
    traceId?: string;
}
/**
 * OpenAI-specific configuration
 */
interface OpenAIConfig extends LLMConfig {
    provider: LLMProvider.OpenAI;
    /** Frequency penalty (-2.0 to 2.0) */
    frequencyPenalty?: number;
    /** Presence penalty (-2.0 to 2.0) */
    presencePenalty?: number;
    /** Response format type */
    responseFormat?: 'text' | 'json_object';
}
/**
 * Anthropic-specific configuration
 */
interface AnthropicConfig extends LLMConfig {
    provider: LLMProvider.Anthropic;
    /** Top-k sampling parameter */
    topK?: number;
}
/**
 * Gemini-specific configuration
 */
interface GeminiConfig extends LLMConfig {
    provider: LLMProvider.Gemini;
    /** Safety settings */
    safetySettings?: Array<{
        category: string;
        threshold: string;
    }>;
}
/**
 * Union type for all provider-specific configurations
 */
type LLMProviderConfig = OpenAIConfig | AnthropicConfig | GeminiConfig;

/**
 * Main LLM class - provides unified interface for all providers
 */
declare class LLM {
    private config;
    constructor(config: LLMConfig);
    /**
     * Generate text (non-streaming)
     * @param prompt - String prompt or array of messages
     * @returns LLM response with generated text
     */
    generate(prompt: string | LLMMessage[]): Promise<LLMResponse>;
    /**
     * Get the current configuration
     */
    getConfig(): LLMConfig;
}
/**
 * Helper function for quick text generation
 * @param model - Model name
 * @param prompt - Prompt string or array of messages
 * @param options - Optional configuration
 * @returns Generated text
 */
declare function generate(model: string, prompt: string | LLMMessage[], options?: Partial<LLMConfig>): Promise<string>;
/**
 * Helper function for quick structured generation
 * @param model - Model name
 * @param prompt - Prompt string or array of messages
 * @param schema - JSON schema for output
 * @param options - Optional configuration
 * @returns Parsed structured output
 */
declare function generateStructured<T = Record<string, unknown>>(model: string, prompt: string | LLMMessage[], schema: Record<string, unknown>, options?: Partial<LLMConfig>): Promise<T>;

/**
 * Base LLM error class
 */
declare class LLMError extends Error {
    readonly provider?: LLMProvider;
    readonly statusCode: number;
    readonly code?: string;
    readonly originalError?: unknown;
    constructor(options: {
        message: string;
        statusCode?: number;
        provider?: LLMProvider;
        code?: string;
        originalError?: unknown;
    });
}
/**
 * Error for missing API keys
 */
declare class APIKeyError extends LLMError {
    constructor(provider: LLMProvider);
}
/**
 * Error for timeouts
 */
declare class TimeoutError extends LLMError {
    constructor(provider: LLMProvider, timeout: number);
}
/**
 * Error for unsupported providers
 */
declare class UnsupportedProviderError extends LLMError {
    constructor(provider: string);
}
/**
 * Create an LLM error
 */
declare function createLLMError(options: {
    message: string;
    statusCode?: number;
    provider?: LLMProvider;
    code?: string;
    originalError?: unknown;
}): LLMError;

/**
 * Generate text with OpenAI (non-streaming)
 */
declare function generateWithOpenAI(prompt: string | LLMMessage[], config: LLMConfig): Promise<LLMResponse>;

export { APIKeyError, type AnthropicConfig, type GeminiConfig, LLM, type LLMConfig, type LLMContentPart, type LLMContentPartFileBase64, type LLMContentPartFileId, type LLMContentPartFileURL, type LLMContentPartImage, type LLMContentPartText, LLMError, type LLMMessage, type LLMMessageContent, LLMProvider, type LLMProviderConfig, LLMReasoning, type LLMResponse, type MessageRole, type OpenAIConfig, TimeoutError, UnsupportedProviderError, createLLMError, generate, generateStructured, generateWithOpenAI };
