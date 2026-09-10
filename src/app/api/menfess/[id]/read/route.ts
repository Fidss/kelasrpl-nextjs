import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const menfessId = parseInt(id);

  if (isNaN(menfessId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const res = await sql`
      UPDATE menfesses
      SET is_read = true, updated_at = NOW()
      WHERE id = ${menfessId} AND recipient_id = ${user.id}
      RETURNING id
    `;

    if (res.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan atau bukan ditujukan untuk Anda." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pesan berhasil ditandai sudah dibaca.",
    });
  } catch (error: any) {
    console.error("Mark menfess as read error:", error);
    return NextResponse.json(
      { error: "Gagal menandai pesan sebagai sudah dibaca." },
      { status: 500 }
    );
  }
}
