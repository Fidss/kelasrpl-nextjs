import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// POST /api/kas/payment
// Allows bendahara and admin to toggle or record payments per student per week
export async function POST(req: NextRequest) {
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
    const { student_id, week_number, action, nominal, notes } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: "student_id wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Fetch student info
    const students = await sql`
      SELECT id, name, nis FROM users WHERE id = ${student_id} LIMIT 1
    `;

    if (students.length === 0) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan." },
        { status: 404 }
      );
    }

    const student = students[0];

    // 2. Fetch current settings for default nominal and total weeks
    const settings = await sql`
      SELECT weekly_nominal, total_weeks FROM kas_settings LIMIT 1
    `;
    const defaultNominal = settings.length > 0 ? Number(settings[0].weekly_nominal) : 5000;
    const totalWeeks = settings.length > 0 ? Number(settings[0].total_weeks) : 4;
    const payNominal = Number(nominal) || defaultNominal;

    // Action handling
    if (action === "pay_all") {
      // Mark all weeks 1..totalWeeks as paid
      for (let w = 1; w <= totalWeeks; w++) {
        await sql`
          INSERT INTO kas_payments (
            student_id,
            student_name,
            student_nis,
            week_number,
            nominal,
            paid_at,
            recorded_by_id,
            recorded_by_name,
            notes,
            created_at
          ) VALUES (
            ${student.id},
            ${student.name},
            ${student.nis},
            ${w},
            ${payNominal},
            (NOW() AT TIME ZONE 'Asia/Jakarta'),
            ${user.id},
            ${user.name},
            ${notes || "Lunas semua minggu"},
            (NOW() AT TIME ZONE 'Asia/Jakarta')
          )
          ON CONFLICT (student_id, week_number) DO UPDATE SET
            nominal = ${payNominal},
            paid_at = (NOW() AT TIME ZONE 'Asia/Jakarta'),
            recorded_by_id = ${user.id},
            recorded_by_name = ${user.name}
        `;
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menandai lunas seluruh minggu untuk ${student.name}.`,
      });
    }

    if (action === "unpay_all") {
      // Clear all payments for this student
      await sql`
        DELETE FROM kas_payments WHERE student_id = ${student.id}
      `;

      return NextResponse.json({
        success: true,
        message: `Riwayat pembayaran kas untuk ${student.name} telah direset.`,
      });
    }

    // Toggle specific week
    const targetWeek = Number(week_number);
    if (!targetWeek || targetWeek < 1) {
      return NextResponse.json(
        { error: "week_number tidak valid." },
        { status: 400 }
      );
    }

    const existing = await sql`
      SELECT id FROM kas_payments
      WHERE student_id = ${student.id} AND week_number = ${targetWeek}
      LIMIT 1
    `;

    if (existing.length > 0) {
      // If already paid, delete to toggle off
      await sql`
        DELETE FROM kas_payments
        WHERE student_id = ${student.id} AND week_number = ${targetWeek}
      `;

      return NextResponse.json({
        success: true,
        paid: false,
        message: `Pembayaran ${student.name} Minggu ke-${targetWeek} dibatalkan.`,
      });
    } else {
      // Insert to mark paid
      await sql`
        INSERT INTO kas_payments (
          student_id,
          student_name,
          student_nis,
          week_number,
          nominal,
          paid_at,
          recorded_by_id,
          recorded_by_name,
          notes,
          created_at
        ) VALUES (
          ${student.id},
          ${student.name},
          ${student.nis},
          ${targetWeek},
          ${payNominal},
          (NOW() AT TIME ZONE 'Asia/Jakarta'),
          ${user.id},
          ${user.name},
          ${notes || null},
          (NOW() AT TIME ZONE 'Asia/Jakarta')
        )
      `;

      return NextResponse.json({
        success: true,
        paid: true,
        message: `Pembayaran ${student.name} Minggu ke-${targetWeek} berhasil dicatat!`,
      });
    }
  } catch (error: any) {
    console.error("POST /api/kas/payment error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses pembayaran kas." },
      { status: 500 }
    );
  }
}
