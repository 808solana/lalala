"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Check } from "lucide-react";
import type { Model } from "@/types/models";

interface ModelPickerDropdownProps {
  models: Model[];
  selectedModel: string;
  onSelect: (modelId: string) => void;
  onClose: () => void;
}

export function ModelPickerDropdown({
  models,
  selectedModel,
  onSelect,
  onClose,
}: ModelPickerDropdownProps) {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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

  return (
    <div
      ref={ref}
      className="
        absolute bottom-full left-0 mb-2
        w-full max-w-sm
        bg-white border border-[#e8e4df]
        rounded-xl shadow-lg shadow-black/10
        overflow-hidden z-50
      "
    >
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#e8e4df]">
        <Search size={14} className="text-[#9e9590] shrink-0" />
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search models..."
          className="
            flex-1 bg-transparent text-sm text-[#0d0c12]
            placeholder-[#b0a9a4] outline-none font-normal
          "
        />
      </div>

      {/* Model list */}
      <div className="overflow-y-auto max-h-64 py-1">
        {display.length === 0 && (
          <p className="px-4 py-3 text-sm text-[#9e9590]">No models found</p>
        )}
        {display.map((model) => {
          const isSelected = model.id === selectedModel;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onSelect(model.id);
                onClose();
              }}
              className={`
                w-full flex items-center justify-between gap-3
                px-4 py-2.5 text-left
                transition-colors duration-100
                ${
                  isSelected
                    ? "bg-[#f2eeeb] text-[#0d0c12]"
                    : "text-[#0d0c12] hover:bg-[#f9f7f5]"
                }
              `}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm truncate">{model.name}</span>
                {model.id !== "openrouter/auto" && (
                  <span className="text-xs text-[#9e9590] font-normal truncate">{model.id}</span>
                )}
              </div>
              {isSelected && (
                <Check size={14} className="text-[#675c56] shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
