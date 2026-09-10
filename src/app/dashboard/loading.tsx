import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Navbar Skeleton Placeholder */}
      <div className="fixed top-0 w-full h-16 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-30 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-600/30 animate-pulse" />
          <div className="w-16 h-5 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-16 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div className="w-8 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
        {/* Top Loading Indicator Badge */}
        <div className="flex items-center justify-center gap-2.5 py-2 px-4 rounded-full bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 border border-accent-200/80 dark:border-accent-900/50 w-fit mx-auto shadow-xs">
          <Loader2 className="w-4 h-4 animate-spin text-accent-600 dark:text-accent-400" />
          <span className="text-xs font-bold">Memuat Dashboard Kelas RPL...</span>
        </div>

        {/* Welcome Card Skeleton */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 w-full max-w-md">
            <div className="w-28 h-6 rounded-full bg-emerald-100/60 dark:bg-emerald-950/40 animate-pulse" />
            <div className="w-64 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-48 h-4 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>
          <div className="w-44 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 animate-pulse shrink-0" />
        </div>

        {/* Feature Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-24 h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-36 h-3 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid / Tables Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="w-36 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse mx-auto mt-6" />
            <div className="w-32 h-5 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse mx-auto" />
            <div className="w-48 h-4 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse mx-auto" />
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-center">
              <div className="w-40 h-6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="w-24 h-4 rounded bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((row) => (
                <div
                  key={row}
                  className="h-10 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/50 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
