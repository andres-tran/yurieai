import OpenAI from "openai"

export const runtime = "nodejs"

type GenerateBody = {
  prompt: string
  size?: string
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

    // Validate and narrow size to the allowed union for the Images API
    const allowedSizes = [
      "auto",
      "256x256",
      "512x512",
      "1024x1024",
      "1024x1536",
      "1536x1024",
      "1024x1792",
      "1792x1024",
    ] as const
    type AllowedSize = (typeof allowedSizes)[number]
    const requestedSize: AllowedSize = allowedSizes.includes(size as AllowedSize)
      ? (size as AllowedSize)
      : "1024x1024"

    const result = await client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt,
      size: requestedSize,
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


