import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status, notes } = await req.json();

    if (!status || !["izin", "sakit"].includes(status)) {
      return NextResponse.json(
        { error: "Status absensi harus 'izin' atau 'sakit'." },
        { status: 400 }
      );
    }

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { error: "Keterangan/alasan wajib diisi." },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Check existing attendance for today
    const existing = await sql`
      SELECT id FROM attendances
      WHERE user_id = ${user.id} AND date = ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Anda sudah memiliki catatan absensi untuk hari ini." },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO attendances (user_id, date, status, notes, created_at, updated_at)
      VALUES (${user.id}, ${today}, ${status}, ${notes.trim()}, (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
    `;

    return NextResponse.json({
      success: true,
      message: "Pengajuan izin/sakit berhasil dikirim.",
    });
  } catch (error: any) {
    console.error("Attendance submission error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses absensi." },
      { status: 500 }
    );
  }
}
