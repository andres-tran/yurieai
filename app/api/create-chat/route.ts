export async function POST(request: Request) {
  try {
    const { userId, title, model, projectId } = await request.json()

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      })
    }

    // Create ephemeral chat server-side is disabled; respond with client-only payload
    const chat = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: title || "New Chat",
      model,
      project_id: projectId || null,
      public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

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
