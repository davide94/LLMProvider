import { LLMProvider } from './types'

/**
 * Base LLM error class
 */
export class LLMError extends Error {
  public readonly provider?: LLMProvider
  public readonly statusCode: number
  public readonly code?: string
  public readonly originalError?: unknown

  constructor(options: {
    message: string
    statusCode?: number
    provider?: LLMProvider
    code?: string
    originalError?: unknown
  }) {
    super(options.message)
    this.name = 'LLMError'
    this.statusCode = options.statusCode ?? 500
    this.provider = options.provider
    this.code = options.code
    this.originalError = options.originalError
  }
}

/**
 * Error for missing API keys
 */
export class APIKeyError extends LLMError {
  constructor(provider: LLMProvider) {
    super({
      message: `API key not configured for ${provider}`,
      statusCode: 401,
      provider,
      code: 'API_KEY_MISSING'
    })
    this.name = 'APIKeyError'
  }
}

/**
 * Error for timeouts
 */
export class TimeoutError extends LLMError {
  constructor(provider: LLMProvider, timeout: number) {
    super({
      message: `Request to ${provider} timed out after ${timeout}ms`,
      statusCode: 408,
      provider,
      code: 'TIMEOUT'
    })
    this.name = 'TimeoutError'
  }
}

/**
 * Error for unsupported providers
 */
export class UnsupportedProviderError extends LLMError {
  constructor(provider: string) {
    super({
      message: `Unsupported LLM provider: ${provider}`,
      statusCode: 400,
      code: 'UNSUPPORTED_PROVIDER'
    })
    this.name = 'UnsupportedProviderError'
  }
}

/**
 * Create an LLM error
 */
export function createLLMError(options: {
  message: string
  statusCode?: number
  provider?: LLMProvider
  code?: string
  originalError?: unknown
}): LLMError {
  return new LLMError(options)
}
