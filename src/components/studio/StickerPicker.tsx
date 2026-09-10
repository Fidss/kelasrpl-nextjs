"use client";

import React from "react";
import { STUDIO_STICKERS, StudioSticker } from "@/lib/studio-presets";
import { Sparkles, X } from "lucide-react";

export interface PlacedSticker {
  uid: string;
  sticker: StudioSticker;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  scale: number;
}

interface StickerPickerProps {
  placedStickers: PlacedSticker[];
  onAddSticker: (sticker: StudioSticker) => void;
  onRemoveSticker: (uid: string) => void;
  onClearStickers: () => void;
}

export default function StickerPicker({
  placedStickers,
  onAddSticker,
  onRemoveSticker,
  onClearStickers,
}: StickerPickerProps) {
  return (
    <div className="space-y-3 bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Stiker & Badge 10 RPL</span>
        </div>
        {placedStickers.length > 0 && (
          <button
            type="button"
            onClick={onClearStickers}
            className="text-[11px] text-red-500 hover:text-red-600 dark:text-red-400 font-medium transition cursor-pointer"
          >
            Hapus Semua ({placedStickers.length})
          </button>
        )}
      </div>

      {/* Badges RPL */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Badge Kelas & Coding
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STUDIO_STICKERS.filter((s) => s.type === "rpl").map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => onAddSticker(sticker)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              {sticker.content}
            </button>
          ))}
        </div>
      </div>

      {/* Emojis & Sparkles */}
      <div>
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
          Emoji & Ikon
        </div>
        <div className="flex flex-wrap gap-2 text-lg">
          {STUDIO_STICKERS.filter((s) => s.type === "emoji").map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              onClick={() => onAddSticker(sticker)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 hover:scale-110 active:scale-95 transition cursor-pointer shadow-xs"
              title={sticker.name}
            >
              {sticker.content}
            </button>
          ))}
        </div>
      </div>

      {/* Placed Stickers List */}
      {placedStickers.length > 0 && (
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            Stiker yang terpasang (klik untuk hapus):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {placedStickers.map((item) => (
              <button
                key={item.uid}
                type="button"
                onClick={() => onRemoveSticker(item.uid)}
                className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition cursor-pointer"
              >
                <span>{item.sticker.content}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
