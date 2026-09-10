import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kelasrpl-jwt-secret-key-2026-smk17jkt"
);

export async function POST(req: NextRequest) {
  const token = req.cookies.get("control_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { is_shutdown, mode = "maintenance", title, message } = await req.json();
    const shutdownBool = Boolean(is_shutdown);
    const now = new Date();

    const defaultTitle = shutdownBool
      ? mode === "shutdown"
        ? "Server Telah Dimatikan"
        : "Server Dalam Pemeliharaan"
      : "Server Sedang Berjalan Normal";

    const defaultMsg =
      message ||
      "Layanan saat ini sedang dinonaktifkan sementara untuk pemeliharaan sistem. Silakan coba kembali nanti.";

    await sql`
      INSERT INTO system_controls (
        id, is_shutdown, mode, title, message, activated_at, activated_by, created_at, updated_at
      ) VALUES (
        1, ${shutdownBool}, ${mode}, ${title || defaultTitle}, ${defaultMsg},
        ${shutdownBool ? now : null}, 'Control Room Operator', ${now}, ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        is_shutdown = EXCLUDED.is_shutdown,
        mode = EXCLUDED.mode,
        title = EXCLUDED.title,
        message = EXCLUDED.message,
        activated_at = EXCLUDED.activated_at,
        activated_by = EXCLUDED.activated_by,
        updated_at = EXCLUDED.updated_at
    `;

    return NextResponse.json({
      success: true,
      message: shutdownBool
        ? "Emergency toggle berhasil diaktifkan."
        : "Server berhasil dikembalikan ke status normal.",
    });
  } catch (error: any) {
    console.error("Control toggle error:", error);
    return NextResponse.json({ error: "Gagal memperbarui status server." }, { status: 500 });
  }
}
