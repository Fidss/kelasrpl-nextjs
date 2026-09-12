import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import AboutStats from "@/components/landing/AboutStats";
import MemberGrid from "@/components/landing/MemberGrid";
import OurMemories from "@/components/landing/OurMemories";
import Values from "@/components/landing/Values";
import ClassSchedule from "@/components/landing/ClassSchedule";
import Footer from "@/components/layout/Footer";
import { students } from "@/data/students";
import { getCurrentUser } from "@/lib/auth";

import { sql } from "@/lib/db";

export default async function Home() {
  const user = await getCurrentUser();

  let studentRoster = students;
  try {
    const dbUsers = await sql`
      SELECT id, name, nis, gender, avatar_url
      FROM users
      WHERE role != 'admin' AND role != 'teacher'
    `;
    const userMap = new Map(
      dbUsers.map((u: any) => [String(u.nis || "").trim(), u])
    );
    const nameMap = new Map(
      dbUsers.map((u: any) => [String(u.name || "").trim().toUpperCase(), u])
    );

    studentRoster = students.map((s) => {
      const dbMatch =
        userMap.get(String(s.nis).trim()) ||
        nameMap.get(String(s.name).trim().toUpperCase());
      return {
        ...s,
        id: dbMatch ? Number(dbMatch.id) : undefined,
        avatar_url: dbMatch?.avatar_url || null,
      };
    });
  } catch (error) {
    console.error("Home page student avatar fetch error:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">
        <Hero />
        <AboutStats totalStudents={studentRoster.length} />
        <MemberGrid students={studentRoster} />
        <OurMemories />
        <Values />
        <ClassSchedule />
      </main>
      <Footer />
    </div>
  );
}
