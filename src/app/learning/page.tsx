import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { BookOpen, Video, FileText, ExternalLink } from "lucide-react";

export default async function LearningPage() {
  const user = await getCurrentUser();

  let materials: any[] = [];
  try {
    materials = await sql`
      SELECT id, title, type, content, url, created_at
      FROM learning_materials
      ORDER BY created_at DESC
    `;
  } catch (error) {
    // If table doesn't exist yet or is empty
    materials = [];
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={user} />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Materi Programming
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2 text-sm sm:text-base">
            Pelajari materi programming terbaru untuk meningkatkan skill Anda.
          </p>
        </div>

        {materials.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-xs">
            <BookOpen className="mx-auto h-12 w-12 text-zinc-400 mb-4 stroke-1" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Belum Ada Materi
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Materi programming akan segera diunggah oleh guru/admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {m.type === "video" ? (
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                        <Video className="w-5 h-5" />
                      </div>
                    ) : m.type === "article" ? (
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    )}
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {m.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-accent-600 transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                    {m.content || "Tidak ada deskripsi."}
                  </p>
                </div>

                {m.url && (
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-accent-600 hover:text-accent-500 gap-1 mt-2"
                  >
                    <span>Buka Materi</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
