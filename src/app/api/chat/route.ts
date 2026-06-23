import { OPENROUTER_BASE_URL, openrouterHeaders } from "@/lib/openrouter";

const ts = () => new Date().toTimeString().slice(0, 8);

export async function POST(req: Request) {
  const start = Date.now();

  let model: string;
  let messages: { role: string; content: string }[];

  try {
    ({ model, messages } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!model || !messages?.length) {
    return Response.json(
      { error: "model and messages are required" },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: openrouterHeaders(),
      body: JSON.stringify({ model, messages, stream: true }),
    });
  } catch (err) {
    console.error(`[${ts()}] [chat] fetch error:`, err);
    return Response.json({ error: "Failed to reach OpenRouter" }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error(
      `[${ts()}] [chat] upstream ${upstream.status}: ${errText.slice(0, 200)}`
    );
    return Response.json(
      { error: `OpenRouter error ${upstream.status}` },
      { status: upstream.status }
    );
  }

  // Wrap the upstream body in a TransformStream so we can log on completion
  let charCount = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      charCount += chunk.length;
      controller.enqueue(chunk);
    },
    flush() {
      console.log(
        `[${ts()}] [chat] model=${model} chars≈${charCount} duration=${Date.now() - start}ms`
      );
    },
  });

  return new Response(upstream.body!.pipeThrough(transform), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
