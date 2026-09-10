import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kelasrpl-jwt-secret-key-2026-smk17jkt"
);
const CONTROL_PASSWORD = process.env.CONTROL_PASSWORD || "230191";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password !== CONTROL_PASSWORD) {
      return NextResponse.json(
        { error: "Security Code / Password salah. Akses ditolak." },
        { status: 401 }
      );
    }

    const token = await new SignJWT({ control_authenticated: true })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("12h")
      .sign(JWT_SECRET);

    const res = NextResponse.json({
      success: true,
      message: "Otentikasi Berhasil. Selamat datang di Server Control Room.",
    });

    res.cookies.set("control_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan." }, { status: 500 });
  }
}
