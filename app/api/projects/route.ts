import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Stub a successful project create
    const { name } = await request.json()
    return NextResponse.json({ id: "local", name })
  } catch (err: unknown) {
    console.error("Error in projects endpoint:", err)

    return new Response(
      JSON.stringify({
        error: (err as Error).message || "Internal server error",
      }),
      { status: 500 }
    )
  }
}

export async function GET() {
  // Return empty project list
  return NextResponse.json([])
}
