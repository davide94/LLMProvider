"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  APIKeyError: () => APIKeyError,
  LLM: () => LLM,
  LLMError: () => LLMError,
  LLMProvider: () => LLMProvider,
  LLMReasoning: () => LLMReasoning,
  TimeoutError: () => TimeoutError,
  UnsupportedProviderError: () => UnsupportedProviderError,
  createLLM: () => createLLM,
  createLLMError: () => createLLMError,
  detectProvider: () => detectProvider,
  generate: () => generate,
  generateStructured: () => generateStructured,
  generateWithOpenAI: () => generateWithOpenAI
});
module.exports = __toCommonJS(index_exports);

// src/providers/openai.ts
var import_openai = __toESM(require("openai"));
var import_openai2 = require("@langfuse/openai");

// src/core/errors.ts
var LLMError = class extends Error {
  provider;
  statusCode;
  code;
  originalError;
  constructor(options) {
    super(options.message);
    this.name = "LLMError";
    this.statusCode = options.statusCode ?? 500;
    this.provider = options.provider;
    this.code = options.code;
    this.originalError = options.originalError;
  }
};
var APIKeyError = class extends LLMError {
  constructor(provider) {
    super({
      message: `API key not configured for ${provider}`,
      statusCode: 401,
      provider,
      code: "API_KEY_MISSING"
    });
    this.name = "APIKeyError";
  }
};
var TimeoutError = class extends LLMError {
  constructor(provider, timeout) {
    super({
      message: `Request to ${provider} timed out after ${timeout}ms`,
      statusCode: 408,
      provider,
      code: "TIMEOUT"
    });
    this.name = "TimeoutError";
  }
};
var UnsupportedProviderError = class extends LLMError {
  constructor(provider) {
    super({
      message: `Unsupported LLM provider: ${provider}`,
      statusCode: 400,
      code: "UNSUPPORTED_PROVIDER"
    });
    this.name = "UnsupportedProviderError";
  }
};
function createLLMError(options) {
  return new LLMError(options);
}

// src/providers/openai.ts
var openaiClient = null;
function getOpenAIClient(enableTracing) {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new APIKeyError("openai");
    }
    const client = new import_openai.default({ apiKey });
    openaiClient = enableTracing ? (0, import_openai2.observeOpenAI)(client) : client;
  }
  return openaiClient;
}
function formatInput(messages, systemPrompt) {
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }
  if (typeof messages === "string") {
    formattedMessages.push({ role: "user", content: messages });
  } else {
    for (const msg of messages) {
      formattedMessages.push(msg);
    }
  }
  return formattedMessages;
}
function normalizeSchemaForStrictMode(schema) {
  const normalized = JSON.parse(JSON.stringify(schema));
  function processSchema(obj) {
    if (typeof obj !== "object" || obj === null) return;
    if (obj.type === "object" && !("additionalProperties" in obj)) {
      obj.additionalProperties = false;
    }
    if (obj.properties && typeof obj.properties === "object") {
      for (const key in obj.properties) {
        processSchema(obj.properties[key]);
      }
    }
    if (obj.items) {
      processSchema(obj.items);
    }
    for (const key of ["anyOf", "allOf", "oneOf"]) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach(processSchema);
      }
    }
  }
  processSchema(normalized);
  return normalized;
}
function convertSchemaToResponseFormat(schema) {
  return {
    type: "json_schema",
    name: schema.title ?? "response",
    schema: normalizeSchemaForStrictMode(schema),
    strict: true
  };
}
async function generateWithOpenAI(prompt, config) {
  const client = getOpenAIClient(config.enableTracing ?? true);
  const input = formatInput(prompt, config.systemPrompt);
  const params = {
    model: config.model,
    input,
    temperature: config.temperature ?? 0.7,
    top_p: config.topP,
    max_output_tokens: config.maxTokens
  };
  if (config.reasoning) {
    params.reasoning = { effort: config.reasoning };
  }
  if (config.schema) {
    params.text = { format: convertSchemaToResponseFormat(config.schema) };
  }
  try {
    const completion = await client.responses.create(params, {
      timeout: config.timeout
    });
    let content;
    if (completion.output[0]?.type === "message" && completion.output[0].content[0].type === "output_text") {
      content = completion.output[0].content[0].text;
    } else {
      throw new LLMError({
        message: "Unsupported OpenAI response format",
        statusCode: 500,
        provider: "openai"
      });
    }
    let structuredOutput;
    if (config.schema && content) {
      try {
        structuredOutput = JSON.parse(content);
      } catch {
        console.error("Failed to parse OpenAI structured output");
      }
    }
    return {
      content,
      provider: "openai",
      model: config.model,
      usage: completion.usage ? {
        inputTokens: completion.usage.input_tokens,
        outputTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.total_tokens
      } : void 0,
      structuredOutput
    };
  } catch (error) {
    if (error instanceof LLMError) throw error;
    const err = error;
    if (err.name === "AbortError") {
      throw new TimeoutError("openai", config.timeout ?? 9e4);
    }
    throw new LLMError({
      message: err.message || "OpenAI generation failed",
      statusCode: err.status || 500,
      provider: "openai",
      originalError: error
    });
  }
}

// src/core/llm.ts
var DEFAULT_TIMEOUT = 9e4;
function detectProvider(model) {
  const modelLower = model.toLowerCase();
  if (modelLower.includes("gpt") || modelLower.includes("o1") || modelLower.includes("o3") || modelLower.includes("davinci") || modelLower.includes("curie") || modelLower.includes("babbage") || modelLower.includes("ada")) {
    return "openai";
  }
  if (modelLower.includes("claude")) {
    return "anthropic";
  }
  if (modelLower.includes("gemini") || modelLower.includes("palm")) {
    return "gemini";
  }
  console.warn(`Could not detect provider for model "${model}", defaulting to OpenAI`);
  return "openai";
}
var LLM = class {
  config;
  constructor(config) {
    this.config = {
      ...config,
      provider: config.provider || detectProvider(config.model),
      timeout: config.timeout || DEFAULT_TIMEOUT,
      enableTracing: config.enableTracing ?? true
    };
  }
  /**
   * Generate text (non-streaming)
   * @param prompt - String prompt or array of messages
   * @returns LLM response with generated text
   */
  async generate(prompt) {
    switch (this.config.provider) {
      case "openai":
        return generateWithOpenAI(prompt, this.config);
      default:
        throw new UnsupportedProviderError(this.config.provider);
    }
  }
  /**
   * Get the current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};
function createLLM(config) {
  return new LLM(config);
}
async function generate(model, prompt, options) {
  const llm = createLLM({ model, ...options });
  const response = await llm.generate(prompt);
  return response.content;
}
async function generateStructured(model, prompt, schema, options) {
  const llm = createLLM({ model, schema, ...options });
  const response = await llm.generate(prompt);
  return response.structuredOutput ?? {};
}

// src/core/types.ts
var LLMProvider = /* @__PURE__ */ ((LLMProvider2) => {
  LLMProvider2["OpenAI"] = "openai";
  LLMProvider2["Anthropic"] = "anthropic";
  LLMProvider2["Gemini"] = "gemini";
  return LLMProvider2;
})(LLMProvider || {});
var LLMReasoning = /* @__PURE__ */ ((LLMReasoning2) => {
  LLMReasoning2["None"] = "none";
  LLMReasoning2["Minimal"] = "minimal";
  LLMReasoning2["Low"] = "low";
  LLMReasoning2["Medium"] = "medium";
  LLMReasoning2["High"] = "high";
  return LLMReasoning2;
})(LLMReasoning || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  APIKeyError,
  LLM,
  LLMError,
  LLMProvider,
  LLMReasoning,
  TimeoutError,
  UnsupportedProviderError,
  createLLM,
  createLLMError,
  detectProvider,
  generate,
  generateStructured,
  generateWithOpenAI
});
