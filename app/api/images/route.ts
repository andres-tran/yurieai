import OpenAI from "openai"

export const runtime = "nodejs"

type GenerateBody = {
  prompt: string
  size?: "1024x1024" | "768x768" | "512x512" | string
  // optional input images (as URLs or data URLs) used for editing/variations in the future
  images?: string[]
  fidelity?: "low" | "high"
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 })
    }

    const { prompt, size, images, fidelity }: GenerateBody = await req.json()
    if (!prompt || typeof prompt !== "string") {
      return new Response("Missing prompt", { status: 400 })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: size || "1024x1024",
      // Note: We are not handling edits/variations here; this endpoint is for generations
      // Additional options like quality/background/output_format can be added later
    })

    const image_base64 = result.data?.[0]?.b64_json
    if (!image_base64) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ image: image_base64 }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(`Error: ${message}`, { status: 500 })
  }
}


