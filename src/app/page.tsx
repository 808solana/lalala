"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { QueryBar } from "@/components/QueryBar";
import { ChatArea } from "@/components/ChatArea";
import { Sidebar } from "@/components/Sidebar";
import { useChatStore } from "@/store/chat";
import { streamChat } from "@/lib/streamChat";
import { streamFusion } from "@/lib/streamFusion";
import { streamAgent } from "@/lib/streamAgent";
import type { OpenRouterMessage } from "@/types/chat";

export default function Home() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    addMessage,
    appendToMessage,
    setMessageStreaming,
    setMessageError,
    setAgentSteps,
    appendToAgentStep,
    setAgentStepStreaming,
    setAgentStepCollapsed,
    selectedModel,
    isStreaming,
    setIsStreaming,
    activeConversationId,
    startNewConversation,
    persistActiveConversation,
    loadFromStorage,
    projects,
    activeProjectId,
    mode,
    fusionPanelModels,
    fusionJudgeModel,
    agentMode,
    customChain,
  } = useChatStore();

  // Bootstrap from localStorage on first render
  useEffect(() => {
    loadFromStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMessages = messages.length > 0;

  const handleSubmit = async (input: string) => {
    if (isStreaming) return;

    // Ensure there's an active conversation to save into
    if (!activeConversationId) {
      startNewConversation();
    }

    addMessage({ role: "user", content: input });

    const assistantId = addMessage({
      role: "assistant",
      content: "",
      streaming: true,
      mode,
      ...(mode === "fusion"
        ? { fusionPanelModels, fusionJudgeModel }
        : {}),
      ...(mode === "agent" ? { agentSteps: [] } : {}),
    });

    setIsStreaming(true);

    // Build message history with optional project system prompt
    const activeProject = activeProjectId
      ? projects.find((p) => p.id === activeProjectId)
      : null;

    const systemMessages: OpenRouterMessage[] =
      activeProject?.systemPrompt
        ? [{ role: "system", content: activeProject.systemPrompt }]
        : [];

    const history: OpenRouterMessage[] = [
      ...systemMessages,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: input },
    ];

    const onDone = () => {
      setMessageStreaming(assistantId, false);
      setIsStreaming(false);
      persistActiveConversation();
    };

    const onError = (err: string) => {
      appendToMessage(assistantId, `Something went wrong: ${err}`);
      setMessageStreaming(assistantId, false);
      setMessageError(assistantId, true);
      setIsStreaming(false);
    };

    if (mode === "fusion") {
      await streamFusion({
        messages: history,
        panelModels: fusionPanelModels,
        judgeModel: fusionJudgeModel,
        onChunk: (text) => appendToMessage(assistantId, text),
        onDone,
        onError,
      });
    } else if (mode === "agent") {
      await streamAgent({
        messages: history,
        model: selectedModel,
        chain: agentMode === "custom" ? customChain : undefined,
        onStepsInit: (steps) => setAgentSteps(assistantId, steps),
        onChunk: (stepId, text) =>
          appendToAgentStep(assistantId, stepId, text),
        onStepStreamingChange: (stepId, streaming) =>
          setAgentStepStreaming(assistantId, stepId, streaming),
        onSetCollapsed: (stepId, collapsed) =>
          setAgentStepCollapsed(assistantId, stepId, collapsed),
        onDone,
        onError,
      });
    } else {
      await streamChat({
        messages: history,
        model: selectedModel,
        onChunk: (text) => appendToMessage(assistantId, text),
        onDone,
        onError,
      });
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {!hasMessages ? (
          <main className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="w-full flex flex-col items-center gap-8">
              <Image
                src="/logo.png"
                alt="Love AI"
                width={72}
                height={72}
                priority
                className="select-none"
              />
              <QueryBar onSubmit={handleSubmit} />
            </div>
          </main>
        ) : (
          <>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-6">
              <ChatArea messages={messages} scrollContainerRef={scrollContainerRef} />
            </div>
            <div className="border-t border-[#e8e4df] px-4 py-4 flex justify-center bg-white">
              <QueryBar onSubmit={handleSubmit} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
