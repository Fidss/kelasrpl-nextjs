"use client";

import { Users, Lightbulb, Code2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Values() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Users,
      titleKey: "home.collab_title",
      descKey: "home.collab_desc",
    },
    {
      icon: Lightbulb,
      titleKey: "home.creat_title",
      descKey: "home.creat_desc",
    },
    {
      icon: Code2,
      titleKey: "home.tech_title",
      descKey: "home.tech_desc",
    },
    {
      icon: TrendingUp,
      titleKey: "home.growth_title",
      descKey: "home.growth_desc",
    },
  ];

  return (
    <section id="values" className="py-24 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16 items-center">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6"
              data-i18n="home.values_title"
            >
              {t("home.values_title")}
            </h2>
            <p
              className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed"
              data-i18n="home.values_desc"
            >
              {t("home.values_desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:-translate-y-1 transition-transform duration-300 shadow-xs"
                >
                  <div className="w-12 h-12 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-500 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3
                    className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2"
                    data-i18n={v.titleKey}
                  >
                    {t(v.titleKey)}
                  </h3>
                  <p
                    className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed"
                    data-i18n={v.descKey}
                  >
                    {t(v.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
