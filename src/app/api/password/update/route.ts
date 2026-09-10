import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { current_password, new_password, new_password_confirmation } = await req.json();

    if (!current_password || !new_password) {
      return NextResponse.json(
        { error: "Password saat ini dan password baru wajib diisi." },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: "Password baru minimal 8 karakter." },
        { status: 400 }
      );
    }

    if (new_password !== new_password_confirmation) {
      return NextResponse.json(
        { error: "Konfirmasi password baru tidak cocok." },
        { status: 400 }
      );
    }

    if (current_password === new_password) {
      return NextResponse.json(
        { error: "Password baru harus berbeda dari password lama." },
        { status: 400 }
      );
    }

    // Fetch user's current password hash
    const users = await sql`
      SELECT password FROM users WHERE id = ${user.id} LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const isValid = await verifyPassword(current_password, users[0].password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Password saat ini yang Anda masukkan salah." },
        { status: 400 }
      );
    }

    const newHashed = await hashPassword(new_password);
    const now = new Date();

    await sql`
      UPDATE users
      SET password = ${newHashed}, updated_at = ${now}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({
      success: true,
      message: "Password Anda berhasil diperbarui!",
    });
  } catch (error: any) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui password." },
      { status: 500 }
    );
  }
}
