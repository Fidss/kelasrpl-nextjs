import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await sql`
      SELECT id, title, created_at, updated_at
      FROM chat_sessions
      WHERE user_id = ${user.id}
      ORDER BY updated_at DESC
    `;
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Gagal memuat sesi chat." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title = "Obrolan Baru" } = await req.json();
    const now = new Date();
    const result = await sql`
      INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
      VALUES (${user.id}, ${title}, ${now}, ${now})
      RETURNING id, title, created_at, updated_at
    `;
    return NextResponse.json({ success: true, session: result[0] });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Gagal membuat sesi baru." }, { status: 500 });
  }
}
