import { createErrorResponse } from "../chat/utils";

export const maxDuration = 60;

interface ImageRequest {
  prompt: string;
}

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as ImageRequest;
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt" }),
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY in server environment");
      return new Response(
        JSON.stringify({
          error:
            "Server is not configured with OPENAI_API_KEY. Add it to .env.local and restart.",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
        }),
      }
    );

    if (!response.ok) {
      let message = `Images API request failed with status ${response.status}`;
      try {
        const err = await response.json();
        message = err.error?.message || message;
      } catch {
        // ignore json parse errors and use default message
      }
      return createErrorResponse({
        message,
        statusCode: response.status,
      });
    }

    const data = await response.json();
    const image = data.data?.[0]?.b64_json;
    if (!image) {
      return createErrorResponse({
        message: "No image returned from OpenAI",
        statusCode: 502,
      });
    }

    return new Response(JSON.stringify({ image }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in /api/images:", err);
    const error = err as {
      code?: string;
      message?: string;
      statusCode?: number;
    };
    return createErrorResponse(error);
  }
}
