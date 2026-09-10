import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      success: true,
      user: user
        ? {
            id: user.id,
            nis: user.nis,
            name: user.name,
            role: user.role,
            gender: user.gender,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, user: null });
  }
}
