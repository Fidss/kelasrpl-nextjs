import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

function getJakartaTime(): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .format(new Date())
    .replace(/\./g, ":");
}

async function extractNis(req: NextRequest): Promise<string | null> {
  // 1. Check URL search parameters first
  const { searchParams } = new URL(req.url);
  const paramNis = searchParams.get("nis") || searchParams.get("NIS");
  if (paramNis && paramNis.trim()) {
    return paramNis.trim();
  }

  const contentType = req.headers.get("content-type") || "";

  // 2. Form urlencoded / multipart
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await req.formData();
      const formNis = formData.get("nis") || formData.get("NIS");
      if (formNis && typeof formNis === "string" && formNis.trim()) {
        return formNis.trim();
      }
    } catch {
      // fallback to reading text
    }
  }

  // 3. JSON body
  if (contentType.includes("application/json")) {
    try {
      const body = await req.json();
      const jsonNis = body.nis || body.NIS || body.uid_nis;
      if (jsonNis) {
        return String(jsonNis).trim();
      }
    } catch {
      // fallback
    }
  }

  // 4. Raw text fallback (e.g. "nis=11810" or just "11810")
  try {
    const rawText = await req.text();
    if (rawText && rawText.trim()) {
      const trimmed = rawText.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          const parsed = JSON.parse(trimmed);
          const pNis = parsed.nis || parsed.NIS;
          if (pNis) return String(pNis).trim();
        } catch {}
      }

      const params = new URLSearchParams(trimmed);
      const parsedNis = params.get("nis") || params.get("NIS");
      if (parsedNis && parsedNis.trim()) {
        return parsedNis.trim();
      }

      // If it's pure digits like "11810"
      if (/^\d{4,10}$/.test(trimmed)) {
        return trimmed;
      }
    }
  } catch {}

  return null;
}

// POST /api/attendance/scan
// Endpoint called by ESP32 / IoT PN532 RFID scanner to record student attendance
export async function POST(req: NextRequest) {
  try {
    const nis = await extractNis(req);

    if (!nis) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter NIS tidak ditemukan. Pastikan payload mengirim 'nis=<nomor_nis>'.",
        },
        { status: 400 }
      );
    }

    // 1. Find student by NIS in the database
    const students = await sql`
      SELECT id, name, nis, role, gender
      FROM users
      WHERE TRIM(nis) = ${nis.trim()}
      LIMIT 1
    `;

    if (students.length === 0) {
      console.warn(`[IoT Attendance] Student with NIS '${nis}' not found in database.`);
      return NextResponse.json(
        {
          success: false,
          error: `Siswa dengan NIS '${nis}' tidak terdaftar di database.`,
        },
        { status: 404 }
      );
    }

    const student = students[0];
    const today = getJakartaDate();
    const timeNow = getJakartaTime();

    // 2. Check if attendance already recorded for today
    const existing = await sql`
      SELECT id, status, notes, created_at
      FROM attendances
      WHERE user_id = ${student.id} AND date = ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      const rec = existing[0];
      const currentStatus = String(rec.status || "").toLowerCase();

      // If already 'hadir', return 200 so IoT device plays success tone
      if (currentStatus === "hadir") {
        return NextResponse.json(
          {
            success: true,
            alreadyRecorded: true,
            message: `${student.name} sudah tercatat Hadir hari ini (${today}).`,
            student: {
              id: Number(student.id),
              name: String(student.name),
              nis: String(student.nis),
            },
            attendance: {
              status: "hadir",
              date: today,
            },
          },
          { status: 200 }
        );
      }

      // If status was 'izin', 'sakit', or other, update to 'hadir'
      await sql`
        UPDATE attendances
        SET status = 'hadir',
            notes = 'Absen via IoT PN532 RFID',
            updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
        WHERE id = ${rec.id}
      `;

      return NextResponse.json(
        {
          success: true,
          updated: true,
          message: `Status kehadiran ${student.name} diperbarui menjadi Hadir.`,
          student: {
            id: Number(student.id),
            name: String(student.name),
            nis: String(student.nis),
          },
          attendance: {
            status: "hadir",
            date: today,
            time: timeNow,
          },
        },
        { status: 200 }
      );
    }

    // 3. Insert new attendance record
    await sql`
      INSERT INTO attendances (
        user_id,
        date,
        status,
        notes,
        created_at,
        updated_at
      ) VALUES (
        ${student.id},
        ${today},
        'hadir',
        'Absen via IoT PN532 RFID',
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
    `;

    return NextResponse.json(
      {
        success: true,
        message: `Absen berhasil! ${student.name} (${student.nis}) tercatat Hadir.`,
        student: {
          id: Number(student.id),
          name: String(student.name),
          nis: String(student.nis),
        },
        attendance: {
          status: "hadir",
          date: today,
          time: timeNow,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[IoT Attendance] Error processing scan:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server saat memproses absensi IoT.",
      },
      { status: 500 }
    );
  }
}

// GET /api/attendance/scan
// Allows diagnostic check or browser testing with ?nis=XXXXX
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const nis = searchParams.get("nis");

  if (!nis) {
    return NextResponse.json({
      status: "ready",
      endpoint: "/api/attendance/scan",
      method: "POST",
      description: "API Absensi IoT PN532 RFID Kelas RPL",
      instructions: "Kirim request POST dengan payload 'nis=<nomor_nis>' (application/x-www-form-urlencoded atau JSON).",
      today: getJakartaDate(),
    });
  }

  // If NIS provided in GET, simulate attendance POST
  return POST(req);
}
