import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();

    let users;
    if (query) {
      const searchPattern = `%${query}%`;
      users = await sql`
        SELECT id, name, nis, role, gender, avatar_url, bio
        FROM users
        WHERE id != ${Number(user.id)}
          AND (LOWER(name) LIKE ${searchPattern} OR nis LIKE ${searchPattern})
        ORDER BY name ASC
        LIMIT 100
      `;
    } else {
      users = await sql`
        SELECT id, name, nis, role, gender, avatar_url, bio
        FROM users
        WHERE id != ${Number(user.id)}
        ORDER BY 
          CASE 
            WHEN role = 'teacher' THEN 1
            WHEN role IN ('ketuakelas', 'wakilketuakelas') THEN 2
            WHEN role = 'admin' THEN 3
            ELSE 4
          END,
          name ASC
        LIMIT 100
      `;
    }

    const mappedUsers = users.map((u: any) => ({
      id: Number(u.id),
      name: String(u.name || ""),
      nis: String(u.nis || "-"),
      role: String(u.role || "student"),
      gender: String(u.gender || "L"),
      avatar_url: u.avatar_url || null,
      bio: u.bio || "",
      default_avatar: DEFAULT_AVATAR_URL,
    }));

    return NextResponse.json({
      success: true,
      users: mappedUsers,
    });
  } catch (error: any) {
    console.error("GET /api/chat/users error:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar kontak teman." },
      { status: 500 }
    );
  }
}
