import os
from typing import AsyncGenerator
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from agents import Agent, Runner
from agents.tool import WebSearchTool
from agents.memory import SQLiteSession

# --- Config ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in your environment.")

app = FastAPI(title="Web-Search Agent Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Agent ---
agent = Agent(
    name="Researcher",
    model="gpt-5",
    # Nudge the model to cite sources and use the tool sensibly
    instructions=(
        "You are a concise research assistant.\n"
        "Rules: Avoid duplicated words, avoid stuttering, avoid repeating tokens.\n"
        "When the user asks about current info or facts, use web search and cite sources inline as markdown links.\n"
        "Structure: Use short paragraphs, bullet points for lists, and bold key facts.\n"
        "When generating stories or long answers, keep sentences clean and varied."
    ),
    tools=[WebSearchTool()],  # Hosted web search tool
)


def get_session(session_id: str | None) -> SQLiteSession | None:
    if not session_id:
        return None
    # Persist conversation across requests with a lightweight SQLite DB file
    return SQLiteSession(session_id=session_id, db_path="sessions.db")


# --- Non‑streaming chat ---
@app.post("/api/chat")
async def chat(payload: dict):
    message = payload.get("message")
    session_id = payload.get("session_id")
    if not message:
        raise HTTPException(400, "Missing 'message'")

    session = get_session(session_id)
    result = await Runner.run(agent, message, session=session)

    return JSONResponse({
        "output": result.final_output,
        # A tiny bit of introspection; ignore if not needed
        "turns": result.turns,
    })


# --- Streaming chat (SSE) ---
@app.get("/api/stream")
async def stream(request: Request):
    message = request.query_params.get("message")
    session_id = request.query_params.get("session_id")
    if not message:
        raise HTTPException(400, "Missing 'message' query param")

    session = get_session(session_id)

    async def event_generator() -> AsyncGenerator[dict, None]:
        # Kick off a streamed run
        streamed = Runner.run_streamed(agent, input=message, session=session)

        # Stream token deltas to the client as SSE events
        async for ev in streamed.stream_events():
            # Forward raw token deltas (OpenAI Responses API events)
            if ev.type == "raw_response_event":
                # Only forward text deltas
                try:
                    from openai.types.responses import ResponseTextDeltaEvent
                    if isinstance(ev.data, ResponseTextDeltaEvent) and ev.data.delta:
                        yield {"event": "token", "data": ev.data.delta}
                except Exception:
                    # If event class missing, just ignore gracefully
                    pass

        # Signal completion so the client can finalize the message
        yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


# Healthcheck
@app.get("/health")
async def health():
    return {"ok": True}


