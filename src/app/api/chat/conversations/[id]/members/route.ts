import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

export async function GET(
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

    const members = await sql`
      SELECT 
        cm.user_id,
        cm.role as member_role,
        cm.joined_at,
        u.name,
        u.nis,
        u.avatar_url,
        u.role as user_role,
        u.gender
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ${conversationId}
      ORDER BY 
        CASE WHEN cm.role = 'admin' THEN 1 ELSE 2 END,
        u.name ASC
    `;

    return NextResponse.json({
      success: true,
      members: members.map((m: any) => ({
        user_id: Number(m.user_id),
        name: m.name,
        nis: m.nis,
        user_role: m.user_role,
        member_role: m.member_role,
        avatar_url: m.avatar_url || null,
        gender: m.gender || "L",
        default_avatar: DEFAULT_AVATAR_URL,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/chat/conversations/[id]/members error:", error);
    return NextResponse.json(
      { error: "Gagal memuat anggota percakapan." },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const body = await req.json();
    const { user_ids } = body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { error: "Pilih setidaknya satu user untuk ditambahkan." },
        { status: 400 }
      );
    }

    // Verify current user is admin of the conversation
    const checkAdmin = await sql`
      SELECT role FROM conversation_members
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (checkAdmin.length === 0 || checkAdmin[0].role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin grup yang dapat menambahkan anggota." },
        { status: 403 }
      );
    }

    for (const uid of user_ids) {
      await sql`
        INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at, joined_at)
        VALUES (${conversationId}, ${Number(uid)}, 'member', (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
        ON CONFLICT (conversation_id, user_id) DO NOTHING
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Anggota berhasil ditambahkan.",
    });
  } catch (error: any) {
    console.error("POST /api/chat/conversations/[id]/members error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan anggota ke grup." },
      { status: 500 }
    );
  }
}

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
    const { searchParams } = new URL(req.url);
    const targetUserIdRaw = searchParams.get("user_id");
    const targetUserId = targetUserIdRaw ? parseInt(targetUserIdRaw) : user.id;

    // Check permissions: either leaving self, or admin removing someone
    if (targetUserId !== user.id) {
      const checkAdmin = await sql`
        SELECT role FROM conversation_members
        WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
        LIMIT 1
      `;
      if (checkAdmin.length === 0 || checkAdmin[0].role !== "admin") {
        return NextResponse.json(
          { error: "Hanya admin yang dapat mengeluarkan anggota lain." },
          { status: 403 }
        );
      }
    }

    await sql`
      DELETE FROM conversation_members
      WHERE conversation_id = ${conversationId} AND user_id = ${targetUserId}
    `;

    return NextResponse.json({
      success: true,
      message:
        targetUserId === user.id
          ? "Anda berhasil keluar dari grup."
          : "Anggota berhasil dikeluarkan dari grup.",
    });
  } catch (error: any) {
    console.error("DELETE /api/chat/conversations/[id]/members error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pengeluaran anggota." },
      { status: 500 }
    );
  }
}
