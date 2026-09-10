import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, createSessionToken, AuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "NIS/Nama dan Password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = String(identifier).trim();

    // Query user by nis or name or email
    const users = await sql`
      SELECT id, name, nis, email, password, role, gender
      FROM users
      WHERE nis = ${trimmedIdentifier}
         OR LOWER(name) = LOWER(${trimmedIdentifier})
         OR LOWER(email) = LOWER(${trimmedIdentifier})
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Kredensial yang dimasukkan tidak cocok dengan data kami." },
        { status: 401 }
      );
    }

    const user = users[0];

    // Verify bcrypt password from Laravel DB
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { error: "Password salah. Silakan coba lagi." },
        { status: 401 }
      );
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      nis: user.nis,
      email: user.email,
      role: user.role || "student",
      gender: user.gender,
    };

    const token = await createSessionToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      redirect: "/dashboard",
    });

    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }
}
