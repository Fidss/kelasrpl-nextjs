"use client";

import { useLanguage } from "@/context/LanguageContext";

interface AboutStatsProps {
  totalStudents: number;
}

export default function AboutStats({ totalStudents }: AboutStatsProps) {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-24 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* About Text */}
          <div className="lg:col-span-8 bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-10 md:p-14 flex flex-col justify-center relative overflow-hidden border border-zinc-200/60 dark:border-zinc-800/60">
            <div className="absolute top-0 right-0 p-8 opacity-10 dark:opacity-5">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.56c-.59-.52-1.36-.87-2.4-.87-1.1 0-2 .9-2 2v.59c-2.43-.88-4.22-3.08-4.46-5.74.88-.16 1.7-.63 2.32-1.3L15 11h2c1.1 0 2-.9 2-2v-1.42c1.37 1.25 2.29 2.97 2.48 4.93-.16.14-.32.29-.48.42z" />
              </svg>
            </div>

            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6"
              data-i18n="home.about_title"
            >
              {t("home.about_title")}
            </h2>
            <p
              className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed"
              data-i18n="home.about_desc"
            >
              {t("home.about_desc")}
            </p>
          </div>

          {/* Statistics Group */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Stat 1 */}
            <div className="flex-1 bg-accent-600 rounded-3xl p-8 flex flex-col justify-between text-white shadow-lg shadow-accent-600/10">
              <span
                className="text-accent-100 font-medium text-sm tracking-wide uppercase"
                data-i18n="home.stat_population"
              >
                {t("home.stat_population")}
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-tighter">{totalStudents}</span>
                <span className="text-accent-200 font-medium" data-i18n="home.stat_students_unit">
                  {t("home.stat_students_unit")}
                </span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-zinc-100 dark:bg-zinc-800/80 rounded-3xl p-8 grid grid-cols-2 gap-4 border border-zinc-200/60 dark:border-zinc-700/50">
              <div>
                <span
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1"
                  data-i18n="home.stat_class"
                >
                  {t("home.stat_class")}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">10 RPL</span>
              </div>
              <div>
                <span
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1"
                  data-i18n="home.stat_year"
                >
                  {t("home.stat_year")}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">2026/2027</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                <span
                  className="block text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1"
                  data-i18n="home.stat_major"
                >
                  {t("home.stat_major")}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Rekayasa Perangkat Lunak</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
