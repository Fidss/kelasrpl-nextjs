import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kelasrpl-jwt-secret-key-2026-smk17jkt"
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected user routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/chatbot")) {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("session_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/chatbot/:path*"],
};
