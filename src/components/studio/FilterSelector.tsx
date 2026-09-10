"use client";

import React from "react";
import { STUDIO_FILTERS, StudioFilter } from "@/lib/studio-filters";

interface FilterSelectorProps {
  activeFilterId: string;
  onSelectFilter: (filter: StudioFilter) => void;
  className?: string;
}

export default function FilterSelector({
  activeFilterId,
  onSelectFilter,
  className = "",
}: FilterSelectorProps) {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-2 ${className}`}>
      <div className="flex items-center gap-2.5 px-2 min-w-max">
        {STUDIO_FILTERS.map((filter) => {
          const isActive = filter.id === activeFilterId;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onSelectFilter(filter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-accent-600 text-white shadow-md shadow-accent-600/30 scale-105"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
              }`}
            >
              <span className="text-sm">{filter.badge}</span>
              <span>{filter.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
