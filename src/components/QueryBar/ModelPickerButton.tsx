"use client";

import { Sparkles, ChevronDown } from "lucide-react";

interface ModelPickerButtonProps {
  modelName?: string;
  onClick?: () => void;
}

export function ModelPickerButton({
  modelName = "Auto",
  onClick,
}: ModelPickerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-sm
        bg-[#f2eeeb] text-[#675c56]
        hover:bg-[#675c56] hover:text-white
        transition-colors duration-150
        border border-[#e8e4df]
      "
    >
      <Sparkles size={13} />
      <span className="max-w-[120px] truncate">{modelName}</span>
      <ChevronDown size={13} className="shrink-0 opacity-60" />
    </button>
  );
}
