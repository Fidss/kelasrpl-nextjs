import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser, createSessionToken, AuthUser } from "@/lib/auth";

const IMGBB_API_KEY = "a2419e396e72719a75b431c80febc0c4";
export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

function safeNormalizeImgbbUrl(url: string): string {
  if (!url) return "";
  return url.replace(/ibb\.co(\.com)*/g, "ibb.co.com");
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Anda harus login terlebih dahulu." },
        { status: 401 }
      );
    }

    const rows = await sql`
      SELECT id, name, nis, email, role, gender, avatar_url, bio
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const u = rows[0];
    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        nis: u.nis,
        email: u.email,
        role: u.role,
        gender: u.gender,
        avatar_url: u.avatar_url || null,
        bio: u.bio || "",
        default_avatar: DEFAULT_AVATAR_URL,
      },
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Gagal memuat profil user." },
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

    let newAvatarUrl: string | null = user.avatar_url || null;
    let newBio: string | null = user.bio || null;
    let shouldRemoveAvatar = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const photoFile = formData.get("photo") as File | null;
      const removeAvatar = formData.get("remove_avatar");
      const bioInput = formData.get("bio");

      if (bioInput !== null && bioInput !== undefined) {
        newBio = String(bioInput).trim().slice(0, 300);
      }

      if (removeAvatar === "true" || removeAvatar === "1") {
        shouldRemoveAvatar = true;
        newAvatarUrl = null;
      } else if (photoFile && photoFile.size > 0) {
        if (photoFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Ukuran foto maksimal 10 MB." },
            { status: 400 }
          );
        }

        const arrayBuffer = await photoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("image", base64Image);
        imgbbForm.append("name", `avatar_user_${user.id}_${Date.now()}`);

        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
          {
            method: "POST",
            body: imgbbForm,
          }
        );

        const imgbbData = await imgbbRes.json();
        if (!imgbbRes.ok || !imgbbData?.data?.url) {
          console.error("ImgBB avatar upload error:", imgbbData);
          return NextResponse.json(
            {
              error:
                imgbbData?.error?.message ||
                "Gagal mengunggah foto profil ke server gambar.",
            },
            { status: 502 }
          );
        }

        newAvatarUrl = safeNormalizeImgbbUrl(imgbbData.data.url);
      }
    } else {
      const body = await req.json();
      if (body.remove_avatar === true) {
        shouldRemoveAvatar = true;
        newAvatarUrl = null;
      } else if (body.avatar_url !== undefined) {
        newAvatarUrl = body.avatar_url ? String(body.avatar_url).trim() : null;
      }
      if (body.bio !== undefined) {
        newBio = body.bio ? String(body.bio).trim().slice(0, 300) : "";
      }
    }

    // Update database
    if (shouldRemoveAvatar) {
      await sql`
        UPDATE users
        SET avatar_url = NULL,
            bio = ${newBio},
            updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
        WHERE id = ${user.id}
      `;
      newAvatarUrl = null;
    } else {
      await sql`
        UPDATE users
        SET avatar_url = ${newAvatarUrl},
            bio = ${newBio},
            updated_at = (NOW() AT TIME ZONE 'Asia/Jakarta')
        WHERE id = ${user.id}
      `;
    }

    // Fetch updated user
    const updatedUsers = await sql`
      SELECT id, name, nis, email, role, gender, avatar_url, bio
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;
    const u = updatedUsers[0];

    const updatedAuthUser: AuthUser = {
      id: u.id,
      name: u.name,
      nis: u.nis,
      email: u.email,
      role: u.role || "student",
      gender: u.gender,
      avatar_url: u.avatar_url || null,
      bio: u.bio || null,
    };

    const token = await createSessionToken(updatedAuthUser);

    const response = NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui!",
      user: {
        id: u.id,
        name: u.name,
        nis: u.nis,
        email: u.email,
        role: u.role,
        gender: u.gender,
        avatar_url: u.avatar_url || null,
        bio: u.bio || "",
        default_avatar: DEFAULT_AVATAR_URL,
      },
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memperbarui profil." },
      { status: 500 }
    );
  }
}
