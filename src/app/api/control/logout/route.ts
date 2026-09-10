import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true, redirect: "/control" });
  res.cookies.delete("control_token");
  return res;
}
