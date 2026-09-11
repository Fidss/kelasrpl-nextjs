"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Settings,
  Receipt,
  FileText,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Shield,
  Crown,
  Sparkles,
  Award,
  UserCheck,
  Coins,
  RefreshCw,
} from "lucide-react";

const ROLE_ICONS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  admin: Shield,
  teacher: Award,
  ketuakelas: Crown,
  wakilketuakelas: Sparkles,
  bendahara: Wallet,
  kebersihan: Users,
  student: UserCheck,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin Kelas",
  teacher: "Guru / Wali Kelas",
  ketuakelas: "Ketua Kelas",
  wakilketuakelas: "Wakil Ketua Kelas",
  bendahara: "Bendahara Kelas",
  kebersihan: "Seksi Kebersihan",
  student: "Murid (Siswa)",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  teacher: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
  ketuakelas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  wakilketuakelas: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  bendahara: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  kebersihan: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  student: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
};

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  kas_siswa: { label: "Kas Siswa", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300" },
  donasi: { label: "Donasi / Sponsor", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300" },
  kebersihan: { label: "Alat Kebersihan", color: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300" },
  alat_tulis: { label: "ATK / Spidol", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300" },
  fotokopi: { label: "Fotokopi & Modul", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300" },
  konsumsi: { label: "Konsumsi / Snack", color: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300" },
  acara: { label: "Kegiatan / Lomba", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300" },
  lainnya: { label: "Keperluan Lain", color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300" },
};

interface StudentItem {
  id: number;
  name: string;
  nis: string;
  gender: string;
  role: string;
  paidWeeks: number[];
  totalPaid: number;
  missingWeeksCount: number;
  arrearsAmount: number;
  isLunas: boolean;
}

interface TransactionItem {
  id: number;
  type: string;
  category: string;
  title: string;
  amount: number;
  transaction_date: string;
  recorded_by_name: string;
  description: string | null;
  proof_url: string | null;
  created_at: string | null;
}

interface KasData {
  user: {
    id: number;
    name: string;
    nis: string;
    role: string;
  };
  canManage: boolean;
  settings: {
    weeklyNominal: number;
    totalWeeks: number;
  };
  stats: {
    totalSaldo: number;
    totalPemasukan: number;
    totalKasSiswa: number;
    totalOtherIncome: number;
    totalExpenses: number;
    totalStudents: number;
    paidStudentsCount: number;
    arrearsStudentsCount: number;
    totalArrearsAmount: number;
  };
  students: StudentItem[];
  transactions: TransactionItem[];
}

export default function KasKelasClient({ initialData }: { initialData: KasData }) {
  const router = useRouter();
  const [data, setData] = useState<KasData>(initialData);
  const [activeTab, setActiveTab] = useState<"students" | "transactions" | "settings">("students");

  // Filter state for students
  const [searchQuery, setSearchQuery] = useState("");
  const [studentFilter, setStudentFilter] = useState<"all" | "arrears" | "paid">("all");

  // Filter state for transactions
  const [txTypeFilter, setTxTypeFilter] = useState<"all" | "expense" | "income">("all");

  // Action states
  const [loadingPaymentId, setLoadingPaymentId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State: Add Transaction (Expense / Income)
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [txTitle, setTxTitle] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("kebersihan");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDesc, setTxDesc] = useState("");
  const [txProofFile, setTxProofFile] = useState<File | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Modal State: Preview Proof Image
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Settings Form State
  const [settingsNominal, setSettingsNominal] = useState(String(data.settings.weeklyNominal));
  const [settingsWeeks, setSettingsWeeks] = useState(String(data.settings.totalWeeks));
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Re-fetch data from API
  const refreshData = async () => {
    try {
      const res = await fetch("/api/kas");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      }
    } catch {
      // ignore
    }
  };

  // Handle single week payment toggle
  const handleTogglePayment = async (studentId: number, weekNumber: number) => {
    if (!data.canManage) return;
    const actionKey = `${studentId}-${weekNumber}`;
    setLoadingPaymentId(actionKey);

    try {
      const res = await fetch("/api/kas/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          week_number: weekNumber,
          nominal: data.settings.weeklyNominal,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal memperbarui status kas." });
      } else {
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setLoadingPaymentId(null);
    }
  };

  // Handle Pay All weeks for student
  const handlePayAll = async (studentId: number) => {
    if (!data.canManage) return;
    setLoadingPaymentId(`all-${studentId}`);

    try {
      const res = await fetch("/api/kas/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          action: "pay_all",
          nominal: data.settings.weeklyNominal,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal memproses." });
      } else {
        setAlert({ type: "success", text: json.message });
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setLoadingPaymentId(null);
    }
  };

  // Handle Reset all weeks for student
  const handleUnpayAll = async (studentId: number, studentName: string) => {
    if (!data.canManage) return;
    if (!confirm(`Reset seluruh status pembayaran kas untuk ${studentName}?`)) return;

    setLoadingPaymentId(`unpay-${studentId}`);
    try {
      const res = await fetch("/api/kas/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          action: "unpay_all",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal mereset." });
      } else {
        setAlert({ type: "success", text: json.message });
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setLoadingPaymentId(null);
    }
  };

  // Submit Transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTitle.trim()) {
      setAlert({ type: "error", text: "Judul / keperluan transaksi wajib diisi." });
      return;
    }
    const parsedAmount = parseInt(txAmount.replace(/\D/g, ""), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAlert({ type: "error", text: "Nominal transaksi harus lebih dari Rp 0." });
      return;
    }

    setIsSubmittingTx(true);
    setAlert(null);

    try {
      const formData = new FormData();
      formData.append("type", txType);
      formData.append("category", txCategory);
      formData.append("title", txTitle.trim());
      formData.append("amount", String(parsedAmount));
      formData.append("transaction_date", txDate);
      formData.append("description", txDesc.trim());
      if (txProofFile) {
        formData.append("proof", txProofFile);
      }

      const res = await fetch("/api/kas/transaction", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal mencatat transaksi." });
      } else {
        setAlert({ type: "success", text: json.message });
        setShowTxModal(false);
        setTxTitle("");
        setTxAmount("");
        setTxDesc("");
        setTxProofFile(null);
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (txId: number, txTitle: string) => {
    if (!data.canManage) return;
    if (!confirm(`Hapus transaksi "${txTitle}"?`)) return;

    try {
      const res = await fetch(`/api/kas/transaction?id=${txId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal menghapus transaksi." });
      } else {
        setAlert({ type: "success", text: json.message });
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan saat menghapus." });
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.canManage) return;

    const nominalNum = parseInt(settingsNominal.replace(/\D/g, ""), 10);
    const weeksNum = parseInt(settingsWeeks, 10);

    if (isNaN(nominalNum) || nominalNum <= 0) {
      setAlert({ type: "error", text: "Nominal per minggu tidak valid." });
      return;
    }
    if (isNaN(weeksNum) || weeksNum < 1 || weeksNum > 52) {
      setAlert({ type: "error", text: "Target minggu harus antara 1 - 52." });
      return;
    }

    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/kas/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekly_nominal: nominalNum,
          total_weeks: weeksNum,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal menyimpan pengaturan." });
      } else {
        setAlert({ type: "success", text: json.message });
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filter students list
  const filteredStudents = data.students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery);

    if (!matchSearch) return false;
    if (studentFilter === "arrears") return !s.isLunas;
    if (studentFilter === "paid") return s.isLunas;
    return true;
  });

  // Filter transactions list
  const filteredTransactions = data.transactions.filter((t) => {
    if (txTypeFilter === "expense") return t.type === "expense";
    if (txTypeFilter === "income") return t.type === "income";
    return true;
  });

  const RoleIcon = ROLE_ICONS[data.user.role] || UserCheck;
  const roleBadgeClass = ROLE_BADGE_CLASSES[data.user.role] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200";

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border ${
            alert.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {alert.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <p className="text-xs sm:text-sm font-semibold">{alert.text}</p>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Kas &amp; Keuangan Kelas 10 RPL
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Transparansi uang kas, catatan pemasukan, dan pengeluaran kelas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refreshData}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 transition shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${roleBadgeClass}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
            <span>{ROLE_LABELS[data.user.role] || data.user.role}</span>
          </span>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Saat Ini */}
        <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-600 to-teal-700 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
              Saldo Kas Saat Ini
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {formatRupiah(data.stats.totalSaldo)}
            </h2>
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-100/90 font-medium">
              <Coins className="w-4 h-4" />
              <span>Target: {formatRupiah(data.settings.weeklyNominal)} / minggu</span>
            </div>
          </div>
        </div>

        {/* Total Pemasukan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Pemasukan
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatRupiah(data.stats.totalPemasukan)}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Kas Siswa: {formatRupiah(data.stats.totalKasSiswa)}
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Pengeluaran
            </p>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatRupiah(data.stats.totalExpenses)}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {data.transactions.filter((t) => t.type === "expense").length} pengeluaran tercatat
            </p>
          </div>
        </div>

        {/* Status Pembayaran Kas */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Status Kas Siswa
            </p>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {data.stats.paidStudentsCount} Lunas
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {data.stats.arrearsStudentsCount} Nunggak
              </span>
            </div>
            <p className="text-xs text-rose-500 mt-1 font-medium">
              Tertunggak: {formatRupiah(data.stats.totalArrearsAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === "students"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Kas Siswa ({data.stats.totalStudents})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
            activeTab === "transactions"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Catatan Transaksi ({data.transactions.length})</span>
        </button>

        {data.canManage && (
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              activeTab === "settings"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Kas</span>
          </button>
        )}
      </div>

      {/* TAB 1: DAFTAR KAS SISWA */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
          {/* Controls bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari nama siswa atau NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStudentFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  studentFilter === "all"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                Semua ({data.students.length})
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter("arrears")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  studentFilter === "arrears"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                }`}
              >
                Nunggak ({data.stats.arrearsStudentsCount})
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter("paid")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  studentFilter === "paid"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100"
                }`}
              >
                Lunas ({data.stats.paidStudentsCount})
              </button>
            </div>
          </div>

          {/* Guide hint for Bendahara */}
          {data.canManage ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Mode Bendahara Aktif:</strong> Klik tombol minggu (M1, M2, dst.) pada setiap siswa untuk menandai sudah bayar atau belum. Total uang kas akan otomatis terhitung ke pemasukan.
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Mode Tinjauan Transparansi:</strong> Anda dapat melihat status pelunasan uang kas kelas secara transparan. Hanya Bendahara Kelas dan Admin yang dapat mengelola pembayaran.
              </span>
            </div>
          )}

          {/* Students List Table */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
              Tidak ada siswa yang sesuai dengan filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student, idx) => (
                <div
                  key={student.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    student.isLunas
                      ? "bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40"
                      : "bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3.5 min-w-0 md:w-1/3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        student.isLunas
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {student.name}
                        </h4>
                        {student.isLunas && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
                            Lunas
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        NIS: {student.nis} • {ROLE_LABELS[student.role] || student.role}
                      </p>
                    </div>
                  </div>

                  {/* Week Buttons (M1, M2, M3, ...) */}
                  <div className="flex items-center gap-1.5 flex-wrap md:justify-center">
                    {Array.from({ length: data.settings.totalWeeks }, (_, i) => i + 1).map((weekNum) => {
                      const isPaid = student.paidWeeks.includes(weekNum);
                      const isActionLoading = loadingPaymentId === `${student.id}-${weekNum}`;

                      return (
                        <button
                          key={weekNum}
                          type="button"
                          disabled={!data.canManage || isActionLoading}
                          onClick={() => handleTogglePayment(student.id, weekNum)}
                          title={`Minggu ke-${weekNum}: ${isPaid ? "Sudah Bayar" : "Belum Bayar"}${data.canManage ? " (Klik untuk ubah)" : ""}`}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            isPaid
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 border border-zinc-200/80 dark:border-zinc-700/60"
                          } ${!data.canManage ? "cursor-default" : "cursor-pointer"}`}
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPaid ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                          <span>M{weekNum}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Arrears Status & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:w-1/3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <div className="text-right">
                      <p className="text-xs font-bold">
                        {student.isLunas ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(student.totalPaid)}
                          </span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            Nunggak {student.missingWeeksCount} Minggu ({formatRupiah(student.arrearsAmount)})
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {student.paidWeeks.length} dari {data.settings.totalWeeks} minggu
                      </p>
                    </div>

                    {/* Fast Quick Action Buttons for Bendahara */}
                    {data.canManage && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!student.isLunas ? (
                          <button
                            type="button"
                            disabled={loadingPaymentId === `all-${student.id}`}
                            onClick={() => handlePayAll(student.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
                            title="Tandai lunas seluruh minggu"
                          >
                            {loadingPaymentId === `all-${student.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              "Lunaskan"
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={loadingPaymentId === `unpay-${student.id}`}
                            onClick={() => handleUnpayAll(student.id, student.name)}
                            className="p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 text-xs transition cursor-pointer"
                            title="Reset pembayaran siswa ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATATAN TRANSAKSI (PEMASUKAN & PENGELUARAN) */}
      {activeTab === "transactions" && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Riwayat Arus Kas Kelas</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Daftar lengkap pemasukan uang kas, sumbangan, serta pengeluaran keperluan kelas
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter */}
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("all")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "all"
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("expense")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "expense"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setTxTypeFilter("income")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txTypeFilter === "income"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              {/* Add Transaction Button */}
              {data.canManage && (
                <button
                  type="button"
                  onClick={() => {
                    setTxType("expense");
                    setShowTxModal(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Transaksi</span>
                </button>
              )}
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
              Belum ada transaksi pengeluaran atau pemasukan yang dicatat.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const catInfo = CATEGORY_LABELS[tx.category] || CATEGORY_LABELS.lainnya;
                const isExpense = tx.type === "expense";

                return (
                  <div
                    key={tx.id}
                    className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isExpense
                            ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                            : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {tx.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catInfo.color}`}
                          >
                            {catInfo.label}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {tx.transaction_date} • Dicatat oleh {tx.recorded_by_name}
                        </p>

                        {tx.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 italic">
                            &quot;{tx.description}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
                      <span
                        className={`text-sm sm:text-base font-extrabold ${
                          isExpense
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {isExpense ? "-" : "+"} {formatRupiah(tx.amount)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {tx.proof_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewImageUrl(tx.proof_url)}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Lihat Bukti Foto / Nota"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">Bukti</span>
                          </button>
                        )}

                        {data.canManage && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id, tx.title)}
                            className="p-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-rose-600 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENGATURAN KAS (BENDAHARA & ADMIN ONLY) */}
      {activeTab === "settings" && data.canManage && (
        <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Pengaturan Sistem Uang Kas
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Konfigurasikan tarif iuran kas per minggu dan total minggu berjalan
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-2">
                Nominal Iuran Kas per Minggu (Rp)
              </label>
              <input
                type="number"
                min="1000"
                step="500"
                value={settingsNominal}
                onChange={(e) => setSettingsNominal(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Tarif standar kas kelas (contoh: 5000 untuk Rp 5.000 / minggu)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-2">
                Total Target Minggu Berjalan
              </label>
              <input
                type="number"
                min="1"
                max="52"
                value={settingsWeeks}
                onChange={(e) => setSettingsWeeks(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                required
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Jumlah minggu yang ditagih saat ini (contoh: 4 untuk Minggu ke-1 s/d Minggu ke-4). Naikkan angka ini seiring bertambahnya minggu pertemuan.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: TAMBAH TRANSAKSI (PENGELUARAN / PEMASUKAN) */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowTxModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  txType === "expense"
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                }`}
              >
                {txType === "expense" ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {txType === "expense" ? "Catat Pengeluaran Kas" : "Catat Pemasukan Lain"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Catat arus keluar/masuk keuangan kelas dengan rapi
                </p>
              </div>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTxType("expense");
                  setTxCategory("kebersihan");
                }}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  txType === "expense"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Pengeluaran (Beli Barang/Keperluan)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType("income");
                  setTxCategory("donasi");
                }}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  txType === "income"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                Pemasukan Lain (Donasi/Sponsorship)
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Keperluan / Judul Transaksi *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Beli sapu &amp; pel lantai, Spidol whiteboard..."
                  value={txTitle}
                  onChange={(e) => setTxTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 35000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {txType === "expense" ? (
                      <>
                        <option value="kebersihan">Alat Kebersihan</option>
                        <option value="alat_tulis">ATK &amp; Spidol</option>
                        <option value="fotokopi">Fotokopi / Modul</option>
                        <option value="konsumsi">Konsumsi / Snack</option>
                        <option value="acara">Kegiatan / Lomba</option>
                        <option value="lainnya">Lain-lain</option>
                      </>
                    ) : (
                      <>
                        <option value="donasi">Donasi / Sponsor</option>
                        <option value="kas_siswa">Kas Siswa Manual</option>
                        <option value="lainnya">Pemasukan Lain</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan tambahan toko, peruntukan barang, dsb..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1">
                  Foto Bukti / Nota Pembelian (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTxProofFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-950/50 dark:file:text-emerald-300 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingTx ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Transaksi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW FOTO BUKTI / NOTA */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 max-w-2xl w-full p-4 relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black">
              <img
                src={previewImageUrl}
                alt="Bukti Transaksi"
                className="max-h-[75vh] w-auto object-contain rounded-2xl"
              />
            </div>
            <div className="mt-3 flex justify-end w-full">
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Gambar Asli</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
