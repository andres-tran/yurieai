import { LanguageModelV1 } from "ai"

type ModelConfig = {
  id: string // "gpt-4.1-nano" // same from AI SDKs
  name: string // "GPT-4.1 Nano"
  provider: string // "OpenAI"
  providerId: string // "openai"
  modelFamily?: string // "GPT-5"
  baseProviderId: string // "openai"

  description?: string // Short 1–2 line summary
  tags?: string[] // ["fast", "cheap", "vision", "OSS"]

  contextWindow?: number // in tokens
  inputCost?: number // USD per 1M input tokens
  outputCost?: number // USD per 1M output tokens
  priceUnit?: string // "per 1M tokens", "per image", etc.

  vision?: boolean
  tools?: boolean
  audio?: boolean
  reasoning?: boolean
  webSearch?: boolean
  openSource?: boolean

  speed?: "Fast" | "Medium" | "Slow"
  intelligence?: "Low" | "Medium" | "High"

  website?: string // official website (e.g. https://openai.com)
  apiDocs?: string // official API docs (e.g. https://platform.openai.com/docs/api-reference)
  modelPage?: string // official product page
  releasedAt?: string // "2024-12-01" (optional, for tracking changes)

  icon?: string // e.g. "openai"

  // apiSdk?: () => LanguageModelV1 // "openai("gpt-4.1-nano")"
  apiSdk?: (
    apiKey?: string,
    opts?: { enableSearch?: boolean }
  ) => LanguageModelV1

  accessible?: boolean // true if the model is accessible to the user
}

export type { ModelConfig }
