import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { sql } from "@/lib/db";
import ControlClient from "./ControlClient";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kelasrpl-jwt-secret-key-2026-smk17jkt"
);

export default async function ControlPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("control_token")?.value;

  let authenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      authenticated = true;
    } catch {
      authenticated = false;
    }
  }

  if (!authenticated) {
    return <ControlClient authenticated={false} />;
  }

  // Fetch stats from Supabase PostgreSQL
  const today = new Date().toISOString().split("T")[0];

  const userCountRes = await sql`SELECT count(*) FROM users`;
  const chatCountRes = await sql`SELECT count(*) FROM chat_messages`;
  const attendCountRes = await sql`SELECT count(*) FROM attendances WHERE date = ${today}`;
  const controlRes = await sql`SELECT * FROM system_controls WHERE id = 1 LIMIT 1`;

  const stats = {
    totalUsers: parseInt(userCountRes[0]?.count || "0"),
    totalChats: parseInt(chatCountRes[0]?.count || "0"),
    todayAttendance: parseInt(attendCountRes[0]?.count || "0"),
    dbStatus: "ONLINE",
    dbHost: "aws-0-ap-southeast-1.pooler.supabase.com",
    framework: "Next.js 16 (App Router)",
  };

  const control = controlRes[0] || {
    is_shutdown: false,
    mode: "normal",
    title: "Server Sedang Berjalan Normal",
    message: "Layanan berjalan stabil.",
  };

  return (
    <ControlClient
      authenticated={true}
      stats={stats}
      control={{
        is_shutdown: Boolean(control.is_shutdown),
        mode: control.mode || "normal",
        title: control.title || "",
        message: control.message || "",
      }}
    />
  );
}
