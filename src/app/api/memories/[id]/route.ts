import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// DELETE /api/memories/[id]
// Allows user to delete their own uploaded memory, or admin to delete any memory
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const memoryId = parseInt(id);

    if (isNaN(memoryId)) {
      return NextResponse.json(
        { error: "ID kenangan tidak valid." },
        { status: 400 }
      );
    }

    // Check memory existence
    const existing = await sql`
      SELECT id, user_id, title
      FROM memories
      WHERE id = ${memoryId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Foto kenangan tidak ditemukan." },
        { status: 404 }
      );
    }

    const memory = existing[0];
    const isOwner = memory.user_id !== null && Number(memory.user_id) === Number(user.id);
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin untuk menghapus kenangan ini." },
        { status: 403 }
      );
    }

    // Delete record from database
    await sql`
      DELETE FROM memories
      WHERE id = ${memoryId}
    `;

    return NextResponse.json({
      success: true,
      message: `Foto kenangan "${memory.title}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("Delete memory error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus kenangan." },
      { status: 500 }
    );
  }
}
