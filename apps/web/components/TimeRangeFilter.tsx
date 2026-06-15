"use client";

import { cn } from "@/lib/utils";
import type { TimeRange } from "@/lib/types";
import { TIME_RANGE_OPTIONS } from "@/lib/types";

interface TimeRangeFilterProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeFilter({ value, onChange }: TimeRangeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIME_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
            value === option.value
              ? "border-violet-500/50 bg-violet-500/20 text-violet-200"
              : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
