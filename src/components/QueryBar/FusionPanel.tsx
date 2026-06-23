"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Check, ChevronDown, Plus, X } from "lucide-react";
import type { Model } from "@/types/models";

const MAX_PANEL_MODELS = 4;

interface FusionModelPickerProps {
  label: string;
  models: Model[];
  selected: string;
  onSelect: (id: string) => void;
  onRemove?: () => void;
}

function FusionModelPicker({
  label,
  models,
  selected,
  onSelect,
  onRemove,
}: FusionModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const filtered = query.trim()
    ? models.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.id.toLowerCase().includes(query.toLowerCase())
      )
    : models;

  const auto = filtered.find((m) => m.id === "openrouter/auto");
  const rest = filtered.filter((m) => m.id !== "openrouter/auto");
  const display = auto ? [auto, ...rest] : rest;

  const selectedName =
    selected === "openrouter/auto"
      ? "Auto"
      : (models.find((m) => m.id === selected)?.name ??
        selected.split("/").pop() ??
        selected);

  return (
    <div ref={ref} className="relative flex-1 min-w-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="
            flex-1 flex items-center justify-between gap-2 px-3 py-2
            rounded-lg border border-[#e8e4df] bg-[#f9f7f5]
            text-sm text-[#0d0c12] hover:bg-[#f2eeeb]
            transition-colors duration-150 min-w-0
          "
        >
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] text-[#9e9590] uppercase tracking-wider mb-0.5">
              {label}
            </span>
            <span className="truncate max-w-[120px] font-normal text-sm">
              {selectedName}
            </span>
          </div>
          <ChevronDown size={13} className="text-[#9e9590] shrink-0" />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-[#b0a9a4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
            aria-label="Remove model"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute bottom-full left-0 mb-1.5 w-64 bg-white border border-[#e8e4df] rounded-xl shadow-lg shadow-black/10 overflow-hidden z-50">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#e8e4df]">
            <Search size={13} className="text-[#9e9590] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models..."
              className="flex-1 bg-transparent text-sm text-[#0d0c12] placeholder-[#b0a9a4] outline-none font-normal"
            />
          </div>
          <div className="overflow-y-auto max-h-56 py-1">
            {display.length === 0 && (
              <p className="px-4 py-3 text-sm text-[#9e9590]">No models found</p>
            )}
            {display.map((model) => {
              const isSelected = model.id === selected;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelect(model.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`
                    w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left
                    transition-colors duration-100
                    ${isSelected ? "bg-[#f2eeeb] text-[#0d0c12]" : "text-[#0d0c12] hover:bg-[#f9f7f5]"}
                  `}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm truncate">{model.name}</span>
                    {model.id !== "openrouter/auto" && (
                      <span className="text-xs text-[#9e9590] font-normal truncate">{model.id}</span>
                    )}
                  </div>
                  {isSelected && <Check size={13} className="text-[#675c56] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FusionPanelProps {
  models: Model[];
  panelModels: string[];
  judgeModel: string;
  onAddPanel: () => void;
  onRemovePanel: (index: number) => void;
  onUpdatePanel: (index: number, modelId: string) => void;
  onChangeJudge: (modelId: string) => void;
}

export function FusionPanel({
  models,
  panelModels,
  judgeModel,
  onAddPanel,
  onRemovePanel,
  onUpdatePanel,
  onChangeJudge,
}: FusionPanelProps) {
  const labels = ["Panel A", "Panel B", "Panel C", "Panel D"];
  const canAddMore = panelModels.length < MAX_PANEL_MODELS;

  return (
    <div className="px-4 pt-3 pb-1 border-b border-[#e8e4df]">
      {/* Section header */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          {/* Panel model pickers */}
          {panelModels.map((modelId, i) => (
            <FusionModelPicker
              key={i}
              label={labels[i] ?? `Panel ${i + 1}`}
              models={models}
              selected={modelId}
              onSelect={(id) => onUpdatePanel(i, id)}
              onRemove={panelModels.length > 1 ? () => onRemovePanel(i) : undefined}
            />
          ))}

          {/* Add model button */}
          {canAddMore && (
            <button
              type="button"
              onClick={onAddPanel}
              className="
                w-full flex items-center justify-center gap-1.5
                px-3 py-2 rounded-lg border border-dashed border-[#cdc7c1]
                text-sm text-[#9e9590] hover:bg-[#f9f7f5] hover:text-[#675c56]
                transition-colors duration-150
              "
            >
              <Plus size={13} />
              <span className="font-normal">Add model</span>
            </button>
          )}
        </div>
      </div>

      {/* Fuse with section */}
      <div className="mt-3 flex items-center gap-3 border-t border-[#e8e4df] pt-3">
        <span className="text-xs text-[#9e9590] uppercase tracking-wider font-normal shrink-0">
          Fuse with
        </span>
        <FusionModelPicker
          label="Synthesizer"
          models={models}
          selected={judgeModel}
          onSelect={onChangeJudge}
        />
      </div>
    </div>
  );
}