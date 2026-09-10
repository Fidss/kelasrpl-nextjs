import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const IMGBB_API_KEY = "a2419e396e72719a75b431c80febc0c4";

function safeNormalizeImgbbUrl(url: string): string {
  if (!url) return "";
  return url.replace(/ibb\.co(\.com)*/g, "ibb.co.com");
}

// GET /api/memories
// Returns list of memories ordered by created_at DESC
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("user_id");

    let rows;
    if (userIdParam) {
      rows = await sql`
        SELECT id, user_id, user_name, title, tag, date, description, image_url, created_at
        FROM memories
        WHERE user_id = ${parseInt(userIdParam)}
        ORDER BY created_at DESC, id DESC
      `;
    } else {
      rows = await sql`
        SELECT id, user_id, user_name, title, tag, date, description, image_url, created_at
        FROM memories
        ORDER BY created_at DESC, id DESC
      `;
    }

    const data = rows.map((m) => {
      // Ensure ibb.co is cleanly replaced with ibb.co.com
      const safeImage = safeNormalizeImgbbUrl(m.image_url || "");

      return {
        id: Number(m.id),
        title: m.title,
        tag: m.tag || "Memori Siswa",
        date: m.date || "2026",
        desc: m.description || "",
        image: safeImage,
        user_id: m.user_id ? Number(m.user_id) : null,
        user_name: m.user_name || "Anggota Kelas",
        created_at: m.created_at ? new Date(m.created_at).toISOString() : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Fetch memories error:", error);
    return NextResponse.json(
      { error: "Gagal memuat data kenangan kelas." },
      { status: 500 }
    );
  }
}

// POST /api/memories
// Authenticated endpoint to upload image to ImgBB and save memory record
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu untuk menambah kenangan." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const title = (formData.get("title") as string || "").trim();
    const tag = (formData.get("tag") as string || "Memori Siswa").trim();
    const description = (formData.get("description") as string || "").trim();

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: "File foto kenangan wajib diunggah." },
        { status: 400 }
      );
    }

    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: "Judul kenangan minimal 2 karakter." },
        { status: 400 }
      );
    }

    // Limit file size to 15MB
    if (imageFile.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 15 MB." },
        { status: 400 }
      );
    }

    // Convert file to base64 for ImgBB upload
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Upload to ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append("image", base64Image);
    imgbbForm.append("name", title.slice(0, 60));

    const imgbbRes = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: imgbbForm,
      }
    );

    const imgbbData = await imgbbRes.json();
    if (!imgbbRes.ok || !imgbbData?.data?.url) {
      console.error("ImgBB upload error response:", imgbbData);
      return NextResponse.json(
        {
          error:
            imgbbData?.error?.message ||
            "Gagal mengunggah foto ke storage ImgBB.",
        },
        { status: 502 }
      );
    }

    // CRITICAL: Replace ibb.co with ibb.co.com for ISP compatibility in Indonesia
    const rawUrl: string = imgbbData.data.url;
    const imageUrl = safeNormalizeImgbbUrl(rawUrl);
    const rawDeleteUrl: string = imgbbData.data.delete_url || "";
    const deleteUrl = rawDeleteUrl ? safeNormalizeImgbbUrl(rawDeleteUrl) : null;

    // Generate formatted Indonesian date (e.g. "September 2026")
    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(now);

    // Insert into Postgres
    const insertResult = await sql`
      INSERT INTO memories (
        user_id,
        user_name,
        title,
        tag,
        date,
        description,
        image_url,
        delete_url
      ) VALUES (
        ${user.id},
        ${user.name},
        ${title},
        ${tag || "Memori Siswa"},
        ${formattedDate},
        ${description},
        ${imageUrl},
        ${deleteUrl}
      )
      RETURNING id, user_id, user_name, title, tag, date, description, image_url, created_at
    `;

    const newRecord = insertResult[0];

    return NextResponse.json({
      success: true,
      message: "Kenangan berhasil ditambahkan ke landing page!",
      data: {
        id: Number(newRecord.id),
        title: newRecord.title,
        tag: newRecord.tag,
        date: newRecord.date,
        desc: newRecord.description || "",
        image: newRecord.image_url,
        user_id: Number(newRecord.user_id),
        user_name: newRecord.user_name,
        created_at: newRecord.created_at,
      },
    });
  } catch (error: any) {
    console.error("Create memory error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menyimpan kenangan." },
      { status: 500 }
    );
  }
}
