import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import ChatClient from "./ChatClient";

export const metadata = {
  title: "Pesan & Grup Chat - 10 RPL",
  description: "Kirim pesan pribadi dan buat grup chat dengan teman sekelas 10 RPL SMK Negeri 17 Jakarta.",
};

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch fresh user record
  let freshUser = user;
  try {
    const dbUsers = await sql`
      SELECT id, name, nis, email, role, gender, avatar_url, bio
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;
    if (dbUsers.length > 0) {
      const u = dbUsers[0];
      freshUser = {
        id: u.id,
        name: u.name,
        nis: u.nis,
        email: u.email,
        role: u.role || "student",
        gender: u.gender,
        avatar_url: u.avatar_url || null,
        bio: u.bio || null,
      };
    }
  } catch (err) {
    console.error("Chat page user query error:", err);
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <Navbar user={freshUser} />
      <main className="flex-1 pt-16 h-[calc(100vh-4rem)] overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full gap-2 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
              <span className="text-sm">Memuat aplikasi chat...</span>
            </div>
          }
        >
          <ChatClient currentUser={freshUser} />
        </Suspense>
      </main>
    </div>
  );
}
