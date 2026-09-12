import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }

    // Fetch fresh user details from DB
    const dbUsers = await sql`
      SELECT id, nis, name, email, role, gender, avatar_url, bio
      FROM users
      WHERE id = ${user.id}
      LIMIT 1
    `;

    if (dbUsers.length === 0) {
      return NextResponse.json({ success: true, user: null });
    }

    const u = dbUsers[0];
    return NextResponse.json({
      success: true,
      user: {
        id: u.id,
        nis: u.nis,
        name: u.name,
        email: u.email,
        role: u.role,
        gender: u.gender,
        avatar_url: u.avatar_url || null,
        bio: u.bio || null,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, user: null });
  }
}
