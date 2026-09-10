import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 15;
    const offset = (page - 1) * limit;

    const recipient = searchParams.get("recipient");
    const type = searchParams.get("type");

    let items;
    let countResult;

    if (recipient && type) {
      items = await sql`
        SELECT m.*, m.created_at::text as created_at_raw, u.name as recipient_name, u.gender as recipient_gender
        FROM menfesses m
        JOIN users u ON m.recipient_id = u.id
        WHERE m.recipient_id = ${parseInt(recipient)} AND m.type = ${type}
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT count(*) FROM menfesses
        WHERE recipient_id = ${parseInt(recipient)} AND type = ${type}
      `;
    } else if (recipient) {
      items = await sql`
        SELECT m.*, m.created_at::text as created_at_raw, u.name as recipient_name, u.gender as recipient_gender
        FROM menfesses m
        JOIN users u ON m.recipient_id = u.id
        WHERE m.recipient_id = ${parseInt(recipient)}
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT count(*) FROM menfesses
        WHERE recipient_id = ${parseInt(recipient)}
      `;
    } else if (type) {
      items = await sql`
        SELECT m.*, m.created_at::text as created_at_raw, u.name as recipient_name, u.gender as recipient_gender
        FROM menfesses m
        JOIN users u ON m.recipient_id = u.id
        WHERE m.type = ${type}
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`
        SELECT count(*) FROM menfesses
        WHERE type = ${type}
      `;
    } else {
      items = await sql`
        SELECT m.*, m.created_at::text as created_at_raw, u.name as recipient_name, u.gender as recipient_gender
        FROM menfesses m
        JOIN users u ON m.recipient_id = u.id
        ORDER BY m.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countResult = await sql`SELECT count(*) FROM menfesses`;
    }

    const total = parseInt(countResult[0]?.count || "0");
    const totalPages = Math.ceil(total / limit);

    const mappedItems = items.map((m) => {
      let createdIso = "";
      if (m.created_at_raw) {
        createdIso = m.created_at_raw.replace(" ", "T").split(".")[0] + "+07:00";
      } else if (m.created_at instanceof Date) {
        createdIso = m.created_at.toISOString();
      } else {
        createdIso = String(m.created_at || "");
      }

      return {
        id: m.id,
        recipient_id: m.recipient_id,
        recipient_name: m.recipient_name,
        sender_name: m.sender_name,
        is_anonymous: Boolean(m.is_anonymous),
        message: m.message,
        type: m.type,
        song_title: m.song_title,
        song_artist: m.song_artist,
        song_album_art: m.song_album_art,
        song_preview_url: m.song_preview_url,
        is_read: Boolean(m.is_read),
        created_at: createdIso,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Menfess fetch error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar pesan menfess." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient_id,
      sender_name,
      is_anonymous,
      message,
      type = "menfess",
      song_title,
      song_artist,
      song_album_art,
      song_track_id,
      song_preview_url,
    } = body;

    if (!recipient_id) {
      return NextResponse.json(
        { error: "Penerima wajib dipilih." },
        { status: 400 }
      );
    }

    if (!message || message.trim().length < 3) {
      return NextResponse.json(
        { error: "Pesan minimal 3 karakter." },
        { status: 400 }
      );
    }

    const anon = is_anonymous === true || !sender_name || !sender_name.trim();
    const cleanSenderName = anon ? "Anonim" : sender_name.trim().slice(0, 50);
    const cleanMessage = message.trim().slice(0, 1000);
    const cleanType = type === "songfess" ? "songfess" : "menfess";

    const now = new Date();

    const result = await sql`
      INSERT INTO menfesses (
        recipient_id,
        sender_name,
        is_anonymous,
        message,
        type,
        song_title,
        song_artist,
        song_album_art,
        song_track_id,
        song_preview_url,
        is_read,
        created_at,
        updated_at
      ) VALUES (
        ${parseInt(recipient_id)},
        ${cleanSenderName},
        ${anon},
        ${cleanMessage},
        ${cleanType},
        ${cleanType === "songfess" ? song_title || null : null},
        ${cleanType === "songfess" ? song_artist || null : null},
        ${cleanType === "songfess" ? song_album_art || null : null},
        ${cleanType === "songfess" ? song_track_id || null : null},
        ${cleanType === "songfess" ? song_preview_url || null : null},
        false,
        (NOW() AT TIME ZONE 'Asia/Jakarta'),
        (NOW() AT TIME ZONE 'Asia/Jakarta')
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      message: "Menfess berhasil dikirimkan!",
      id: result[0]?.id,
    });
  } catch (error: any) {
    console.error("Menfess submit error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan pesan." },
      { status: 500 }
    );
  }
}
