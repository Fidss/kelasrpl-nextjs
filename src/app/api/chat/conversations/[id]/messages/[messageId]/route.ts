import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id, messageId } = await params;
    const conversationId = parseInt(id);
    const msgId = parseInt(messageId);

    if (isNaN(conversationId) || isNaN(msgId)) {
      return NextResponse.json(
        { error: "Parameter tidak valid." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const content = String(body.content || "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // Verify message exists and sender is current user
    const existing = await sql`
      SELECT id, sender_id, conversation_id
      FROM messages
      WHERE id = ${msgId} AND conversation_id = ${conversationId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (Number(existing[0].sender_id) !== Number(user.id)) {
      return NextResponse.json(
        { error: "Anda hanya dapat mengedit pesan yang Anda kirim sendiri." },
        { status: 403 }
      );
    }

    const updated = await sql`
      UPDATE messages
      SET content = ${content},
          is_edited = TRUE,
          updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      WHERE id = ${msgId}
      RETURNING id, content, is_edited, updated_at
    `;

    return NextResponse.json({
      success: true,
      message: {
        id: Number(updated[0].id),
        content: updated[0].content,
        is_edited: true,
        updated_at: new Date(updated[0].updated_at).toISOString(),
      },
    });
  } catch (error: any) {
    console.error("PATCH message error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui pesan." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { id, messageId } = await params;
    const conversationId = parseInt(id);
    const msgId = parseInt(messageId);

    if (isNaN(conversationId) || isNaN(msgId)) {
      return NextResponse.json(
        { error: "Parameter tidak valid." },
        { status: 400 }
      );
    }

    // Check membership and role in conversation
    const membership = await sql`
      SELECT role
      FROM conversation_members
      WHERE conversation_id = ${conversationId} AND user_id = ${Number(user.id)}
      LIMIT 1
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Anda bukan anggota dari percakapan ini." },
        { status: 403 }
      );
    }

    const isConvAdmin = membership[0].role === "admin";

    // Verify message exists
    const existing = await sql`
      SELECT id, sender_id
      FROM messages
      WHERE id = ${msgId} AND conversation_id = ${conversationId}
      LIMIT 1
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Only message sender or group admin can delete
    const isSender = Number(existing[0].sender_id) === Number(user.id);
    if (!isSender && !isConvAdmin) {
      return NextResponse.json(
        { error: "Anda tidak memiliki hak untuk menghapus pesan ini." },
        { status: 403 }
      );
    }

    await sql`
      DELETE FROM messages
      WHERE id = ${msgId}
    `;

    return NextResponse.json({
      success: true,
      message_id: msgId,
    });
  } catch (error: any) {
    console.error("DELETE message error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pesan." },
      { status: 500 }
    );
  }
}
