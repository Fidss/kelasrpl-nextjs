import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import KasKelasClient from "./KasKelasClient";

function getJakartaDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  }).format(new Date());
}

export default async function KasKelasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch settings
  const settingsRows = await sql`
    SELECT weekly_nominal, total_weeks FROM kas_settings LIMIT 1
  `;
  const weeklyNominal = settingsRows.length > 0 ? Number(settingsRows[0].weekly_nominal) : 5000;
  const totalWeeks = settingsRows.length > 0 ? Number(settingsRows[0].total_weeks) : 4;

  // 2. Fetch students
  const dbStudents = await sql`
    SELECT id, name, nis, gender, role
    FROM users
    WHERE role != 'admin' AND role != 'teacher'
    ORDER BY name ASC
  `;

  // 3. Fetch all payments
  const payments = await sql`
    SELECT id, student_id, week_number, nominal, paid_at, recorded_by_name, notes
    FROM kas_payments
    ORDER BY week_number ASC
  `;

  const studentPaymentMap = new Map<number, { week: number; nominal: number; paid_at: string }[]>();
  let totalKasSiswa = 0;

  for (const p of payments) {
    const sId = Number(p.student_id);
    if (!studentPaymentMap.has(sId)) {
      studentPaymentMap.set(sId, []);
    }
    const nom = Number(p.nominal) || weeklyNominal;
    totalKasSiswa += nom;
    studentPaymentMap.get(sId)!.push({
      week: Number(p.week_number),
      nominal: nom,
      paid_at: p.paid_at ? new Date(p.paid_at).toISOString() : "",
    });
  }

  let paidStudentsCount = 0;
  let arrearsStudentsCount = 0;
  let totalArrearsAmount = 0;

  const students = dbStudents.map((s) => {
    const sId = Number(s.id);
    const studentPaidList = studentPaymentMap.get(sId) || [];
    const paidWeeks = studentPaidList.map((p) => p.week);
    const totalPaid = studentPaidList.reduce((sum, p) => sum + p.nominal, 0);

    let missingWeeks = 0;
    for (let w = 1; w <= totalWeeks; w++) {
      if (!paidWeeks.includes(w)) {
        missingWeeks++;
      }
    }

    const arrearsAmount = missingWeeks * weeklyNominal;
    const isLunas = missingWeeks === 0;

    if (isLunas) {
      paidStudentsCount++;
    } else {
      arrearsStudentsCount++;
      totalArrearsAmount += arrearsAmount;
    }

    return {
      id: sId,
      name: String(s.name || ""),
      nis: String(s.nis || "-"),
      gender: String(s.gender || "L"),
      role: String(s.role || "student"),
      paidWeeks,
      totalPaid,
      missingWeeksCount: missingWeeks,
      arrearsAmount,
      isLunas,
    };
  });

  // 4. Fetch transactions
  const transactions = await sql`
    SELECT id, type, category, title, amount, transaction_date, recorded_by_name, description, proof_url, created_at
    FROM kas_transactions
    ORDER BY transaction_date DESC, id DESC
    LIMIT 100
  `;

  let totalOtherIncome = 0;
  let totalExpenses = 0;

  const formattedTransactions = transactions.map((t) => {
    const amount = Number(t.amount) || 0;
    if (t.type === "income") {
      totalOtherIncome += amount;
    } else if (t.type === "expense") {
      totalExpenses += amount;
    }

    return {
      id: Number(t.id),
      type: String(t.type),
      category: String(t.category || "lainnya"),
      title: String(t.title),
      amount,
      transaction_date: t.transaction_date
        ? typeof t.transaction_date === "string"
          ? t.transaction_date
          : t.transaction_date.toISOString().split("T")[0]
        : getJakartaDate(),
      recorded_by_name: t.recorded_by_name ? String(t.recorded_by_name) : "Bendahara Kelas",
      description: t.description ? String(t.description) : null,
      proof_url: t.proof_url ? String(t.proof_url) : null,
      created_at: t.created_at ? new Date(t.created_at).toISOString() : null,
    };
  });

  const totalPemasukan = totalKasSiswa + totalOtherIncome;
  const totalSaldo = totalPemasukan - totalExpenses;
  const canManage = user.role === "bendahara" || user.role === "admin";

  const initialData = {
    user: {
      id: user.id,
      name: user.name,
      nis: user.nis,
      role: user.role,
    },
    canManage,
    settings: {
      weeklyNominal,
      totalWeeks,
    },
    stats: {
      totalSaldo,
      totalPemasukan,
      totalKasSiswa,
      totalOtherIncome,
      totalExpenses,
      totalStudents: students.length,
      paidStudentsCount,
      arrearsStudentsCount,
      totalArrearsAmount,
    },
    students,
    transactions: formattedTransactions,
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar user={user} />
      <main className="flex-1 pt-16">
        <KasKelasClient initialData={initialData} />
      </main>
      <Footer />
    </div>
  );
}
