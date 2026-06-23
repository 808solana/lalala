import { OPENROUTER_BASE_URL, openrouterHeaders } from "@/lib/openrouter";

const ts = () => new Date().toTimeString().slice(0, 8);

export async function POST(req: Request) {
  const start = Date.now();

  let messages: { role: string; content: string }[];
  let panelModels: string[];
  let judgeModel: string;

  try {
    ({ messages, panelModels, judgeModel } = await req.json());
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!messages?.length || !panelModels?.length || !judgeModel) {
    return Response.json(
      { error: "messages, panelModels, and judgeModel are required" },
      { status: 400 }
    );
  }

  // Resolve a human-friendly name for the synthesizer so it knows who it is.
  // OpenRouter's default judge (when "openrouter/auto") is Claude Opus 4.8.
  const synthesizerName =
    judgeModel === "openrouter/auto"
      ? "Claude Opus 4.8 (Anthropic)"
      : judgeModel;

  // Inject a system message so the synthesizer always knows its own identity,
  // independent of prior chat context.
  const systemMessage = {
    role: "system",
    content: `You are the synthesizer of a multi-model fusion panel. You are currently running as: ${synthesizerName}. If asked what model you are, answer based on THIS identity, not on prior conversation context. The panel models that produced the candidate answers you are synthesizing were: ${panelModels.join(", ")}.`,
  };

  const finalMessages = [systemMessage, ...messages];

  console.log(
    `[${ts()}] [fusion] panel=[${panelModels.join(", ")}] fuseWith=${synthesizerName} starting`
  );

  // Build the plugin config — only set model override when not Auto
  const fusionPlugin: Record<string, unknown> = {
    id: "fusion",
    analysis_models: panelModels,
  };

  // "openrouter/auto" means let OpenRouter pick (defaults to Claude Opus).
  // Any other selection overrides the synthesizing model.
  if (judgeModel !== "openrouter/auto") {
    fusionPlugin.model = judgeModel;
  }

  const requestBody = {
    model: "openrouter/fusion",
    messages: finalMessages,
    stream: true,
    plugins: [fusionPlugin],
  };

  let upstream: Response;
  try {
    upstream = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: openrouterHeaders(),
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    console.error(`[${ts()}] [fusion] fetch error:`, err);
    return Response.json({ error: "Failed to reach OpenRouter" }, { status: 502 });
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error(
      `[${ts()}] [fusion] upstream ${upstream.status}: ${errText.slice(0, 200)}`
    );
    return Response.json(
      { error: `OpenRouter error ${upstream.status}` },
      { status: upstream.status }
    );
  }

  let charCount = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      charCount += chunk.length;
      controller.enqueue(chunk);
    },
    flush() {
      console.log(
        `[${ts()}] [fusion] panel=[${panelModels.join(", ")}] fuseWith=${judgeModel} chars≈${charCount} duration=${Date.now() - start}ms`
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
