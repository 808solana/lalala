"use client";

import { useRef, useCallback, useState, KeyboardEvent } from "react";
import { ArrowUp, Settings } from "lucide-react";
import { ModelPickerButton } from "./ModelPickerButton";
import { ModelPickerDropdown } from "./ModelPickerDropdown";
import { FusionButton } from "./FusionButton";
import { FusionPanel } from "./FusionPanel";
import { AgentButton } from "./AgentButton";
import { AgentBuilder } from "@/components/AgentBuilder";
import { useChatStore } from "@/store/chat";

interface QueryBarProps {
  onSubmit?: (value: string) => void;
}

export function QueryBar({ onSubmit }: QueryBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [agentBuilderOpen, setAgentBuilderOpen] = useState(false);
  const [builderKey, setBuilderKey] = useState(0);

  const {
    inputValue,
    setInputValue,
    selectedModel,
    setSelectedModel,
    models,
    fetchModels,
    isStreaming,
    mode,
    setMode,
    agentMode,
    fusionPanelModels,
    fusionJudgeModel,
    addFusionPanelModel,
    removeFusionPanelModel,
    updateFusionPanelModel,
    setFusionJudgeModel,
  } = useChatStore();

  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    resize();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || isStreaming) return;
    const val = inputValue.trim();
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSubmit?.(val);
  };

  const handleModelPickerOpen = () => {
    fetchModels();
    setModelPickerOpen(true);
  };

  const handleFusionClick = () => {
    const next = mode === "fusion" ? "simple" : "fusion";
    if (next === "fusion") {
      fetchModels();
      // Seed the first panel model if none exist yet
      if (fusionPanelModels.length === 0) {
        addFusionPanelModel();
      }
    }
    setMode(next);
  };

  const handleAgentClick = () => {
    setMode(mode === "agent" ? "simple" : "agent");
  };

  const modelDisplayName =
    selectedModel === "openrouter/auto"
      ? "Auto"
      : (models.find((m) => m.id === selectedModel)?.name ??
        selectedModel.split("/").pop() ??
        selectedModel);

  const canSubmit = inputValue.trim().length > 0 && !isStreaming;

  return (
    <div className="relative w-full max-w-2xl">
      {modelPickerOpen && (
        <ModelPickerDropdown
          models={models}
          selectedModel={selectedModel}
          onSelect={setSelectedModel}
          onClose={() => setModelPickerOpen(false)}
        />
      )}

      {agentBuilderOpen && (
        <AgentBuilder
          key={builderKey}
          open
          onClose={() => setAgentBuilderOpen(false)}
          models={models}
        />
      )}

      <div className="bg-white border border-[#e8e4df] rounded-2xl shadow-sm flex flex-col">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          disabled={isStreaming}
          aria-label="Message input"
          className="
            w-full bg-transparent text-[#0d0c12] placeholder-[#b0a9a4]
            text-base leading-relaxed font-normal
            px-5 pt-4 pb-2
            resize-none outline-none
            min-h-[56px] max-h-[320px]
            overflow-y-auto
            disabled:opacity-60
          "
        />

        {/* Fusion panel — inline, between textarea and button row */}
        {mode === "fusion" && (
          <FusionPanel
            models={models}
            panelModels={fusionPanelModels}
            judgeModel={fusionJudgeModel}
            onAddPanel={addFusionPanelModel}
            onRemovePanel={removeFusionPanelModel}
            onUpdatePanel={updateFusionPanelModel}
            onChangeJudge={setFusionJudgeModel}
          />
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-[#e8e4df]">
          <div className="flex items-center gap-2">
            <ModelPickerButton
              modelName={modelDisplayName}
              onClick={handleModelPickerOpen}
            />
            <FusionButton active={mode === "fusion"} onClick={handleFusionClick} />
            <AgentButton active={mode === "agent"} onClick={handleAgentClick} />
            {mode === "agent" && (
              <button
                type="button"
                onClick={() => {
                  fetchModels();
                  setBuilderKey((k) => k + 1);
                  setAgentBuilderOpen(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-150 border ${
                  agentMode === "custom"
                    ? "bg-[#675c56] text-white border-[#675c56]"
                    : "bg-[#f2eeeb] text-[#9e9590] border-[#e8e4df] hover:text-[#675c56] hover:border-[#675c56]"
                }`}
              >
                <Settings size={11} />
                <span>Customize</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-label="Send message"
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-150 shrink-0
              ${
                canSubmit
                  ? "bg-[#0d0c12] text-white hover:bg-[#2a2933]"
                  : "bg-[#f2eeeb] text-[#b0a9a4] cursor-not-allowed"
              }
            `}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
