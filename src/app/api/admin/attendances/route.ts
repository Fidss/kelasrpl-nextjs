import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

function safeDateStr(val: any): string {
  if (!val) return "";
  if (val instanceof Date) {
    return val.toISOString().split("T")[0];
  }
  return String(val).split("T")[0];
}

function safeTimeStr(val: any, rawText?: any): string {
  const target = rawText || val;
  if (!target) return "";
  const str = String(target).trim();
  const match = str.match(/(\d{2}:\d{2}(?::\d{2})?)/);
  if (match) return match[1];
  try {
    const d = target instanceof Date ? target : new Date(target);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(d)
      .replace(/\./g, ":");
  } catch {
    return "";
  }
}

export function formatIndoOptionDate(dateStr: string): string {
  if (!dateStr) return "";
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
      const yyyy = year;

      return `${weekday}, ${dd}/${mm}/${yyyy}`;
    }
  } catch {}
  return dateStr;
}

// GET /api/admin/attendances?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "student") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus admin / guru." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const nowJakarta = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
    }).format(new Date());

    const targetDate = searchParams.get("date") || nowJakarta;

    // 1. Fetch Students
    const students = await sql`
      SELECT id, name, nis, gender, role
      FROM users
      WHERE role != 'admin'
      ORDER BY name ASC
    `;

    // 2. Fetch Attendances for Target Date
    const attendances = await sql`
      SELECT user_id, status, notes, created_at::text as created_at_raw, created_at
      FROM attendances
      WHERE date = ${targetDate}
    `;

    const attMap = new Map<
      number,
      { status: string; notes: string | null; time: string }
    >();
    let hadir = 0;
    let izin = 0;
    let sakit = 0;

    for (const a of attendances) {
      const status = String(a.status || "");
      attMap.set(Number(a.user_id), {
        status,
        notes: a.notes ? String(a.notes) : null,
        time: safeTimeStr(a.created_at, a.created_at_raw),
      });

      if (status === "hadir") hadir++;
      else if (status === "izin") izin++;
      else if (status === "sakit") sakit++;
    }

    const total = students.length;
    const alpa = Math.max(0, total - (hadir + izin + sakit));

    const enrichedStudents = students.map((s) => {
      const att = attMap.get(Number(s.id));
      return {
        id: Number(s.id),
        name: String(s.name || ""),
        nis: String(s.nis || "-"),
        gender: String(s.gender || "L"),
        status: att ? att.status : "alpa",
        notes: att?.notes || null,
        time: att?.time || null,
      };
    });

    // 3. Fetch All Distinct Dates in attendances
    const dateRows = await sql`
      SELECT DISTINCT date::text as date_str
      FROM attendances
      ORDER BY date_str DESC
    `;

    const rawDates = dateRows
      .map((d) => safeDateStr(d.date_str))
      .filter(Boolean);

    if (!rawDates.includes(nowJakarta)) {
      rawDates.unshift(nowJakarta);
    }

    const availableDates = rawDates.map((d) => ({
      date: d,
      label: `${formatIndoOptionDate(d)}${d === nowJakarta ? " (Hari Ini)" : ""}`,
      isToday: d === nowJakarta,
    }));

    return NextResponse.json({
      success: true,
      selectedDate: targetDate,
      selectedDateLabel: formatIndoOptionDate(targetDate),
      isToday: targetDate === nowJakarta,
      students: enrichedStudents,
      stats: { total, hadir, izin, sakit, alpa },
      availableDates,
    });
  } catch (error: any) {
    console.error("Fetch admin attendances error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil rekapitulasi absensi." },
      { status: 500 }
    );
  }
}
