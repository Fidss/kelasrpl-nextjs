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

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 1. Fetch conversations the current user is a member of
    const convRows = await sql`
      SELECT 
        c.id,
        c.type,
        c.name,
        c.avatar_url,
        c.description,
        c.created_by,
        c.last_message_at,
        c.created_at,
        cm.role as my_role,
        cm.last_read_at
      FROM conversations c
      JOIN conversation_members cm ON c.id = cm.conversation_id
      WHERE cm.user_id = ${Number(user.id)}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    `;

    if (convRows.length === 0) {
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    const convIds = convRows.map((c: any) => Number(c.id));

    // 2. Fetch last message for each conversation
    const lastMsgRows = await sql`
      SELECT DISTINCT ON (m.conversation_id)
        m.id as message_id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.media_url,
        m.media_type,
        m.created_at,
        u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ANY(${convIds})
      ORDER BY m.conversation_id, m.created_at DESC
    `;
    const lastMsgMap = new Map(
      lastMsgRows.map((m: any) => [Number(m.conversation_id), m])
    );

    // 3. Fetch members for all direct conversations and member counts for groups
    const membersRows = await sql`
      SELECT 
        cm.conversation_id,
        cm.user_id,
        cm.role,
        u.name,
        u.nis,
        u.avatar_url,
        u.gender,
        u.role as user_role
      FROM conversation_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.conversation_id = ANY(${convIds})
    `;

    // Group members by conversation_id
    const membersByConv = new Map<number, any[]>();
    for (const m of membersRows) {
      const cId = Number(m.conversation_id);
      if (!membersByConv.has(cId)) membersByConv.set(cId, []);
      membersByConv.get(cId)!.push(m);
    }

    // 4. Calculate unread counts for each conversation
    const unreadRows = await sql`
      SELECT 
        m.conversation_id,
        COUNT(m.id)::int as unread_count
      FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE cm.user_id = ${Number(user.id)}
        AND m.sender_id != ${Number(user.id)}
        AND m.created_at > cm.last_read_at
        AND m.conversation_id = ANY(${convIds})
      GROUP BY m.conversation_id
    `;
    const unreadMap = new Map(
      unreadRows.map((u: any) => [Number(u.conversation_id), Number(u.unread_count || 0)])
    );

    // Build complete conversations list & deduplicate direct conversations by target user ID
    const seenDirectUserIds = new Set<number>();
    const conversations = [];

    for (const c of convRows) {
      const cId = Number(c.id);
      const isGroup = c.type === "group";
      const members = membersByConv.get(cId) || [];
      const otherMember = members.find((m: any) => Number(m.user_id) !== Number(user.id)) || null;
      const lastMsg = lastMsgMap.get(cId) || null;
      const unreadCount = unreadMap.get(cId) || 0;

      let title = c.name;
      let avatar = c.avatar_url;
      let targetUser = null;

      if (!isGroup && otherMember) {
        const targetId = Number(otherMember.user_id);
        if (seenDirectUserIds.has(targetId)) {
          // Skip older duplicate direct conversation
          continue;
        }
        seenDirectUserIds.add(targetId);

        title = otherMember.name;
        avatar = otherMember.avatar_url;
        targetUser = {
          id: targetId,
          name: otherMember.name,
          nis: otherMember.nis,
          role: otherMember.user_role,
          gender: otherMember.gender,
          avatar_url: otherMember.avatar_url,
          default_avatar: DEFAULT_AVATAR_URL,
        };
      }

      conversations.push({
        id: cId,
        type: c.type,
        name: title || (isGroup ? "Grup Tanpa Nama" : "Percakapan"),
        avatar_url: avatar || null,
        description: c.description || null,
        created_by: c.created_by ? Number(c.created_by) : null,
        my_role: c.my_role || "member",
        member_count: members.length,
        members: isGroup
          ? members.map((m: any) => ({
              user_id: Number(m.user_id),
              name: m.name,
              avatar_url: m.avatar_url,
              role: m.role,
            }))
          : [],
        target_user: targetUser,
        unread_count: unreadCount,
        last_message: lastMsg
          ? {
              id: Number(lastMsg.message_id),
              sender_id: Number(lastMsg.sender_id),
              sender_name: lastMsg.sender_name,
              content: lastMsg.content,
              media_url: lastMsg.media_url,
              media_type: lastMsg.media_type,
              created_at: lastMsg.created_at,
            }
          : null,
        last_message_at: c.last_message_at || c.created_at,
        created_at: c.created_at,
      });
    }

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error: any) {
    console.error("GET /api/chat/conversations error:", error);
    return NextResponse.json(
      { error: "Gagal memuat percakapan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let type: "direct" | "group" = "direct";
    let targetUserId: number | null = null;
    let groupName = "";
    let groupDesc = "";
    let groupAvatarUrl: string | null = null;
    let memberIds: number[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      type = (formData.get("type") as "direct" | "group") || "direct";
      const targetIdRaw = formData.get("target_user_id");
      if (targetIdRaw) targetUserId = parseInt(String(targetIdRaw));

      groupName = String(formData.get("name") || "").trim();
      groupDesc = String(formData.get("description") || "").trim();

      const memberIdsRaw = formData.get("member_ids");
      if (memberIdsRaw) {
        try {
          const parsed = JSON.parse(String(memberIdsRaw));
          if (Array.isArray(parsed)) memberIds = parsed.map(Number).filter(Boolean);
        } catch {
          memberIds = [];
        }
      }

      const photoFile = formData.get("photo") as File | null;
      if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Ukuran foto grup maksimal 10 MB." },
            { status: 400 }
          );
        }
        const arrayBuffer = await photoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("image", base64Image);
        imgbbForm.append("name", `group_avatar_${Date.now()}`);

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: imgbbForm,
          }
        );
        const imgbbData = await imgbbRes.json();
        if (imgbbRes.ok && imgbbData?.data?.url) {
          groupAvatarUrl = safeNormalizeImgbbUrl(imgbbData.data.url);
        }
      }
    } else {
      const body = await req.json();
      type = body.type || "direct";
      targetUserId = body.target_user_id ? Number(body.target_user_id) : null;
      groupName = String(body.name || "").trim();
      groupDesc = String(body.description || "").trim();
      groupAvatarUrl = body.avatar_url || null;
      memberIds = Array.isArray(body.member_ids) ? body.member_ids.map(Number).filter(Boolean) : [];
    }

    // 1. Direct 1-on-1 Conversation
    if (type === "direct") {
      if (!targetUserId) {
        return NextResponse.json(
          { error: "User tujuan wajib dipilih untuk memulai chat." },
          { status: 400 }
        );
      }

      if (Number(targetUserId) === Number(user.id)) {
        return NextResponse.json(
          { error: "Tidak dapat memulai chat dengan diri sendiri." },
          { status: 400 }
        );
      }

      const uid = Number(user.id);
      const tid = Number(targetUserId);

      // Check if direct conversation already exists between user.id and targetUserId
      const existingConv = await sql`
        SELECT c.id, c.type, c.created_at
        FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ${uid}
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ${tid}
        WHERE c.type = 'direct'
        LIMIT 1
      `;

      if (existingConv.length > 0) {
        const convId = Number(existingConv[0].id);
        return NextResponse.json({
          success: true,
          isNew: false,
          conversation_id: convId,
        });
      }

      // Create new direct conversation
      const newConv = await sql`
        INSERT INTO conversations (type, created_by, last_message_at, created_at, updated_at)
        VALUES ('direct', ${uid}, (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
        RETURNING id
      `;
      const convId = Number(newConv[0].id);

      // Insert both users into conversation_members
      await sql`
        INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at, joined_at)
        VALUES 
          (${convId}, ${uid}, 'member', (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta')),
          (${convId}, ${tid}, 'member', (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
        ON CONFLICT (conversation_id, user_id) DO NOTHING
      `;

      return NextResponse.json({
        success: true,
        isNew: true,
        conversation_id: convId,
      });
    }

    // 2. Group Conversation
    if (type === "group") {
      if (!groupName || groupName.length < 2) {
        return NextResponse.json(
          { error: "Nama grup minimal 2 karakter." },
          { status: 400 }
        );
      }

      // Create new group conversation
      const newGroup = await sql`
        INSERT INTO conversations (
          type, 
          name, 
          avatar_url, 
          description, 
          created_by, 
          last_message_at, 
          created_at, 
          updated_at
        )
        VALUES (
          'group',
          ${groupName},
          ${groupAvatarUrl},
          ${groupDesc || null},
          ${Number(user.id)},
          (NOW() AT TIME ZONE 'Asia/Jakarta'),
          (NOW() AT TIME ZONE 'Asia/Jakarta'),
          (NOW() AT TIME ZONE 'Asia/Jakarta')
        )
        RETURNING id
      `;
      const convId = Number(newGroup[0].id);

      // Insert creator as admin
      await sql`
        INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at, joined_at)
        VALUES (${convId}, ${Number(user.id)}, 'admin', (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
      `;

      // Insert other members
      const uniqueMemberIds = Array.from(new Set(memberIds)).filter((id) => Number(id) !== Number(user.id));
      for (const mId of uniqueMemberIds) {
        await sql`
          INSERT INTO conversation_members (conversation_id, user_id, role, last_read_at, joined_at)
          VALUES (${convId}, ${Number(mId)}, 'member', (NOW() AT TIME ZONE 'Asia/Jakarta'), (NOW() AT TIME ZONE 'Asia/Jakarta'))
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `;
      }

      // Insert welcome message
      await sql`
        INSERT INTO messages (conversation_id, sender_id, content, created_at, updated_at)
        VALUES (
          ${convId},
          ${Number(user.id)},
          ${`🎉 Grup "${groupName}" berhasil dibuat.`},
          (NOW() AT TIME ZONE 'Asia/Jakarta'),
          (NOW() AT TIME ZONE 'Asia/Jakarta')
        )
      `;

      return NextResponse.json({
        success: true,
        isNew: true,
        conversation_id: convId,
        message: "Grup berhasil dibuat!",
      });
    }

    return NextResponse.json(
      { error: "Tipe percakapan tidak valid." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("POST /api/chat/conversations error:", error);
    return NextResponse.json(
      { error: "Gagal membuat percakapan." },
      { status: 500 }
    );
  }
}
