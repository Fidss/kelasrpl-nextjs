"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SupportedLang } from "@/lib/i18n";

export default function LanguageSelector({ className = "" }: { className?: string }) {
  const { lang, setLanguage } = useLanguage();

  const handleSelect = (selected: SupportedLang) => {
    setLanguage(selected);
  };

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold tracking-wider select-none shrink-0 ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSelect("id")}
        data-lang-btn="id"
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          lang === "id"
            ? "bg-white dark:bg-zinc-900 text-accent-600 dark:text-accent-400 shadow-xs font-bold"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
        }`}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => handleSelect("en")}
        data-lang-btn="en"
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          lang === "en"
            ? "bg-white dark:bg-zinc-900 text-accent-600 dark:text-accent-400 shadow-xs font-bold"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
        }`}
        title="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => handleSelect("jp")}
        data-lang-btn="jp"
        className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
          lang === "jp"
            ? "bg-white dark:bg-zinc-900 text-accent-600 dark:text-accent-400 shadow-xs font-bold"
            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium"
        }`}
        title="日本語 (Japanese)"
      >
        JP
      </button>
    </div>
  );
}
