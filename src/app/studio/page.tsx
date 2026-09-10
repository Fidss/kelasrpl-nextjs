"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PhotoboothMode from "@/components/studio/PhotoboothMode";
import TikTokVideoMode from "@/components/studio/TikTokVideoMode";
import { Camera, Film, Sparkles } from "lucide-react";

export default function StudioPage() {
  const [activeMode, setActiveMode] = useState<"photobooth" | "tiktok">("photobooth");

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header & Mode Switcher */}
          <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-accent-500" />
              <span>Studio Kreatif 10 RPL</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Photobooth & Video Creator
            </h1>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Ambil foto strip ala Korean Photobooth dengan berbagai template dan stiker, atau rekam video pendek 9:16 ala TikTok lengkap dengan lagu favoritmu!
            </p>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1.5 rounded-2xl bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/80 dark:border-zinc-800 shadow-inner mt-2">
              <button
                type="button"
                onClick={() => setActiveMode("photobooth")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeMode === "photobooth"
                    ? "bg-white dark:bg-zinc-800 text-accent-600 dark:text-accent-400 shadow-md scale-102"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Camera className="w-4 h-4 text-accent-500" />
                <span>📸 Photobooth (Foto Strip)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("tiktok")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeMode === "tiktok"
                    ? "bg-white dark:bg-zinc-800 text-rose-500 dark:text-rose-400 shadow-md scale-102"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Film className="w-4 h-4 text-rose-500" />
                <span>🎬 TikTok Video Studio</span>
              </button>
            </div>
          </div>

          {/* Active Mode Render */}
          <div className="pt-2">
            {activeMode === "photobooth" ? (
              <PhotoboothMode />
            ) : (
              <TikTokVideoMode />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
