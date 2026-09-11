import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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
  return jakarta.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
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

type NoPiketItem = Record<string, unknown>;

// Roles allowed to view piket kebersihan data
const PIKET_VIEW_ROLES = [
  "admin",
  "teacher",
  "ketuakelas",
  "wakilketuakelas",
  "kebersihan",
];

// GET /api/piket?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get("date") || getJakartaDate();

    // Determine day of week
    let targetDayNum: number;
    try {
      const parts = targetDate.split("-");
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        const d = new Date(year, month, day);
        targetDayNum = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      } else {
        targetDayNum = getJakartaDay();
      }
    } catch {
      targetDayNum = getJakartaDay();
    }

    // Map JS day to piketData day (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri)
    const piketDayMap: Record<number, number> = {
      1: 1, // Monday
      2: 2, // Tuesday
      3: 3, // Wednesday
      4: 4, // Thursday
      5: 5, // Friday
    };

    const piketDay = piketDayMap[targetDayNum];
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

    // Build piket roster with student matching
    const piketRoster = buildPiketRosterWithStudents(todayPiketNames, studentsForMatch);

    // Find students NOT on piket today
    const piketStudentIds = new Set(
      piketRoster
        .filter((r) => r.matched_student_id !== null)
        .map((r) => r.matched_student_id!)
    );
    const notOnPiket = studentsForMatch.filter((s) => !piketStudentIds.has(s.id));

    // Fetch existing piket record for today
    let piketRecord: {
      id: number;
      piket_date: string;
      photo_url: string;
      delete_url: string | null;
      uploader_id: number | null;
      uploader_name: string;
      no_piket_list: NoPiketItem[];
      created_at: string | null;
      updated_at: string | null;
    } | null = null;

    if (PIKET_VIEW_ROLES.includes(user.role)) {
      const existing = await sql`
        SELECT id, piket_date, photo_url, delete_url, uploader_id, uploader_name, no_piket_list, created_at, updated_at
        FROM piket_kebersihan
        WHERE piket_date = ${targetDate}
        LIMIT 1
      `;
      if (existing.length > 0) {
        const rec = existing[0];
        let parsedNoPiket: NoPiketItem[] = [];
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
            : targetDate,
          photo_url: safeNormalizeImgbbUrl(rec.photo_url || ""),
          delete_url: rec.delete_url ? safeNormalizeImgbbUrl(rec.delete_url) : null,
          uploader_id: rec.uploader_id ? Number(rec.uploader_id) : null,
          uploader_name: rec.uploader_name ? String(rec.uploader_name) : "Admin Kelas",
          no_piket_list: parsedNoPiket,
          created_at: rec.created_at ? new Date(rec.created_at).toISOString() : null,
          updated_at: rec.updated_at ? new Date(rec.updated_at).toISOString() : null,
        };
      }
    }

    return NextResponse.json({
      success: true,
      date: targetDate,
      dateLabel: formatIndoDate(targetDate),
      isToday: targetDate === getJakartaDate(),
      dayOfWeek: targetDayNum,
      dayName: ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][targetDayNum] || "Senin",
      isWeekend: targetDayNum === 0 || targetDayNum === 6,
      canUpload: user.role === "kebersihan",
      canViewPiketRecord: PIKET_VIEW_ROLES.includes(user.role),
      piketRoster,
      piketCount: todayPiketNames.length,
      notOnPiketStudents: notOnPiket,
      notOnPiketCount: notOnPiket.length,
      piketRecord,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    console.error("GET piket kebersihan error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data piket kebersihan." },
      { status: 500 }
    );
  }
}

// POST /api/piket
// Allows kebersihan role to upload a photo and select students who didn't do piket
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "kebersihan" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus role Seksi Kebersihan." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const photoFile = formData.get("photo") as File | null;
    const noPiketRaw = formData.get("no_piket") as string | null;

    if (!photoFile || photoFile.size === 0) {
      return NextResponse.json(
        { error: "Foto piket kelas wajib diunggah." },
        { status: 400 }
      );
    }

    if (photoFile.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 15 MB." },
        { status: 400 }
      );
    }

    let noPiketList: NoPiketItem[] = [];
    if (noPiketRaw) {
      try {
        noPiketList = typeof noPiketRaw === "string" ? JSON.parse(noPiketRaw) : noPiketRaw;
        if (!Array.isArray(noPiketList)) {
          throw new Error("Invalid array");
        }
      } catch {
        return NextResponse.json(
          { error: "Format data siswa tidak piket (no_piket) tidak valid." },
          { status: 400 }
        );
      }
    }

    // Convert file to base64 for ImgBB upload
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Upload to ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append("image", base64Image);
    imgbbForm.append("name", `piket_kebersihan_${getJakartaDate()}`);

    const imgbbRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: imgbbForm,
      }
    );

    const imgbbData = await imgbbRes.json();
    if (!imgbbRes.ok || !imgbbData?.data?.url) {
      console.error("ImgBB upload error response:", imgbbData);
      return NextResponse.json(
        {
          error:
            imgbbData?.error?.message ||
            "Gagal mengunggah foto ke storage ImgBB.",
        },
        { status: 502 }
      );
    }

    const rawUrl: string = imgbbData.data.url;
    const imageUrl = safeNormalizeImgbbUrl(rawUrl);
    const rawDeleteUrl: string = imgbbData.data.delete_url || "";
    const deleteUrl = rawDeleteUrl ? safeNormalizeImgbbUrl(rawDeleteUrl) : null;

    const today = getJakartaDate();
    const noPiketJson = JSON.stringify(noPiketList);

    // Upsert: if a record exists for today, update it; otherwise insert
    const result = await sql`
      INSERT INTO piket_kebersihan (
        piket_date,
        photo_url,
        delete_url,
        uploader_id,
        uploader_name,
        no_piket_list,
        created_at,
        updated_at
      ) VALUES (
        ${today},
        ${imageUrl},
        ${deleteUrl},
        ${user.id},
        ${user.name},
        ${noPiketJson},
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
      ON CONFLICT (piket_date) DO UPDATE SET
        photo_url = ${imageUrl},
        delete_url = ${deleteUrl},
        uploader_id = ${user.id},
        uploader_name = ${user.name},
        no_piket_list = ${noPiketJson},
        updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      RETURNING id, piket_date, photo_url, delete_url, uploader_id, uploader_name, no_piket_list, created_at, updated_at
    `;

    const rec = result[0];
    let parsedSavedNoPiket: NoPiketItem[] = [];
    if (rec.no_piket_list) {
      try {
        parsedSavedNoPiket = typeof rec.no_piket_list === "string" ? JSON.parse(rec.no_piket_list) : rec.no_piket_list;
        if (!Array.isArray(parsedSavedNoPiket)) parsedSavedNoPiket = [];
      } catch {
        parsedSavedNoPiket = [];
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data piket kebersihan berhasil disimpan!",
      data: {
        id: Number(rec.id),
        piket_date: rec.piket_date
          ? typeof rec.piket_date === "string"
            ? rec.piket_date
            : rec.piket_date.toISOString().split("T")[0]
          : today,
        photo_url: safeNormalizeImgbbUrl(rec.photo_url || ""),
        delete_url: rec.delete_url ? safeNormalizeImgbbUrl(rec.delete_url) : null,
        uploader_id: rec.uploader_id ? Number(rec.uploader_id) : null,
        uploader_name: rec.uploader_name ? String(rec.uploader_name) : user.name,
        no_piket_list: parsedSavedNoPiket,
        created_at: rec.created_at ? new Date(rec.created_at).toISOString() : null,
        updated_at: rec.updated_at ? new Date(rec.updated_at).toISOString() : null,
      },
    });
  } catch (error: unknown) {
    console.error("POST piket kebersihan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan piket kebersihan." },
      { status: 500 }
    );
  }
}

// DELETE /api/piket?date=YYYY-MM-DD
// Allows kebersihan or admin to delete a piket record for a specific date
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "kebersihan" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus admin atau Seksi Kebersihan." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get("date") || getJakartaDate();

    const existing = await sql`
      SELECT id, photo_url, delete_url FROM piket_kebersihan WHERE piket_date = ${targetDate} LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Data piket kebersihan untuk tanggal ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Try to delete from ImgBB as well if delete_url exists
    const rec = existing[0];
    if (rec.delete_url) {
      try {
        await fetch(rec.delete_url, { method: "GET" });
      } catch (imgErr) {
        console.error("ImgBB delete error:", imgErr);
      }
    }

    await sql`DELETE FROM piket_kebersihan WHERE piket_date = ${targetDate}`;

    return NextResponse.json({
      success: true,
      message: "Data piket kebersihan berhasil dihapus.",
    });
  } catch (error: unknown) {
    console.error("DELETE piket kebersihan error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menghapus data piket kebersihan." },
      { status: 500 }
    );
  }
}
