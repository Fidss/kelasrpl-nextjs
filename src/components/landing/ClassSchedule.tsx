"use client";

import { useState, useEffect, useMemo } from "react";
import { lessonsData, allActivitiesData, piketData, ScheduleItem } from "@/data/schedule";
import {
  Calendar,
  Clock,
  BookOpen,
  Code2,
  Flag,
  Coffee,
  Check,
  AlertCircle,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function toMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function getJakartaNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakartaDate = new Date(utc + 3600000 * 7);
  const day = jakartaDate.getDay();
  const hours = jakartaDate.getHours();
  const mins = jakartaDate.getMinutes();
  return {
    day,
    minutes: hours * 60 + mins,
    hours,
    mins,
  };
}

export default function ClassSchedule() {
  const { t } = useLanguage();

  const DAYS = [
    { num: 1, key: "sched.day_mon", defaultLabel: "Senin" },
    { num: 2, key: "sched.day_tue", defaultLabel: "Selasa" },
    { num: 3, key: "sched.day_wed", defaultLabel: "Rabu" },
    { num: 4, key: "sched.day_thu", defaultLabel: "Kamis" },
    { num: 5, key: "sched.day_fri", defaultLabel: "Jumat" },
  ];
  const [mode, setMode] = useState<"lessons" | "activities" | "piket">("lessons");
  const [activeDay, setActiveDay] = useState<number>(4);
  const [jakartaTime, setJakartaTime] = useState({
    day: 4,
    minutes: 0,
    hours: 0,
    mins: 0,
  });
  const [isClient, setIsClient] = useState(false);

  // Sync Jakarta time & active day on mount
  useEffect(() => {
    setIsClient(true);
    const initialTime = getJakartaNow();
    setJakartaTime(initialTime);

    // Default to today (if Monday-Friday) or Monday (if weekend)
    if (initialTime.day === 0 || initialTime.day === 6) {
      setActiveDay(1);
    } else {
      setActiveDay(initialTime.day);
    }

    // Refresh time every 10 seconds for real-time "Sedang Berlangsung" transitions
    const interval = setInterval(() => {
      setJakartaTime(getJakartaNow());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const isWeekend = jakartaTime.day === 0 || jakartaTime.day === 6;

  const currentDataset: ScheduleItem[] = useMemo(() => {
    const dataset = mode === "lessons" ? lessonsData : allActivitiesData;
    return dataset[activeDay] || [];
  }, [mode, activeDay]);

  const currentPiketList: string[] = useMemo(() => {
    return piketData[activeDay] || [];
  }, [activeDay]);

  const renderCategoryIcon = (category: ScheduleItem["category"]) => {
    switch (category) {
      case "vocational":
        return <Code2 className="w-4 h-4" />;
      case "character":
        return <Flag className="w-4 h-4" />;
      case "break":
        return <Coffee className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCategoryPillStyle = (category: ScheduleItem["category"]) => {
    switch (category) {
      case "vocational":
        return "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60";
      case "character":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60";
      case "break":
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700";
      default:
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60";
    }
  };

  return (
    <section
      id="schedule"
      className="py-16 sm:py-24 bg-zinc-50/70 dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-900 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-zinc-900 shadow-sm sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 transition-colors">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2
                  className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100"
                  data-i18n="sched.title"
                >
                  {t("sched.title")}
                </h2>
                <p
                  className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5"
                  data-i18n="sched.subtitle"
                >
                  {t("sched.subtitle")}
                </p>
              </div>
            </div>

            {/* Mode Toggle: [ Jadwal Pelajaran | Daftar Kegiatan | Jadwal Piket ] */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("lessons")}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                    mode === "lessons"
                      ? "shadow-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                  }`}
                  data-i18n="sched.mode_lessons"
                >
                  {t("sched.mode_lessons")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("activities")}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                    mode === "activities"
                      ? "shadow-xs bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                  }`}
                  data-i18n="sched.mode_activities"
                >
                  {t("sched.mode_activities")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("piket")}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                    mode === "piket"
                      ? "shadow-xs bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 font-extrabold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                  }`}
                  data-i18n="sched.mode_piket"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t("sched.mode_piket")}</span>
                </button>
              </div>

              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span data-i18n="sched.badge">{t("sched.badge")}</span>
              </span>
            </div>
          </div>

          {/* Weekend Alert Notice */}
          {isWeekend && (
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span data-i18n="sched.weekend_notice">
                {t("sched.weekend_notice")}
              </span>
            </div>
          )}

          {/* Day Navigation Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {DAYS.map((d) => {
              const isSelected = activeDay === d.num;
              const isToday = isClient && jakartaTime.day === d.num;

              return (
                <button
                  key={d.num}
                  type="button"
                  onClick={() => setActiveDay(d.num)}
                  className={`schedule-tab-btn flex-1 min-w-[90px] sm:min-w-[100px] py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm transition-all duration-200 flex flex-col items-center justify-center gap-0.5 border cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-sm font-bold"
                      : "bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold"
                  }`}
                >
                  <span data-i18n={d.key}>{t(d.key)}</span>
                  {isToday && (
                    <span
                      className={`today-indicator text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                      }`}
                      data-i18n="sched.today_badge"
                    >
                      {t("sched.today_badge")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Piket Schedule View */}
          {mode === "piket" ? (
            <div className="mt-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{t("sched.piket_title")}</span>
                      {isClient && activeDay === jakartaTime.day && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-600 text-white">
                          {t("sched.piket_today_active")}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {t("sched.piket_desc")} &bull; {DAYS.find((d) => d.num === activeDay)?.defaultLabel}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 self-start sm:self-auto">
                  {currentPiketList.length} Petugas Piket
                </div>
              </div>

              {/* Grid of Piket Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentPiketList.map((name, idx) => {
                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-zinc-800/80 transition-all duration-200 flex items-center gap-3.5 shadow-xs group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800/40 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3 h-3 text-emerald-500" />
                          <span>Regu Piket {DAYS.find((d) => d.num === activeDay)?.defaultLabel}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Schedule Cards Container */
            <div className="mt-6 space-y-2.5">
              {currentDataset.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  Tidak ada jadwal tercatat untuk hari ini.
                </div>
              ) : (
                currentDataset.map((item, idx) => {
                  const isToday = isClient && activeDay === jakartaTime.day;
                  const startMin = toMinutes(item.start);
                  const endMin = toMinutes(item.end);
                  const isActive =
                    isToday &&
                    jakartaTime.minutes >= startMin &&
                    jakartaTime.minutes < endMin;
                  const isDone = isToday && jakartaTime.minutes >= endMin;

                  let cardClasses =
                    "bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs";

                  if (isActive) {
                    cardClasses =
                      "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/80 dark:border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-md";
                  } else if (isDone) {
                    cardClasses =
                      "bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/50 opacity-70 hover:opacity-100";
                  }

                  return (
                    <div
                      key={`${item.subject}-${idx}`}
                      className={`rounded-xl sm:rounded-2xl border px-4 py-3 sm:px-5 sm:py-3.5 transition-all duration-200 ${cardClasses}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* Category Icon */}
                          <div
                            className={`p-2 rounded-lg shrink-0 ${getCategoryPillStyle(
                              item.category
                            )}`}
                          >
                            {renderCategoryIcon(item.category)}
                          </div>

                          {/* Subject & Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60">
                                {item.timeDisplay} WIB
                              </span>
                              {item.period && (
                                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded">
                                  {item.period}
                                </span>
                              )}
                              {item.interrupted && (
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 px-2 py-0.5 rounded">
                                  {item.interrupted}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {item.subject}
                              </h3>
                              {item.teacher && (
                                <span className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-medium">
                                  <span className="text-zinc-400 dark:text-zinc-500">
                                    &bull;
                                  </span>
                                  {item.teacher}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="shrink-0 self-start sm:self-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                              <span>Sedang Berlangsung</span>
                            </span>
                          ) : isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Selesai</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

