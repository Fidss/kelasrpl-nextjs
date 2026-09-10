import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, redirect: "/" });
  response.cookies.delete("session_token");
  return response;
}
