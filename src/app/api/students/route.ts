import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    const students = await sql`
      SELECT id, name, nis, gender, role
      FROM users
      WHERE role != 'admin'
      ORDER BY name ASC
    `;
    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error("Fetch students error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data siswa." },
      { status: 500 }
    );
  }
}
