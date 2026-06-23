import type { OpenRouterMessage } from "@/types/chat";

interface StreamFusionOptions {
  messages: OpenRouterMessage[];
  panelModels: string[];
  judgeModel: string;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamFusion({
  messages,
  panelModels,
  judgeModel,
  onChunk,
  onDone,
  onError,
}: StreamFusionOptions): Promise<void> {
  let res: Response;

  try {
    res = await fetch("/api/fusion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, panelModels, judgeModel }),
    });
  } catch (err) {
    onError(err instanceof Error ? err.message : "Network error");
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    onError(`Error ${res.status}${text ? `: ${text}` : ""}`);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response body from server");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

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
        if (data === "[DONE]") {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (typeof content === "string" && content) {
            onChunk(content);
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  onDone();
}