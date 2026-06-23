import { OPENROUTER_BASE_URL, openrouterHeaders } from "@/lib/openrouter";
import { DEFAULT_AGENT_CHAIN } from "@/lib/agentChain";
import type { AgentStepDefinition } from "@/types/chat";

const ts = () => new Date().toTimeString().slice(0, 8);

interface IncomingBody {
  messages: { role: string; content: string }[];
  model: string;
  steps?: AgentStepDefinition[];
}

/**
 * Streaming protocol (one SSE stream, typed events):
 *   data: {"type":"step_start","stepId":"research","name":"Research"}\n\n
 *   data: {"type":"delta","stepId":"research","content":"..."}\n\n
 *   data: {"type":"step_end","stepId":"research"}\n\n
 *   ... (repeat for each step)
 *   data: {"type":"done"}\n\n
 *
 * Each step's output becomes context for the next step's prompt.
 * If `steps` is provided in the body, it replaces the default fixed chain.
 * Per-step `modelOverride` overrides the shared `model` for that step only.
 */
export async function POST(req: Request) {
  const chainStart = Date.now();

  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, model, steps } = body;

  if (!messages?.length || !model) {
    return Response.json(
      { error: "messages and model are required" },
      { status: 400 }
    );
  }

  const chain = steps?.length ? steps : DEFAULT_AGENT_CHAIN;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      const userQuery =
        [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

      let previousOutput = "";

      for (let i = 0; i < chain.length; i++) {
        const step = chain[i];
        const stepStart = Date.now();
        const stepModel = step.modelOverride ?? model;

        send({ type: "step_start", stepId: step.id, name: step.name });

        // Build the per-step message list.
        const userContent = previousOutput
          ? `User question:\n${userQuery}\n\nPrevious step output (${chain[i - 1]?.name ?? "prior step"}):\n${previousOutput}\n\nContinue the chain as ${step.name}.`
          : `User question:\n${userQuery}\n\nProceed as ${step.name}.`;

        const stepMessages = [
          { role: "system", content: step.prompt },
          { role: "user", content: userContent },
        ];

        let stepRes: Response;
        try {
          stepRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: openrouterHeaders(),
            body: JSON.stringify({
              model: stepModel,
              messages: stepMessages,
              stream: true,
            }),
          });
        } catch (err) {
          console.error(
            `[${ts()}] [agent:${step.name}] fetch error:`,
            err
          );
          send({
            type: "error",
            stepId: step.id,
            message: `Failed to reach OpenRouter at step ${step.name}`,
          });
          controller.close();
          return;
        }

        if (!stepRes.ok || !stepRes.body) {
          const errText = await stepRes.text().catch(() => "");
          console.error(
            `[${ts()}] [agent:${step.name}] upstream ${stepRes.status}: ${errText.slice(0, 200)}`
          );
          send({
            type: "error",
            stepId: step.id,
            message: `OpenRouter error ${stepRes.status} at step ${step.name}`,
          });
          controller.close();
          return;
        }

        // Parse the upstream SSE stream and forward deltas.
        const reader = stepRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let stepChars = 0;
        let stepOutput = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;
              const data = trimmed.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (typeof content === "string" && content) {
                  stepChars += content.length;
                  stepOutput += content;
                  send({ type: "delta", stepId: step.id, content });
                }
              } catch {
                // ignore malformed chunks
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        send({ type: "step_end", stepId: step.id });

        const modelLabel = step.modelOverride
          ? `${stepModel} (override)`
          : stepModel;
        console.log(
          `[${ts()}] [agent:${step.name}] model=${modelLabel} chars≈${stepChars} duration=${Date.now() - stepStart}ms`
        );

        // Carry this step's full output forward as context for the next step
        previousOutput = stepOutput;
      }

      send({ type: "done" });
      const customLabel = steps?.length ? "custom" : "default";
      console.log(
        `[${ts()}] [agent] chain complete model=${model} steps=${chain.length} chain=${customLabel} duration=${Date.now() - chainStart}ms`
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}