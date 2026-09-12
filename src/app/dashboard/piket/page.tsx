import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PiketKebersihanClient from "./PiketKebersihanClient";
import { piketData } from "@/data/schedule";
import { buildPiketRosterWithStudents, MatchedStudent } from "@/lib/piket-helper";

const IMGBB_API_KEY = "a2419e396e72719a75b431c80febc0c4";

function safeNormalizeImgbbUrl(url: string): string {
  if (!url) return "";
  return url.replace(/ibb\.co(\.com)*/g, "ibb.co.com");
}

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function getJakartaDay(): number {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakarta = new Date(utc + 3600000 * 7);
  return jakarta.getDay();
}

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      const weekday = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
      }).format(d);
      const dd = String(day).padStart(2, "0");
      const mm = String(month + 1).padStart(2, "0");
      return `${weekday}, ${dd}/${mm}/${year}`;
    }
  } catch {}
  return dateStr;
}

const PIKET_VIEW_ROLES = ["admin", "teacher", "ketuakelas", "wakilketuakelas", "kebersihan"];

export default async function PiketKebersihanPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const nowJakarta = getJakartaDate();
  const nowJakartaDay = getJakartaDay();

  const piketDayMap: Record<number, number> = {
    1: 1, // Monday
    2: 2, // Tuesday
    3: 3, // Wednesday
    4: 4, // Thursday
    5: 5, // Friday
  };

  const piketDay = piketDayMap[nowJakartaDay];
  const todayPiketNames = piketDay ? (piketData[piketDay] || []) : [];

  // Fetch students from DB for matching
  const dbStudents = await sql`
    SELECT id, name, nis, gender, role
    FROM users
    WHERE role != 'admin' AND role != 'teacher'
    ORDER BY name ASC
  `;
  const studentsForMatch: MatchedStudent[] = dbStudents.map((s) => ({
    id: Number(s.id),
    name: String(s.name || ""),
    nis: String(s.nis || "-"),
    gender: String(s.gender || "L"),
    role: String(s.role || "student"),
  }));

  const piketRoster = buildPiketRosterWithStudents(todayPiketNames, studentsForMatch);

  const piketStudentIds = new Set(
    piketRoster
      .filter((r) => r.matched_student_id !== null)
      .map((r) => r.matched_student_id!)
  );
  const notOnPiket = studentsForMatch.filter((s) => !piketStudentIds.has(s.id));

  // Fetch existing piket record for today (accessible by all class members)
  let piketRecord: any = null;
  const existing = await sql`
    SELECT id, piket_date, photo_url, delete_url, uploader_id, uploader_name, no_piket_list, created_at, updated_at
    FROM piket_kebersihan
    WHERE piket_date = ${nowJakarta}
    LIMIT 1
  `;
  if (existing.length > 0) {
    const rec = existing[0];
    let parsedNoPiket: any[] = [];
    if (rec.no_piket_list) {
      try {
        parsedNoPiket = typeof rec.no_piket_list === "string" ? JSON.parse(rec.no_piket_list) : rec.no_piket_list;
        if (!Array.isArray(parsedNoPiket)) parsedNoPiket = [];
      } catch {
        parsedNoPiket = [];
      }
    }

    piketRecord = {
      id: Number(rec.id),
      piket_date: rec.piket_date
        ? typeof rec.piket_date === "string"
          ? rec.piket_date
          : rec.piket_date.toISOString().split("T")[0]
        : nowJakarta,
      photo_url: safeNormalizeImgbbUrl(rec.photo_url || ""),
      delete_url: rec.delete_url ? safeNormalizeImgbbUrl(rec.delete_url) : null,
      uploader_id: rec.uploader_id ? Number(rec.uploader_id) : null,
      uploader_name: rec.uploader_name ? String(rec.uploader_name) : user.name,
      no_piket_list: parsedNoPiket,
      created_at: rec.created_at ? new Date(rec.created_at).toISOString() : null,
      updated_at: rec.updated_at ? new Date(rec.updated_at).toISOString() : null,
    };
  }

  const piketDataProp = {
    user: {
      id: user.id,
      name: user.name,
      nis: user.nis,
      role: user.role,
    },
    today: nowJakarta,
    todayLabel: formatIndoDate(nowJakarta),
    dayName: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][nowJakartaDay] || "Senin",
    isWeekend: nowJakartaDay === 0 || nowJakartaDay === 6,
    canUpload: user.role === "kebersihan" || user.role === "admin",
    canViewPiketRecord: true,
    piketRoster,
    piketCount: todayPiketNames.length,
    notOnPiketStudents: notOnPiket,
    notOnPiketCount: notOnPiket.length,
    piketRecord,
    imgbbApiKey: IMGBB_API_KEY,
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={user} />
      <main className="flex-1 pt-16">
        <PiketKebersihanClient {...piketDataProp} />
      </main>
      <Footer />
    </div>
  );
}
