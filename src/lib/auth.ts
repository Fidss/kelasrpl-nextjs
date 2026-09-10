import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kelasrpl-jwt-secret-key-2026-smk17jkt"
);

export type UserRole =
  | "admin"
  | "teacher"
  | "student"
  | "ketuakelas"
  | "wakilketuakelas"
  | "sekertaris"
  | "bendahara"
  | "keamanan"
  | "kebersihan";

export interface AuthUser {
  id: number;
  name: string;
  nis: string;
  email: string | null;
  role: UserRole | string;
  gender: "L" | "P" | null;
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  // Laravel uses bcrypt format $2y$ which bcryptjs supports directly
  return bcrypt.compare(plain, hashed);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return (payload.user as AuthUser) || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
