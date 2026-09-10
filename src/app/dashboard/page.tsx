import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DashboardClient from "./DashboardClient";

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

function safeIsoStr(val: any, rawText?: any): string {
  if (rawText && typeof rawText === "string") {
    const clean = rawText.trim().replace(" ", "T").split(".")[0];
    return `${clean}+07:00`;
  }
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}/.test(str)) {
    const clean = str.replace(" ", "T").split(".")[0];
    return `${clean}+07:00`;
  }
  return str;
}

function formatIndoOptionDate(dateStr: string): string {
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

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Today in Jakarta date (YYYY-MM-DD)
  const nowJakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  if (user.role === "student") {
    // Run all student queries in parallel for faster loading
    const [todayResult, historyResult, menfessResult, memoriesResult] = await Promise.allSettled([
      sql`
        SELECT id, date, status, notes, created_at::text as created_at_raw, created_at
        FROM attendances
        WHERE user_id = ${user.id} AND date = ${nowJakarta}
        LIMIT 1
      `,
      sql`
        SELECT id, date, status, notes, created_at::text as created_at_raw, created_at
        FROM attendances
        WHERE user_id = ${user.id}
        ORDER BY date DESC
        LIMIT 30
      `,
      sql`
        SELECT id, sender_name, is_anonymous, message, type,
               song_title, song_artist, song_album_art, song_track_id, song_preview_url,
               is_read, created_at::text as created_at_raw, created_at
        FROM menfesses
        WHERE recipient_id = ${user.id}
        ORDER BY created_at DESC
        LIMIT 30
      `,
      sql`
        SELECT id, user_id, user_name, title, tag, date, description, image_url,
               created_at::text as created_at_raw, created_at
        FROM memories
        WHERE user_id = ${user.id}
        ORDER BY created_at DESC, id DESC
      `,
    ]);

    // Process today's attendance
    let todayAttendance: any = null;
    if (todayResult.status === "fulfilled") {
      const rawToday = todayResult.value[0] || null;
      if (rawToday) {
        todayAttendance = {
          id: rawToday.id,
          date: safeDateStr(rawToday.date),
          status: String(rawToday.status || ""),
          notes: rawToday.notes ? String(rawToday.notes) : null,
          time: safeTimeStr(rawToday.created_at, rawToday.created_at_raw),
        };
      }
    } else {
      console.error("Dashboard student today attendance error:", todayResult.reason);
    }

    // Process attendance history
    let history: any[] = [];
    if (historyResult.status === "fulfilled") {
      history = historyResult.value.map((h: any) => ({
        id: h.id,
        date: safeDateStr(h.date),
        status: String(h.status || "alpa"),
        notes: h.notes ? String(h.notes) : null,
        time: safeTimeStr(h.created_at, h.created_at_raw),
      }));
    } else {
      console.error("Dashboard student history error:", historyResult.reason);
    }

    // Process received menfesses
    let receivedMenfesses: any[] = [];
    if (menfessResult.status === "fulfilled") {
      receivedMenfesses = menfessResult.value.map((m: any) => ({
        id: m.id,
        sender_name: String(m.sender_name || "Anonim"),
        is_anonymous: Boolean(m.is_anonymous),
        message: String(m.message || ""),
        type: String(m.type || "menfess"),
        song_title: m.song_title ? String(m.song_title) : null,
        song_artist: m.song_artist ? String(m.song_artist) : null,
        song_album_art: m.song_album_art ? String(m.song_album_art) : null,
        song_track_id: m.song_track_id ? String(m.song_track_id) : null,
        song_preview_url: m.song_preview_url ? String(m.song_preview_url) : null,
        is_read: Boolean(m.is_read),
        created_at: safeIsoStr(m.created_at, m.created_at_raw),
      }));
    } else {
      console.error("Dashboard student menfesses error:", menfessResult.reason);
    }

    // Process user memories
    let userMemories: any[] = [];
    if (memoriesResult.status === "fulfilled") {
      userMemories = memoriesResult.value.map((m: any) => ({
        id: Number(m.id),
        title: String(m.title || ""),
        tag: String(m.tag || "Memori Siswa"),
        date: String(m.date || ""),
        description: m.description ? String(m.description) : "",
        image_url: String(m.image_url || "").replace(/ibb\.co(\.com)*/g, "ibb.co.com"),
        user_id: m.user_id ? Number(m.user_id) : null,
        user_name: String(m.user_name || ""),
        created_at: safeIsoStr(m.created_at, m.created_at_raw),
      }));
    } else {
      console.error("Dashboard student memories error:", memoriesResult.reason);
    }

    const unreadMenfesses = receivedMenfesses.filter((m) => !m.is_read);
    const unreadCount = unreadMenfesses.length;
    const latestUnreadMenfess = unreadMenfesses[0] || null;

    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar user={user} />
        <main className="flex-1 pt-16">
          <DashboardClient
            user={user}
            todayAttendance={todayAttendance}
            history={history}
            receivedMenfesses={receivedMenfesses}
            unreadCount={unreadCount}
            latestUnreadMenfess={latestUnreadMenfess}
            memories={userMemories}
          />
        </main>
        <Footer />
      </div>
    );
  } else {
    // Admin / Teacher Role — Run all queries in parallel
    const [studentsResult, attResult, memoriesResult, datesResult] = await Promise.allSettled([
      sql`
        SELECT id, name, nis, gender
        FROM users
        WHERE role = 'student'
        ORDER BY name ASC
      `,
      sql`
        SELECT user_id, status, notes, created_at::text as created_at_raw, created_at
        FROM attendances
        WHERE date = ${nowJakarta}
      `,
      sql`
        SELECT id, user_id, user_name, title, tag, date, description, image_url,
               created_at::text as created_at_raw, created_at
        FROM memories
        ORDER BY created_at DESC, id DESC
      `,
      sql`
        SELECT DISTINCT date
        FROM attendances
        ORDER BY date DESC
      `,
    ]);

    // Process students
    let students: any[] = [];
    if (studentsResult.status === "fulfilled") {
      students = studentsResult.value;
    } else {
      console.error("Dashboard admin students error:", studentsResult.reason);
    }

    // Process today's attendances
    let todayAttendances: any[] = [];
    if (attResult.status === "fulfilled") {
      todayAttendances = attResult.value;
    } else {
      console.error("Dashboard admin attendances error:", attResult.reason);
    }

    const attMap = new Map<
      number,
      { status: string; notes: string | null; time: string }
    >();
    let hadir = 0;
    let izin = 0;
    let sakit = 0;

    for (const a of todayAttendances) {
      const status = String(a.status || "");
      attMap.set(a.user_id, {
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
      const att = attMap.get(s.id);
      return {
        id: s.id,
        name: String(s.name || ""),
        nis: String(s.nis || "-"),
        gender: String(s.gender || "L"),
        status: att ? att.status : "alpa",
        notes: att?.notes || null,
        time: att?.time || null,
      };
    });

    // Process memories
    let allMemories: any[] = [];
    if (memoriesResult.status === "fulfilled") {
      allMemories = memoriesResult.value.map((m: any) => ({
        id: Number(m.id),
        title: String(m.title || ""),
        tag: String(m.tag || "Memori Siswa"),
        date: String(m.date || ""),
        description: m.description ? String(m.description) : "",
        image_url: String(m.image_url || "").replace(/ibb\.co(\.com)*/g, "ibb.co.com"),
        user_id: m.user_id ? Number(m.user_id) : null,
        user_name: String(m.user_name || ""),
        created_at: safeIsoStr(m.created_at, m.created_at_raw),
      }));
    } else {
      console.error("Dashboard admin memories error:", memoriesResult.reason);
    }

    // Process available dates
    let availableDates: any[] = [];
    if (datesResult.status === "fulfilled") {
      const rawDates = datesResult.value
        .map((d: any) => safeDateStr(d.date))
        .filter(Boolean);

      if (!rawDates.includes(nowJakarta)) {
        rawDates.unshift(nowJakarta);
      }

      availableDates = rawDates.map((d: string) => ({
        date: d,
        label: `${formatIndoOptionDate(d)}${d === nowJakarta ? " (Hari Ini)" : ""}`,
        isToday: d === nowJakarta,
      }));
    } else {
      console.error("Dashboard admin dates error:", datesResult.reason);
      availableDates = [
        {
          date: nowJakarta,
          label: `${formatIndoOptionDate(nowJakarta)} (Hari Ini)`,
          isToday: true,
        },
      ];
    }

    return (
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Navbar user={user} />
        <main className="flex-1 pt-16">
          <DashboardClient
            user={user}
            students={enrichedStudents}
            stats={{ total, hadir, izin, sakit, alpa }}
            memories={allMemories}
            availableDates={availableDates}
            initialAttendanceDate={nowJakarta}
          />
        </main>
        <Footer />
      </div>
    );
  }
}
