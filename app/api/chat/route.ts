import OpenAI from "openai"

export const runtime = "nodejs"

type IncomingMessage = {
  role: "user" | "assistant" | "developer"
  content: string
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 })
    }

    const {
      messages,
      instructions,
      model,
      input,
    }: {
      messages?: IncomingMessage[]
      instructions?: string
      model?: string
      // When provided, this should already be in Responses API input format
      input?: unknown
    } = await req.json()

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const selectedModel = model || process.env.OPENAI_MODEL || "gpt-5"

    // Prefer the caller-provided multimodal input when present; otherwise map simple messages to text
    const inputPayload =
      input ?? (Array.isArray(messages) ? messages.map((m) => ({ role: m.role, content: m.content })) : [])

    // Stream from OpenAI and forward as SSE so the client can parse incremental tokens
    const stream = await client.responses.stream({
      model: selectedModel,
      ...(instructions ? { instructions } : {}),
      input: inputPayload as any,
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (event: string, data: unknown) => {
          const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(payload))
        }

        // Forward key events commonly used by clients
        stream.on("response.output_text.delta", (e: any) => {
          send("response.output_text.delta", { delta: e.delta ?? "", snapshot: e.snapshot ?? "" })
        })
        stream.on("response.output_text.done", (e: any) => {
          send("response.output_text.done", e)
        })
        stream.on("response.completed", (e: any) => {
          send("response.completed", e)
        })
        stream.on("error", (e: any) => {
          send("error", { message: e?.message || "Unknown error" })
        })
        stream.on("abort", (_e: any) => {
          send("done", {})
          controller.close()
        })
        stream.on("end", () => {
          send("done", {})
          controller.close()
        })
      },
      cancel() {
        try {
          // Abort upstream if client disconnects
          ;(stream as any)?.abort?.()
        } catch {}
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}


