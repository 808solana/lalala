"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Brain } from "lucide-react";
import type { Message, AgentStepOutput } from "@/types/chat";
import { useChatStore } from "@/store/chat";

interface ChatAreaProps {
  messages: Message[];
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatArea({ messages, scrollContainerRef }: ChatAreaProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPinnedRef = useRef(true);
  const prevMessageCountRef = useRef(messages.length);

  // Track whether the user is pinned to the bottom of the scroll container.
  // If they've scrolled up to read, we stop auto-scrolling until they
  // scroll back down or a new message is added.
  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      isPinnedRef.current = distanceFromBottom < 80;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [scrollContainerRef]);

  useEffect(() => {
    const messageCountChanged =
      messages.length !== prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;

    // New message added (user submitted) → force scroll to bottom
    if (messageCountChanged) {
      isPinnedRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // Streaming chunk → only scroll if the user is still pinned to the bottom.
    // Instant (non-smooth) scroll avoids laggy animation on every token.
    if (isPinnedRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      {messages.map((message) => (
        <MessageRow key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageRow({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#675c56] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-base leading-relaxed whitespace-pre-wrap font-normal">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {message.mode === "fusion" && message.fusionPanelModels && message.fusionJudgeModel && (
        <FusionBadge
          panelModels={message.fusionPanelModels}
          judgeModel={message.fusionJudgeModel}
        />
      )}

      {message.mode === "agent" && message.agentSteps ? (
        <AgentOutput message={message} />
      ) : (
        <div className="max-w-full text-[#0d0c12] text-base leading-relaxed whitespace-pre-wrap font-normal">
          {message.error ? (
            <span className="text-red-600">{message.content}</span>
          ) : (
            <>
              {message.content}
              {message.streaming && (
                <span className="inline-block w-0.5 h-4 bg-[#675c56] ml-0.5 animate-pulse align-text-bottom" />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Agent mode layout:
 * - Writer's output → shown as a normal chat bubble (no step card)
 * - Research/Analysis/Reasoning → collapsible tabs below the answer
 * - While any non-writer step is actively streaming, it renders inline
 */
function AgentOutput({ message }: { message: Message }) {
  const toggleAgentStepCollapsed = useChatStore(
    (s) => s.toggleAgentStepCollapsed
  );

  const steps = message.agentSteps ?? [];
  const writer = steps.find((s) => s.id === "writer");
  const thinkingSteps = steps.filter((s) => s.id !== "writer");

  return (
    <div className="flex flex-col gap-3">
      {/* Chat bubble: Writer's output, or "Thinking…" before it starts */}
      {(writer?.content || writer?.streaming) ? (
        <div className="text-[#0d0c12] text-base leading-relaxed whitespace-pre-wrap font-normal">
          {writer.content}
          {writer.streaming && (
            <span className="inline-block w-0.5 h-4 bg-[#675c56] ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>
      ) : message.streaming ? (
        <span className="text-[#b0a9a4] text-sm animate-pulse">Thinking…</span>
      ) : null}

      {/* Collapsible thinking tabs */}
      {thinkingSteps.some((s) => s.content) && (
        <div className="border border-[#e8e4df] rounded-xl overflow-hidden bg-white">
          {thinkingSteps.map((step, idx) => (
            <ThinkingTab
              key={step.id}
              step={step}
              isLast={idx === thinkingSteps.length - 1}
              onToggle={() =>
                toggleAgentStepCollapsed(message.id, step.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingTab({
  step,
  isLast,
  onToggle,
}: {
  step: AgentStepOutput;
  isLast: boolean;
  onToggle: () => void;
}) {
  const isOpen = !step.collapsed;
  const hasContent = step.content.length > 0;

  return (
    <div className={!isLast ? "border-b border-[#e8e4df]" : ""}>
      {/* Tab header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#faf9f7] transition-colors text-left"
      >
        <ChevronDown
          size={12}
          className={`text-[#b0a9a4] transition-transform duration-150 ${
            isOpen ? "" : "-rotate-90"
          }`}
        />
        <Brain size={12} className="text-[#9e9590]" />
        <span className="text-xs text-[#675c56] font-semibold">
          {step.name}
        </span>
        {step.streaming && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#675c56] animate-pulse ml-auto" />
        )}
        {!step.streaming && hasContent && (
          <span className="text-[10px] text-[#b0a9a4] ml-auto">
            {isOpen ? "hide" : `${step.content.length} chars`}
          </span>
        )}
      </button>

      {/* Tab content */}
      {isOpen && (
        <div className="px-3 pb-3 pt-0 text-sm text-[#4a4440] leading-relaxed whitespace-pre-wrap font-normal">
          {hasContent ? step.content : "…"}
        </div>
      )}
    </div>
  );
}

function FusionBadge({
  panelModels,
  judgeModel,
}: {
  panelModels: string[];
  judgeModel: string;
}) {
  const label = (id: string) =>
    id === "openrouter/auto" ? "Auto" : id.split("/").pop() ?? id;

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#9e9590] font-normal flex-wrap">
      <span className="px-2 py-0.5 rounded-full bg-[#f2eeeb] border border-[#e8e4df] text-[#675c56]">
        Fusion
      </span>
      {panelModels.map((m, i) => (
        <span key={i}>
          {i > 0 && <span className="text-[#cdc7c1] mx-0.5">+</span>}
          <span>{label(m)}</span>
        </span>
      ))}
      <span className="text-[#cdc7c1] mx-0.5">&middot;</span>
      <span className="text-[#b0a9a4]">judge: {label(judgeModel)}</span>
    </div>
  );
}