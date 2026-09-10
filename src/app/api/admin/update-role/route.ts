import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const ALLOWED_ROLES = [
  "student",
  "teacher",
  "ketuakelas",
  "wakilketuakelas",
  "sekertaris",
  "bendahara",
  "keamanan",
  "kebersihan",
] as const;

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Khusus admin kelas." },
        { status: 403 }
      );
    }

    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "User ID dan Role wajib diisi." },
        { status: 400 }
      );
    }

    // Role target verification
    const normalizedRole = String(role).toLowerCase().trim();
    if (!ALLOWED_ROLES.includes(normalizedRole as any)) {
      return NextResponse.json(
        { error: "Pilihan role tidak valid." },
        { status: 400 }
      );
    }

    // Update role in database
    const updated = await sql`
      UPDATE users
      SET role = ${normalizedRole}, updated_at = NOW()
      WHERE id = ${user_id}
      RETURNING id, name, role
    `;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Siswa/pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Role ${updated[0].name} berhasil diubah menjadi ${normalizedRole}.`,
      user: updated[0],
    });
  } catch (error: any) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memperbarui role." },
      { status: 500 }
    );
  }
}
