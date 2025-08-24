import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import { openproviders } from "@/lib/openproviders"
import { Message as MessageAISDK, streamText } from "ai"
// usage tracking removed
import { createErrorResponse, extractErrorMessage } from "./utils"
import { openai } from "@ai-sdk/openai"

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  model: string
  systemPrompt: string
  enableSearch: boolean
}

export async function POST(req: Request) {
  try {
    const { messages, chatId, model, systemPrompt, enableSearch } =
      (await req.json()) as ChatRequest

    if (!messages || !chatId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    // usage tracking removed

    const allModels = await getAllModels()
    const modelConfig = allModels.find((m) => m.id === model)

    if (!modelConfig) {
      throw new Error(`Model ${model} not found`)
    }

    const effectiveSystemPrompt = systemPrompt || SYSTEM_PROMPT_DEFAULT

    const apiKey: string | undefined = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY in server environment")
      return new Response(
        JSON.stringify({
          error:
            "Server is not configured with OPENAI_API_KEY. Add it to .env.local and restart.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const tools = enableSearch
      ? {
          web_search_preview: openai.tools.webSearchPreview({
            searchContextSize: "high",
            userLocation: {
              type: "approximate",
              country: "US",
              timezone: "America/Chicago",
            },
          }),
        }
      : undefined

      const result = streamText({
        model:
          // Prefer server-side construction to avoid leaking provider impl to client bundles
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (modelConfig as any).apiSdk
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (modelConfig as any).apiSdk(apiKey, { enableSearch })
            : // eslint-disable-next-line @typescript-eslint/no-explicit-any
              openproviders(model as any, apiKey),
      system: effectiveSystemPrompt,
      messages: messages,
      temperature: 1,
      ...(tools && { tools }),
      reasoning: { effort: "high" },
      maxSteps: 10,
      onError: (err: unknown) => {
        console.error("Streaming error occurred:", err)
        // Don't set streamError anymore - let the AI SDK handle it through the stream
      },

      onFinish: async () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

    return result.toDataStreamResponse({
      sendReasoning: true,
      sendSources: true,
      getErrorMessage: (error: unknown) => {
        console.error("Error forwarded to client:", error)
        return extractErrorMessage(error)
      },
    })
  } catch (err: unknown) {
    console.error("Error in /api/chat:", err)
    const error = err as {
      code?: string
      message?: string
      statusCode?: number
    }

    return createErrorResponse(error)
  }
}
