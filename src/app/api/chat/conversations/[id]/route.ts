import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const conversationId = parseInt(id);

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "ID percakapan tidak valid." },
        { status: 400 }
      );
    }

    // Verify conversation exists and user is a member
    const convRows = await sql`
      SELECT c.id, c.type, c.created_by, cm.role
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id AND cm.user_id = ${Number(user.id)}
      WHERE c.id = ${conversationId}
      LIMIT 1
    `;

    if (convRows.length === 0) {
      return NextResponse.json(
        { error: "Percakapan tidak ditemukan atau Anda bukan anggotanya." },
        { status: 404 }
      );
    }

    const conv = convRows[0];

    if (conv.type === "direct") {
      // Direct chat: Delete the entire conversation and its messages
      await sql`DELETE FROM conversations WHERE id = ${conversationId}`;
      return NextResponse.json({
        success: true,
        message: "Percakapan berhasil dihapus.",
      });
    }

    if (conv.type === "group") {
      // Check how many members are left
      const memberCountRes = await sql`
        SELECT COUNT(*)::int as count
        FROM conversation_members
        WHERE conversation_id = ${conversationId}
      `;
      const count = memberCountRes[0]?.count || 0;

      if (conv.role === "admin" && count <= 1) {
        // Only 1 member left (the admin), delete the whole group
        await sql`DELETE FROM conversations WHERE id = ${conversationId}`;
        return NextResponse.json({
          success: true,
          message: "Grup berhasil dihapus.",
        });
      } else {
        // User leaves the group
        await sql`
          DELETE FROM conversation_members
          WHERE conversation_id = ${conversationId} AND user_id = ${Number(user.id)}
        `;

        // If user was admin, assign another admin if available
        if (conv.role === "admin") {
          await sql`
            UPDATE conversation_members
            SET role = 'admin'
            WHERE id = (
              SELECT id FROM conversation_members
              WHERE conversation_id = ${conversationId}
              LIMIT 1
            )
          `;
        }

        return NextResponse.json({
          success: true,
          message: "Anda telah keluar dari grup.",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil.",
    });
  } catch (error: any) {
    console.error("DELETE conversation error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus percakapan." },
      { status: 500 }
    );
  }
}
