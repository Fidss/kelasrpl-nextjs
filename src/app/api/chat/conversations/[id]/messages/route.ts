import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const IMGBB_API_KEY = "a2419e396e72719a75b431c80febc0c4";
export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

function safeNormalizeImgbbUrl(url: string): string {
  if (!url) return "";
  return url.replace(/ibb\.co(\.com)*/g, "ibb.co.com");
}

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

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "ID percakapan tidak valid." },
        { status: 400 }
      );
    }

    // 1. Verify user is a member
    const membership = await sql`
      SELECT id, role, last_read_at
      FROM conversation_members
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Anda bukan anggota dari percakapan ini." },
        { status: 403 }
      );
    }

    // 2. Update last_read_at for current user
    await sql`
      UPDATE conversation_members
      SET last_read_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
    `;

    // 3. Fetch conversation details
    const convRows = await sql`
      SELECT id, type, name, avatar_url, description, created_by, created_at
      FROM conversations
      WHERE id = ${conversationId}
      LIMIT 1
    `;

    if (convRows.length === 0) {
      return NextResponse.json(
        { error: "Percakapan tidak ditemukan." },
        { status: 404 }
      );
    }
    const conv = convRows[0];

    // 4. Fetch members
    const memberRows = await sql`
      SELECT 
        cm.user_id,
        cm.role as member_role,
        cm.joined_at,
        u.name,
        u.nis,
        u.avatar_url,
        u.gender,
        u.role as user_role
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ${conversationId}
      ORDER BY 
        CASE WHEN cm.role = 'admin' THEN 1 ELSE 2 END,
        u.name ASC
    `;

    const isGroup = conv.type === "group";
    const otherMember = !isGroup
      ? memberRows.find((m: any) => Number(m.user_id) !== Number(user.id)) || null
      : null;

    let title = conv.name;
    let avatar = conv.avatar_url;

    if (!isGroup && otherMember) {
      title = otherMember.name;
      avatar = otherMember.avatar_url;
    }

    // 5. Fetch messages with cursor-based pagination
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get("limit") || "40");
    const limit = Math.min(Math.max(limitParam, 1), 100); // clamp 1-100
    const beforeId = url.searchParams.get("before"); // load older messages
    const afterId = url.searchParams.get("after"); // poll for new messages only

    let messageRows: any[];
    let hasMore = false;

    if (afterId && !isNaN(parseInt(afterId))) {
      // POLLING MODE: only fetch messages newer than the given ID
      const afterIdNum = parseInt(afterId);
      messageRows = await sql`
        SELECT 
          m.id, m.conversation_id, m.sender_id, m.content,
          m.media_url, m.media_type, m.is_edited, m.created_at,
          u.name as sender_name, u.avatar_url as sender_avatar,
          u.role as sender_role, u.gender as sender_gender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId}
          AND m.id > ${afterIdNum}
        ORDER BY m.created_at ASC, m.id ASC
        LIMIT 100
      `;
      // In polling mode, has_more is always false (we get all new)
      hasMore = false;
    } else if (beforeId && !isNaN(parseInt(beforeId))) {
      // LOAD OLDER: fetch messages older than cursor
      const beforeIdNum = parseInt(beforeId);
      // Fetch limit+1 to check if there are more
      const rawRows = await sql`
        SELECT 
          m.id, m.conversation_id, m.sender_id, m.content,
          m.media_url, m.media_type, m.is_edited, m.created_at,
          u.name as sender_name, u.avatar_url as sender_avatar,
          u.role as sender_role, u.gender as sender_gender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId}
          AND m.id < ${beforeIdNum}
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT ${limit + 1}
      `;
      hasMore = rawRows.length > limit;
      messageRows = (hasMore ? rawRows.slice(0, limit) : rawRows).reverse();
    } else {
      // INITIAL LOAD: fetch latest N messages
      // Fetch limit+1 to check if there are older messages
      const rawRows = await sql`
        SELECT 
          m.id, m.conversation_id, m.sender_id, m.content,
          m.media_url, m.media_type, m.is_edited, m.created_at,
          u.name as sender_name, u.avatar_url as sender_avatar,
          u.role as sender_role, u.gender as sender_gender
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ${conversationId}
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT ${limit + 1}
      `;
      hasMore = rawRows.length > limit;
      messageRows = (hasMore ? rawRows.slice(0, limit) : rawRows).reverse();
    }

    const messages = messageRows.map((m: any) => ({
      id: Number(m.id),
      conversation_id: Number(m.conversation_id),
      sender_id: Number(m.sender_id),
      sender_name: m.sender_name,
      sender_avatar: m.sender_avatar || null,
      sender_role: m.sender_role || "student",
      sender_gender: m.sender_gender || "L",
      content: m.content || "",
      media_url: m.media_url ? safeNormalizeImgbbUrl(m.media_url) : null,
      media_type: m.media_type || null,
      is_me: Number(m.sender_id) === Number(user.id),
      is_edited: Boolean(m.is_edited),
      created_at: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
    }));

    // Only include full conversation details on initial load (no afterId)
    const includeConvDetails = !afterId;

    return NextResponse.json({
      success: true,
      has_more: hasMore,
      ...(includeConvDetails ? {
        conversation: {
          id: Number(conv.id),
          type: conv.type,
          name: title || (isGroup ? "Grup Tanpa Nama" : "Percakapan"),
          avatar_url: avatar || null,
          description: conv.description || null,
          created_by: conv.created_by ? Number(conv.created_by) : null,
          is_admin: membership[0].role === "admin",
          member_count: memberRows.length,
          members: memberRows.map((m: any) => ({
            user_id: Number(m.user_id),
            name: m.name,
            nis: m.nis,
            role: m.user_role,
            member_role: m.member_role,
            avatar_url: m.avatar_url || null,
            gender: m.gender || "L",
            default_avatar: DEFAULT_AVATAR_URL,
          })),
          target_user: otherMember
            ? {
                id: Number(otherMember.user_id),
                name: otherMember.name,
                nis: otherMember.nis,
                role: otherMember.user_role,
                gender: otherMember.gender,
                avatar_url: otherMember.avatar_url || null,
                default_avatar: DEFAULT_AVATAR_URL,
              }
            : null,
        },
      } : {}),
      messages,
    });
  } catch (error: any) {
    console.error("GET /api/chat/conversations/[id]/messages error:", error);
    return NextResponse.json(
      { error: "Gagal memuat pesan percakapan." },
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

    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "ID percakapan tidak valid." },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await sql`
      SELECT id
      FROM conversation_members
      WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
      LIMIT 1
    `;

    if (membership.length === 0) {
      return NextResponse.json(
        { error: "Anda bukan anggota dari percakapan ini." },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let content = "";
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      content = String(formData.get("content") || "").trim();

      const photoFile = formData.get("photo") as File | null;
      if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 15 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Ukuran gambar maksimal 15 MB." },
            { status: 400 }
          );
        }

        const arrayBuffer = await photoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("image", base64Image);
        imgbbForm.append("name", `chat_media_${conversationId}_${Date.now()}`);

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: imgbbForm,
          }
        );

        const imgbbData = await imgbbRes.json();
        if (imgbbRes.ok && imgbbData?.data?.url) {
          mediaUrl = safeNormalizeImgbbUrl(imgbbData.data.url);
          mediaType = "image";
        } else {
          console.error("ImgBB chat media upload failed:", imgbbData);
        }
      }
    } else {
      const body = await req.json();
      content = String(body.content || "").trim();
      mediaUrl = body.media_url ? safeNormalizeImgbbUrl(body.media_url) : null;
      mediaType = body.media_type || (mediaUrl ? "image" : null);
    }

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // Insert message
    const inserted = await sql`
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content,
        media_url,
        media_type,
        created_at,
        updated_at
      )
      VALUES (
        ${conversationId},
        ${Number(user.id)},
        ${content},
        ${mediaUrl},
        ${mediaType},
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
      RETURNING id, created_at
    `;

    const msgId = Number(inserted[0].id);
    const createdAt = inserted[0].created_at;

    // Update conversation timestamp
    await sql`
      UPDATE conversations
      SET last_message_at = (NOW() AT TIME ZONE 'Asia/Jakarta'),
          updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      WHERE id = ${conversationId}
    `;

    // Also update sender's last_read_at
    await sql`
      UPDATE conversation_members
      SET last_read_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
      WHERE conversation_id = ${conversationId} AND user_id = ${Number(user.id)}
    `;

    return NextResponse.json({
      success: true,
      message: {
        id: msgId,
        conversation_id: conversationId,
        sender_id: Number(user.id),
        sender_name: user.name,
        sender_avatar: user.avatar_url || null,
        sender_role: user.role,
        content,
        media_url: mediaUrl,
        media_type: mediaType,
        is_me: true,
        created_at: new Date(createdAt).toISOString(),
      },
    });
  } catch (error: any) {
    console.error("POST /api/chat/conversations/[id]/messages error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim pesan." },
      { status: 500 }
    );
  }
}
