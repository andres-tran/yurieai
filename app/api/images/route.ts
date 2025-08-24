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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: prompt,
        tools: [{ type: "image_generation" }],
      }),
    });

    if (!response.ok) {
      // OpenAI occasionally returns HTML error pages (e.g. from nginx) which are not
      // useful for clients. Attempt to parse a JSON error message and fall back to
      // a generic one when parsing fails.
      let message: string;
      let code: string | undefined;
      try {
        const errText = await response.text();
        const parsed = JSON.parse(errText);
        message =
          parsed.error?.message || parsed.message || "Request to OpenAI failed";
        code = parsed.error?.code;
      } catch {
        message = "Request to OpenAI failed";
      }

      return createErrorResponse({
        message,
        code,
        statusCode: response.status,
      });
    }

    const data = await response.json();
    const image = data.output
      ?.filter((o: { type: string }) => o.type === "image_generation_call")
      .map((o: { result: string }) => o.result)[0];
    if (!image) {
      return createErrorResponse({
        message: "No image returned from OpenAI",
        statusCode: 500,
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
