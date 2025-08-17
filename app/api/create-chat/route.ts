import { createChatInDb } from "./api"

export async function POST(request: Request) {
  try {
    const { userId, title, model, projectId } =
      await request.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    const chat = await createChatInDb({
      userId,
      title,
      model,
      projectId,
    })

    return new Response(JSON.stringify({ chat }), { status: 200 })
  } catch (err: unknown) {
    console.error("Error in create-chat endpoint:", err)

    if (err instanceof Error && err.message === "DAILY_LIMIT_REACHED") {
      return new Response(
        JSON.stringify({ error: err.message, code: "DAILY_LIMIT_REACHED" }),
        { status: 403 }
      )
    }

    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}
