"use client";

import { useState } from "react";
import { Student } from "@/data/students";
import { GraduationCap, Search, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface MemberGridProps {
  students: Student[];
}

export default function MemberGrid({ students }: MemberGridProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState<"ALL" | "L" | "P">("ALL");

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search);
    const matchGender = filterGender === "ALL" || s.gender === filterGender;
    return matchSearch && matchGender;
  });

  return (
    <section id="members" className="py-24 bg-zinc-50 dark:bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4"
            data-i18n="home.family_title"
          >
            {t("home.family_title")}
          </h2>
          <p
            className="text-lg text-zinc-600 dark:text-zinc-400"
            data-i18n="home.family_desc"
          >
            {t("home.family_desc")}
          </p>
        </div>

        {/* Special Teacher Card */}
        <div className="max-w-3xl mx-auto mb-14">
          <div className="relative group p-1 rounded-3xl bg-gradient-to-br from-accent-500 via-accent-300 to-zinc-900 dark:from-accent-600 dark:via-accent-800 dark:to-zinc-900 shadow-xl overflow-hidden transition-transform duration-500 hover:scale-[1.01]">
            <div className="relative bg-zinc-50 dark:bg-zinc-950 rounded-[1.4rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-zinc-200 dark:bg-zinc-900 flex items-center justify-center border-4 border-white dark:border-zinc-950 shadow-inner flex-shrink-0 z-10 relative">
                <User className="w-12 h-12 text-zinc-400 dark:text-zinc-600" />
                <div
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-white border-2 border-white dark:border-zinc-950"
                  title="Wali Kelas"
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center sm:text-left">
                <div
                  className="inline-block px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 text-xs font-bold tracking-wider uppercase mb-2"
                  data-i18n="home.homeroom_teacher"
                >
                  {t("home.homeroom_teacher")}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
                  Syaiful Bachri, S.T.
                </h3>
                <p
                  className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm sm:text-base"
                  data-i18n="home.teacher_desc"
                >
                  {t("home.teacher_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="max-w-xl mx-auto mb-10 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-accent-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>
          <div className="flex gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 self-center">
            {(["ALL", "L", "P"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFilterGender(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterGender === g
                    ? "bg-accent-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {g === "ALL" ? "Semua" : g === "L" ? "Laki-laki" : "Perempuan"}
              </button>
            ))}
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.nis}
              className="group flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-accent-500/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-sm shrink-0 border border-zinc-200/60 dark:border-zinc-700/60">
                {student.name.charAt(0)}
              </div>
              <div className="flex flex-col overflow-hidden">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-accent-600 dark:group-hover:text-accent-500 transition-colors text-sm sm:text-base">
                  {student.name
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-zinc-500">{student.nis}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                  <span className="text-xs text-zinc-500">
                    {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
