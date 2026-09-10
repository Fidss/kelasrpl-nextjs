"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent-50 via-white to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono uppercase tracking-wider mb-8 text-zinc-600 dark:text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
              <span data-i18n="home.badge">{t("home.badge")}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] mb-6 text-zinc-950 dark:text-zinc-50">
              <span data-i18n="home.hero_title">{t("home.hero_title")}</span> <br />
              <span className="text-accent-600 dark:text-accent-500">10 RPL.</span>
            </h1>

            <p
              className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg mb-8 leading-relaxed"
              data-i18n="home.hero_subtitle"
            >
              {t("home.hero_subtitle")}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="#members"
                className="px-6 py-3 rounded-full bg-accent-600 hover:bg-accent-700 text-white font-medium transition-colors shadow-lg shadow-accent-600/20"
                data-i18n="home.btn_members"
              >
                {t("home.btn_members")}
              </Link>
              <Link
                href="#about"
                className="px-6 py-3 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition-colors"
                data-i18n="home.btn_about"
              >
                {t("home.btn_about")}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:block">
            <div className="relative w-full aspect-square rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col justify-between shadow-xl">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>

              <div className="space-y-4 font-mono text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex gap-3">
                  <span className="text-accent-500">import</span>
                  <span>&#123; skills &#125;</span>
                  <span className="text-accent-500">from</span>
                  <span className="text-emerald-500">&apos;./future&apos;</span>;
                </div>
                <div className="flex gap-3">
                  <span className="text-accent-500">const</span>
                  <span className="text-purple-400">kelas</span> =
                  <span className="text-emerald-500">&apos;10_RPL&apos;</span>;
                </div>
                <div className="flex gap-3">
                  <span className="text-accent-500">await</span>
                  <span>kelas.build();</span>
                </div>
              </div>

              <div className="mt-auto flex items-end justify-end">
                <div className="text-8xl font-bold text-zinc-200 dark:text-zinc-800 tracking-tighter select-none font-mono">
                  &lt;/&gt;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
