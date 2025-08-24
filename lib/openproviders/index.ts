import { createOpenAI, openai } from "@ai-sdk/openai"
import type { LanguageModelV1 } from "@ai-sdk/provider"
import type { OpenAIModel, SupportedModel } from "./types"

// Only OpenAI provider is supported
export function openproviders<T extends SupportedModel>(
  modelId: T,
  apiKey?: string
): LanguageModelV1 {
  if (apiKey) {
    const openaiProvider = createOpenAI({
      apiKey,
      compatibility: "strict",
    })
    // Use the Responses API model to support provider-defined tools like web_search_preview
    return openaiProvider.responses(modelId as OpenAIModel)
  }
  // Use the default provider in strict mode and Responses API variant
  return openai.responses(modelId as OpenAIModel)
}

