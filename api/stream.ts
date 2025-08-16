export const config = {
  runtime: 'edge',
};

type ChatCompletionChunk = {
  choices?: Array<{ delta?: { content?: string } }>
};

export default async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const message = url.searchParams.get('message') || '';
    if (!message) {
      return new Response(JSON.stringify({ error: "Missing 'message' query param" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server missing OPENAI_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const system =
      'You are Yurie, a concise research assistant. Answer clearly with short paragraphs, bullet points when helpful, and bold key facts using Markdown.';

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        stream: true,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '');
      return new Response(JSON.stringify({ error: 'Upstream error', details: text }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let buffer = '';
        const reader = upstream.body!.getReader();

        function sendEvent(event: string, data: string) {
          const payload = `event: ${event}\n` + `data: ${data}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        function pump(): void {
          reader.read().then(({ done, value }) => {
            if (done) {
              sendEvent('done', '[DONE]');
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || '';
            for (const part of parts) {
              const lines = part.split('\n');
              for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const data = line.replace(/^data:\s?/, '');
                if (data === '[DONE]') {
                  sendEvent('done', '[DONE]');
                  controller.close();
                  return;
                }
                try {
                  const json = JSON.parse(data) as ChatCompletionChunk;
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) sendEvent('token', delta);
                } catch {
                  // Ignore malformed lines
                }
              }
            }

            pump();
          }).catch(err => {
            sendEvent('token', `\n\n[Streaming error: ${String(err)}]`);
            sendEvent('done', '[DONE]');
            controller.close();
          });
        }

        pump();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Unexpected server error', details: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


