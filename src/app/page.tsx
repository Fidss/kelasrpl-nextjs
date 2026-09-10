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

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">
        <Hero />
        <AboutStats totalStudents={students.length} />
        <MemberGrid students={students} />
        <OurMemories />
        <Values />
        <ClassSchedule />
      </main>
      <Footer />
    </div>
  );
}
