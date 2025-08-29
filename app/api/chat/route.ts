import { SYSTEM_PROMPT_DEFAULT } from "@/lib/config"
import { getAllModels } from "@/lib/models"
import type { Message } from "@/lib/chat/types"
import OpenAI from "openai"
import { createErrorResponse } from "./utils"

export const maxDuration = 60

type ChatRequest = {
  messages: Message[]
  chatId: string
  model: string
  systemPrompt: string
  enableSearch: boolean
}

export async function POST(req: Request) {
  try {
    const { messages, chatId, model, systemPrompt } =
      (await req.json()) as ChatRequest

    if (!messages || !chatId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

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

    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: effectiveSystemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    })

    const content = response.choices[0]?.message?.content || ""

    return new Response(JSON.stringify({ content }), {
      headers: { "Content-Type": "application/json" },
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
