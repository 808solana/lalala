"use client";

import type { AgentStepDefinition } from "@/types/chat";
import type { Model } from "@/types/models";
import { Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface StepCardProps {
  step: AgentStepDefinition;
  index: number;
  total: number;
  models: Model[];
  onChange: (updated: AgentStepDefinition) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function StepCard({
  step,
  index,
  total,
  models,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: StepCardProps) {
  return (
    <div className="border border-[#e8e4df] rounded-xl bg-[#faf9f7] p-3 flex flex-col gap-2.5">
      {/* Header: drag handle, step name, position arrows, delete */}
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="text-[#b0a9a4] shrink-0" />
        <span className="text-xs font-semibold text-[#9e9590] tabular-nums">
          {index + 1}
        </span>
        <input
          type="text"
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
          placeholder="Step name"
          className="flex-1 bg-white border border-[#e8e4df] rounded-lg px-2.5 py-1 text-sm text-[#0d0c12] placeholder-[#b0a9a4] outline-none focus:border-[#675c56] transition-colors"
        />
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 rounded text-[#b0a9a4] hover:text-[#675c56] hover:bg-[#f2eeeb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 rounded text-[#b0a9a4] hover:text-[#675c56] hover:bg-[#f2eeeb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded text-[#b0a9a4] hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Role prompt */}
      <textarea
        value={step.prompt}
        onChange={(e) => onChange({ ...step, prompt: e.target.value })}
        placeholder="System prompt for this step (e.g. 'You are the Research agent...')"
        rows={3}
        className="w-full bg-white border border-[#e8e4df] rounded-lg px-3 py-2 text-sm text-[#0d0c12] placeholder-[#b0a9a4] outline-none focus:border-[#675c56] transition-colors resize-y min-h-[60px]"
      />

      {/* Model override */}
      <select
        value={step.modelOverride ?? ""}
        onChange={(e) =>
          onChange({
            ...step,
            modelOverride: e.target.value || undefined,
          })
        }
        className="w-full bg-white border border-[#e8e4df] rounded-lg px-2.5 py-1.5 text-sm text-[#0d0c12] outline-none focus:border-[#675c56] transition-colors cursor-pointer"
      >
        <option value="">Use selected model</option>
        {models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}