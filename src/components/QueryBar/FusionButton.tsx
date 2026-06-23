"use client";

import { Zap } from "lucide-react";

interface FusionButtonProps {
  active?: boolean;
  onClick?: () => void;
}

export function FusionButton({ active = false, onClick }: FusionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5
        rounded-full text-sm
        transition-colors duration-150
        border
        ${
          active
            ? "bg-[#675c56] text-white border-[#675c56]"
            : "bg-[#f2eeeb] text-[#675c56] border-[#e8e4df] hover:bg-[#675c56] hover:text-white hover:border-[#675c56]"
        }
      `}
    >
      <Zap size={13} />
      <span>Fusion</span>
    </button>
  );
}
