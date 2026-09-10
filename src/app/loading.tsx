import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-600 flex items-center justify-center text-white font-extrabold text-xl shadow-xl shadow-accent-600/30 animate-pulse">
            10
          </div>
          <div className="absolute -inset-2 border-2 border-dashed border-accent-500 rounded-3xl animate-spin" />
        </div>
        <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 font-bold text-sm tracking-tight mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-accent-600 dark:text-accent-400" />
          <span>Memuat Halaman...</span>
        </div>
      </div>
    </div>
  );
}
