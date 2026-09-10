import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 });
  }

  try {
    // Verify session belongs to user
    const sessions = await sql`
      SELECT id FROM chat_sessions
      WHERE id = ${parseInt(sessionId)} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const messages = await sql`
      SELECT id, role, content, attachments, created_at
      FROM chat_messages
      WHERE chat_session_id = ${parseInt(sessionId)}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat pesan." }, { status: 500 });
  }
}
