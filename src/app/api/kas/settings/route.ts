import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// PATCH /api/kas/settings
// Update weekly nominal and total weeks target
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.role !== "bendahara" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus Bendahara Kelas dan Admin." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const weeklyNominal = parseInt(String(body.weekly_nominal || 5000), 10);
    const totalWeeks = parseInt(String(body.total_weeks || 4), 10);

    if (isNaN(weeklyNominal) || weeklyNominal < 0) {
      return NextResponse.json(
        { error: "Nominal per minggu tidak valid." },
        { status: 400 }
      );
    }

    if (isNaN(totalWeeks) || totalWeeks < 1 || totalWeeks > 52) {
      return NextResponse.json(
        { error: "Jumlah target minggu harus antara 1 sampai 52." },
        { status: 400 }
      );
    }

    const existing = await sql`SELECT id FROM kas_settings LIMIT 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO kas_settings (weekly_nominal, total_weeks, updated_at)
        VALUES (${weeklyNominal}, ${totalWeeks}, (NOW() AT TIME ZONE 'Asia/Jakarta'))
      `;
    } else {
      await sql`
        UPDATE kas_settings
        SET weekly_nominal = ${weeklyNominal},
            total_weeks = ${totalWeeks},
            updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
        WHERE id = ${existing[0].id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Pengaturan kas kelas berhasil diperbarui!",
      settings: {
        weeklyNominal,
        totalWeeks,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/kas/settings error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pengaturan kas." },
      { status: 500 }
    );
  }
}
