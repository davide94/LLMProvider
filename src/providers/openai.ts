/**
 * OpenAI Provider Adapter
 * Handles OpenAI API integration for text generation and structured outputs
 */
import OpenAI from 'openai'
import { observeOpenAI } from '@langfuse/openai'
import type { ResponseInput, ResponseInputItem } from 'openai/resources/responses/responses.mjs'
import type { LLMConfig, LLMResponse, LLMProvider, LLMMessage, LLMContentPart } from '../core/types'
import { LLMError, APIKeyError, TimeoutError } from '../core/errors'

import { NodeSDK } from '@opentelemetry/sdk-node'
import { LangfuseSpanProcessor } from '@langfuse/otel'

const sdk = new NodeSDK({
  spanProcessors: [new LangfuseSpanProcessor()]
})

sdk.start()

/**
 * OpenAI client singleton
 */
let openaiClient: OpenAI | null = null

/**
 * Get or create OpenAI client instance
 */
function getOpenAIClient(enableTracing: boolean): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new APIKeyError('openai' as LLMProvider)
    }
    const client = new OpenAI({ apiKey })
    openaiClient = enableTracing ? observeOpenAI(client) : client
  }
  return openaiClient
}

/**
 * Convert LLMContentPart to OpenAI format
 */
function convertContentPart(part: LLMContentPart): OpenAI.Responses.ResponseInputContent {
  switch (part.type) {
    case 'text':
    case 'input_image':
    case 'input_file':
      return part as OpenAI.Responses.ResponseInputContent
    default:
      throw new LLMError({
        message: `Unsupported content part type: ${(part as { type: string }).type}`,
        statusCode: 400,
        provider: 'openai' as LLMProvider
      })
  }
}

/**
 * Convert LLMMessages to OpenAI format
 */
function formatInput(messages: string | LLMMessage[], systemPrompt?: string): ResponseInput {
  const formattedMessages: ResponseInputItem[] = []

  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt })
  }

  if (typeof messages === 'string') {
    formattedMessages.push({ role: 'user', content: messages })
  } else {
    for (const msg of messages) {
      formattedMessages.push(msg as ResponseInputItem)
    }
  }

  return formattedMessages
}

/**
 * Normalize JSON schema for OpenAI strict mode
 */
function normalizeSchemaForStrictMode(schema: Record<string, unknown>): Record<string, unknown> {
  const normalized = JSON.parse(JSON.stringify(schema))

  function processSchema(obj: Record<string, unknown>): void {
    if (typeof obj !== 'object' || obj === null) return

    if (obj.type === 'object' && !('additionalProperties' in obj)) {
      obj.additionalProperties = false
    }

    if (obj.properties && typeof obj.properties === 'object') {
      for (const key in obj.properties as Record<string, unknown>) {
        processSchema((obj.properties as Record<string, Record<string, unknown>>)[key])
      }
    }

    if (obj.items) {
      processSchema(obj.items as Record<string, unknown>)
    }

    for (const key of ['anyOf', 'allOf', 'oneOf']) {
      if (Array.isArray(obj[key])) {
        (obj[key] as Record<string, unknown>[]).forEach(processSchema)
      }
    }
  }

  processSchema(normalized)
  return normalized
}

/**
 * Convert JSON schema to OpenAI response format
 */
function convertSchemaToResponseFormat(schema: Record<string, unknown>) {
  return {
    type: 'json_schema' as const,
    name: (schema.title as string) ?? 'response',
    schema: normalizeSchemaForStrictMode(schema),
    strict: true
  }
}

/**
 * Generate text with OpenAI (non-streaming)
 */
export async function generateWithOpenAI(
  prompt: string | LLMMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const client = getOpenAIClient(config.enableTracing ?? true)
  const input = formatInput(prompt, config.systemPrompt)

  const params: OpenAI.Responses.ResponseCreateParams = {
    model: config.model,
    input,
    temperature: config.temperature ?? 0.7,
    top_p: config.topP,
    max_output_tokens: config.maxTokens
  }

  if (config.reasoning) {
    params.reasoning = { effort: config.reasoning }
  }

  if (config.schema) {
    params.text = { format: convertSchemaToResponseFormat(config.schema) }
  }

  try {
    const completion = await client.responses.create(params, {
      timeout: config.timeout
    })

    let content: string
    if (
      completion.output[0]?.type === 'message' &&
      completion.output[0].content[0].type === 'output_text'
    ) {
      content = completion.output[0].content[0].text
    } else {
      throw new LLMError({
        message: 'Unsupported OpenAI response format',
        statusCode: 500,
        provider: 'openai' as LLMProvider
      })
    }

    let structuredOutput: Record<string, unknown> | undefined
    if (config.schema && content) {
      try {
        structuredOutput = JSON.parse(content)
      } catch {
        console.error('Failed to parse OpenAI structured output')
      }
    }

    return {
      content,
      provider: 'openai' as LLMProvider,
      model: config.model,
      usage: completion.usage
        ? {
            inputTokens: completion.usage.input_tokens,
            outputTokens: completion.usage.output_tokens,
            totalTokens: completion.usage.total_tokens
          }
        : undefined,
      structuredOutput
    }
  } catch (error: unknown) {
    if (error instanceof LLMError) throw error

    const err = error as { name?: string; status?: number; message?: string }
    if (err.name === 'AbortError') {
      throw new TimeoutError('openai' as LLMProvider, config.timeout ?? 90000)
    }

    throw new LLMError({
      message: err.message || 'OpenAI generation failed',
      statusCode: err.status || 500,
      provider: 'openai' as LLMProvider,
      originalError: error
    })
  }
}
