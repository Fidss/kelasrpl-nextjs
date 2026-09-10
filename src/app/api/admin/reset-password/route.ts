import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json(
      { error: "Aksi tidak diizinkan. Hanya Admin yang dapat mereset password." },
      { status: 403 }
    );
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const defaultPassword = "12345678";
    const hashed = await hashPassword(defaultPassword);
    const now = new Date();

    const targetUser = await sql`
      UPDATE users
      SET password = ${hashed}, updated_at = ${now}
      WHERE id = ${parseInt(user_id)}
      RETURNING id, name, nis
    `;

    if (targetUser.length === 0) {
      return NextResponse.json({ error: "Siswa tidak ditemukan." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Password untuk ${targetUser[0].name} (NIS: ${targetUser[0].nis}) berhasil di-reset ke default: ${defaultPassword}`,
    });
  } catch (error: any) {
    console.error("Admin reset password error:", error);
    return NextResponse.json(
      { error: "Gagal mereset password." },
      { status: 500 }
    );
  }
}
