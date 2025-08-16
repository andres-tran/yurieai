import os
import sqlite3
from contextlib import closing
from datetime import datetime
from typing import AsyncGenerator, List, Literal, Tuple

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

try:
    from openai import OpenAI
except Exception as _e:  # pragma: no cover - library may not be installed during lint
    OpenAI = None  # type: ignore


# --- Config ---
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Set OPENAI_API_KEY in your environment.")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

DB_PATH = os.getenv("SESSIONS_DB_PATH", os.path.join(os.path.dirname(__file__), "sessions.db"))

app = FastAPI(title="Yurie Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Persistence (very small SQLite helper) ---
def init_db() -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def read_history(session_id: str) -> List[Tuple[str, str]]:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        cur = conn.execute(
            "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC",
            (session_id,),
        )
        return [(row[0], row[1]) for row in cur.fetchall()]


def append_message(session_id: str, role: Literal["user", "assistant"], content: str) -> None:
    with closing(sqlite3.connect(DB_PATH)) as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)",
            (session_id, role, content, datetime.utcnow().isoformat()),
        )
        conn.commit()


init_db()


def build_openai_messages(history: List[Tuple[str, str]], new_user_text: str) -> list:
    messages = [
        {
            "role": "system",
            "content": (
                "You are Yurie, a concise research assistant."
                " Answer clearly with short paragraphs, bullet points when helpful,"
                " and bold key facts using Markdown."
            ),
        }
    ]
    for role, content in history:
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": new_user_text})
    return messages


# --- Non‑streaming chat ---
@app.post("/api/chat")
async def chat(payload: dict):
    message = payload.get("message")
    session_id = payload.get("session_id")
    if not message:
        raise HTTPException(400, "Missing 'message'")
    if not session_id:
        raise HTTPException(400, "Missing 'session_id'")

    client = OpenAI(api_key=OPENAI_API_KEY) if OpenAI else None
    if client is None:
        raise HTTPException(500, "OpenAI SDK not installed on server")

    history = read_history(session_id)
    append_message(session_id, "user", message)

    completion = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=build_openai_messages(history, message),
        temperature=0.4,
    )
    text = completion.choices[0].message.content or ""
    append_message(session_id, "assistant", text)

    return JSONResponse({
        "output": text,
        "turns": len(history) // 2 + 1,
    })


# --- Streaming chat (SSE) ---
@app.get("/api/stream")
async def stream(request: Request):
    message = request.query_params.get("message")
    session_id = request.query_params.get("session_id")
    if not message:
        raise HTTPException(400, "Missing 'message' query param")
    if not session_id:
        raise HTTPException(400, "Missing 'session_id' query param")

    client = OpenAI(api_key=OPENAI_API_KEY) if OpenAI else None
    if client is None:
        raise HTTPException(500, "OpenAI SDK not installed on server")

    history = read_history(session_id)

    async def event_generator() -> AsyncGenerator[dict, None]:
        append_message(session_id, "user", message)
        accumulated: list[str] = []

        try:
            # Stream chat completions in small deltas (OpenAI Python v1 style)
            stream = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=build_openai_messages(history, message),
                temperature=0.4,
                stream=True,
            )
            for chunk in stream:  # type: ignore[assignment]
                try:
                    delta = chunk.choices[0].delta.content  # pyright: ignore[reportAttributeAccessIssue]
                except Exception:
                    delta = None
                if delta:
                    accumulated.append(delta)
                    yield {"event": "token", "data": delta}
        except Exception as e:  # Failsafe to avoid leaving client hanging
            yield {"event": "token", "data": f"\n\n[Streaming error: {e}]"}

        final_text = "".join(accumulated)
        if final_text:
            append_message(session_id, "assistant", final_text)

        # Signal completion so the client can finalize the message
        yield {"event": "done", "data": "[DONE]"}

    return EventSourceResponse(event_generator())


# Healthcheck
@app.get("/health")
async def health():
    return {"ok": True}


