"use client";

import { useState } from "react";
import { X, Plus, RotateCcw } from "lucide-react";
import { StepCard } from "./StepCard";
import { useChatStore } from "@/store/chat";
import type { AgentStepDefinition } from "@/types/chat";
import { DEFAULT_AGENT_CHAIN } from "@/lib/agentChain";
import type { Model } from "@/types/models";

interface AgentBuilderProps {
  open: boolean;
  onClose: () => void;
  models: Model[];
}

export function AgentBuilder({ open, onClose, models }: AgentBuilderProps) {
  const { agentMode, setAgentMode, customChain, setCustomChain } =
    useChatStore();

  // Local working copy so edits don't pollute store until save
  const [draftMode, setDraftMode] = useState(agentMode);
  const [draftChain, setDraftChain] = useState<AgentStepDefinition[]>(
    () => customChain.map((s) => ({ ...s }))
  );

  if (!open) return null;

  const isCustom = draftMode === "custom";

  const handleUpdateStep = (index: number, updated: AgentStepDefinition) => {
    setDraftChain((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const handleDeleteStep = (index: number) => {
    if (draftChain.length <= 2) return; // minimum 2 steps
    setDraftChain((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setDraftChain((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= draftChain.length - 1) return;
    setDraftChain((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleAddStep = () => {
    const id = crypto.randomUUID();
    const n = draftChain.length + 1;
    setDraftChain((prev) => [
      ...prev,
      { id, name: `Step ${n}`, prompt: "" },
    ]);
  };

  const handleReset = () => {
    setDraftChain(DEFAULT_AGENT_CHAIN.map((s) => ({ ...s })));
  };

  const handleSave = () => {
    // Commit draft to store
    setAgentMode(draftMode);
    if (draftMode === "custom") {
      setCustomChain(draftChain);
    }
    onClose();
  };

  const handleModeChange = (mode: typeof agentMode) => {
    setDraftMode(mode);
    if (mode === "fixed") {
      // When switching to fixed, we'll use the default chain on the server
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleSave}
      />

      {/* Modal panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#e8e4df] w-full max-w-lg max-h-[85vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e4df]">
          <h2 className="text-base font-semibold text-[#0d0c12]">
            Agent Chain
          </h2>
          <button
            type="button"
            onClick={handleSave}
            className="p-1.5 rounded-full hover:bg-[#f2eeeb] text-[#b0a9a4] hover:text-[#675c56] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 px-5 py-3 border-b border-[#e8e4df]">
          <button
            type="button"
            onClick={() => handleModeChange("fixed")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !isCustom
                ? "bg-[#675c56] text-white"
                : "bg-[#f2eeeb] text-[#675c56] hover:bg-[#e8e4df]"
            }`}
          >
            Fixed
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("custom")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isCustom
                ? "bg-[#675c56] text-white"
                : "bg-[#f2eeeb] text-[#675c56] hover:bg-[#e8e4df]"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Fixed mode: show default chain as read-only preview */}
        {!isCustom && (
          <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
            <p className="text-xs text-[#9e9590] mb-1">
              Default chain — Research → Analysis → Reasoning → Writer
            </p>
            {DEFAULT_AGENT_CHAIN.map((s, i) => (
              <div
                key={s.id}
                className="border border-[#e8e4df] rounded-lg bg-[#faf9f7] p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#9e9590] tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-[#675c56]">
                    {s.name}
                  </span>
                </div>
                <p className="text-xs text-[#9e9590] leading-relaxed">
                  {s.prompt.slice(0, 120)}
                  {s.prompt.length > 120 ? "…" : ""}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Custom mode: editable step cards */}
        {isCustom && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-3">
              {draftChain.map((step, i) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={i}
                  total={draftChain.length}
                  models={models}
                  onChange={(updated) => handleUpdateStep(i, updated)}
                  onDelete={() => handleDeleteStep(i)}
                  onMoveUp={() => handleMoveUp(i)}
                  onMoveDown={() => handleMoveDown(i)}
                />
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e8e4df]">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[#675c56] bg-[#f2eeeb] hover:bg-[#e8e4df] transition-colors font-medium"
                >
                  <Plus size={14} />
                  Add step
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[#9e9590] hover:text-[#675c56] hover:bg-[#f2eeeb] transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-[#675c56] text-white hover:bg-[#5a524c] transition-colors"
              >
                Save chain
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}