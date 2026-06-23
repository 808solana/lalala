import type { AgentStepOutput, AgentStepDefinition } from "@/types/chat";
import { DEFAULT_AGENT_CHAIN } from "@/lib/agentChain";

interface StreamAgentOptions {
  messages: { role: string; content: string }[];
  model: string;
  chain?: AgentStepDefinition[];
  onStepsInit: (steps: AgentStepOutput[]) => void;
  onChunk: (stepId: string, text: string) => void;
  onStepStreamingChange: (stepId: string, streaming: boolean) => void;
  onSetCollapsed: (stepId: string, collapsed: boolean) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

export async function streamAgent({
  messages,
  model,
  chain,
  onStepsInit,
  onChunk,
  onStepStreamingChange,
  onSetCollapsed,
  onDone,
  onError,
}: StreamAgentOptions): Promise<void> {
  const steps = chain?.length ? chain : DEFAULT_AGENT_CHAIN;

  const body: { messages: typeof messages; model: string; steps?: AgentStepDefinition[] } = {
    messages,
    model,
  };
  if (chain?.length) {
    body.steps = chain;
  }

  let res: Response;
  try {
    res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  // Pre-initialize all steps. Research starts expanded, others start collapsed.
  const initialSteps: AgentStepOutput[] = steps.map((s, i) => ({
    id: s.id,
    name: s.name,
    content: "",
    streaming: false,
    collapsed: i !== 0,
  }));
  onStepsInit(initialSteps);

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
          const evt = JSON.parse(data);
          switch (evt.type) {
            case "step_start":
              onSetCollapsed(evt.stepId, false);
              onStepStreamingChange(evt.stepId, true);
              break;
            case "delta":
              onChunk(evt.stepId, evt.content);
              break;
            case "step_end":
              onStepStreamingChange(evt.stepId, false);
              onSetCollapsed(evt.stepId, true);
              break;
            case "error":
              if (evt.stepId) {
                onStepStreamingChange(evt.stepId, false);
                onSetCollapsed(evt.stepId, true);
              }
              onError(evt.message);
              return;
            case "done":
              // Collapse all steps when chain is complete
              for (const s of steps) {
                onSetCollapsed(s.id, true);
              }
              onDone();
              return;
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Ensure all collapsed on finish
  for (const s of steps) {
    onSetCollapsed(s.id, true);
  }
  onDone();
}