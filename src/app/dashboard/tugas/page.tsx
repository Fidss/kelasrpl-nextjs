import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TugasClient from "./TugasClient";

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default async function TugasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const today = getJakartaDate();

  const rows = await sql`
    SELECT id, title, subject, teacher_name, type, deadline, deadline_time, description, status, created_by_name, created_at, updated_at
    FROM class_tasks
    ORDER BY status ASC, deadline ASC, id DESC
  `;

  const tasks = rows.map((r) => {
    const deadlineStr = r.deadline
      ? typeof r.deadline === "string"
        ? r.deadline
        : r.deadline.toISOString().split("T")[0]
      : today;

    const isOverdue = deadlineStr < today && r.status === "active";

    return {
      id: Number(r.id),
      title: String(r.title),
      subject: String(r.subject),
      teacher_name: r.teacher_name ? String(r.teacher_name) : "-",
      type: String(r.type || "tugas"),
      deadline: deadlineStr,
      deadline_time: r.deadline_time ? String(r.deadline_time) : "23:59",
      description: r.description ? String(r.description) : "",
      status: isOverdue ? "overdue" : String(r.status || "active"),
      created_by_name: r.created_by_name ? String(r.created_by_name) : "Sekretaris",
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    };
  });

  const canManage = user.role === "sekertaris" || user.role === "admin";

  const initialData = {
    user: {
      id: user.id,
      name: user.name,
      nis: user.nis,
      role: user.role,
    },
    canManage,
    tasks,
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={user} />
      <main className="flex-1 pt-16">
        <TugasClient initialData={initialData} />
      </main>
      <Footer />
    </div>
  );
}
