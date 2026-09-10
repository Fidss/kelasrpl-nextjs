import Link from "next/link";
import { ArrowUp } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white py-16 md:py-24 border-t border-zinc-200 dark:border-zinc-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 text-zinc-900 dark:text-zinc-100">
              10 RPL <span className="text-zinc-400 dark:text-zinc-600">—</span><br />
              Learn. Build.<br />
              <span className="text-accent-500">Grow Together.</span>
            </h2>
          </div>

          <Link
            href="#about"
            className="group flex items-center justify-center w-24 h-24 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-accent-500 hover:bg-accent-500/10 transition-all duration-300"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-8 h-8 text-zinc-400 dark:text-zinc-500 group-hover:text-accent-500 group-hover:-translate-y-1 transition-all duration-300" />
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-zinc-200 dark:border-zinc-900 text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Kelas 10 Rekayasa Perangkat Lunak. SMK Negeri 17 Jakarta.</p>
          <p className="mt-2 sm:mt-0">Kode etik: Kerja keras, tidak mengeluh.</p>
        </div>
      </div>
    </footer>
  );
}
