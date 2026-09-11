"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Search,
  Check,
  X,
  Trash2,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Shield,
  Crown,
  Sparkles,
  Award,
  Users,
  UserCheck,
  Wallet,
  FileText,
  Loader2,
  RefreshCw,
  Filter,
  Layers,
  GraduationCap,
} from "lucide-react";
import { CLASS_SUBJECTS, TASK_TYPES, SubjectItem } from "@/data/subjects";

const ROLE_ICONS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  admin: Shield,
  teacher: Award,
  ketuakelas: Crown,
  wakilketuakelas: Sparkles,
  sekertaris: FileText,
  bendahara: Wallet,
  kebersihan: Users,
  student: UserCheck,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin Kelas",
  teacher: "Guru / Wali Kelas",
  ketuakelas: "Ketua Kelas",
  wakilketuakelas: "Wakil Ketua Kelas",
  sekertaris: "Sekretaris Kelas",
  bendahara: "Bendahara Kelas",
  kebersihan: "Seksi Kebersihan",
  student: "Murid (Siswa)",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  teacher: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
  ketuakelas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  wakilketuakelas: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  sekertaris: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50",
  bendahara: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  kebersihan: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  student: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
};

interface TaskItem {
  id: number;
  title: string;
  subject: string;
  teacher_name: string;
  type: string;
  deadline: string;
  deadline_time: string;
  description: string;
  status: string; // 'active', 'completed', 'overdue'
  created_by_name: string;
  created_at: string | null;
  updated_at: string | null;
}

interface TugasData {
  user: {
    id: number;
    name: string;
    nis: string;
    role: string;
  };
  canManage: boolean;
  tasks: TaskItem[];
}

export default function TugasClient({ initialData }: { initialData: TugasData }) {
  const router = useRouter();
  const [data, setData] = useState<TugasData>(initialData);
  const [tasks, setTasks] = useState<TaskItem[]>(initialData.tasks);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "urgent" | "completed">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  // Alert State
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State: Create / Edit Task
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState(CLASS_SUBJECTS[0].name);
  const [formTeacher, setFormTeacher] = useState(CLASS_SUBJECTS[0].teacher);
  const [formType, setFormType] = useState("tugas");
  const [formDeadline, setFormDeadline] = useState(new Date().toISOString().split("T")[0]);
  const [formDeadlineTime, setFormDeadlineTime] = useState("23:59");
  const [formDesc, setFormDesc] = useState("");
  const [formStatus, setFormStatus] = useState("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading state for quick action buttons
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const refreshData = async () => {
    try {
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setTasks(json.tasks);
      }
    } catch {
      // ignore
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormSubject(CLASS_SUBJECTS[0].name);
    setFormTeacher(CLASS_SUBJECTS[0].teacher);
    setFormType("tugas");
    setFormDeadline(new Date().toISOString().split("T")[0]);
    setFormDeadlineTime("23:59");
    setFormDesc("");
    setFormStatus("active");
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormSubject(task.subject);
    setFormTeacher(task.teacher_name);
    setFormType(task.type);
    setFormDeadline(task.deadline);
    setFormDeadlineTime(task.deadline_time || "23:59");
    setFormDesc(task.description);
    setFormStatus(task.status === "overdue" ? "active" : task.status);
    setShowModal(true);
  };

  // When subject dropdown changes, autofill teacher's name
  const handleSubjectChange = (subjectName: string) => {
    setFormSubject(subjectName);
    const found = CLASS_SUBJECTS.find((s) => s.name === subjectName);
    if (found) {
      setFormTeacher(found.teacher);
    }
  };

  // Submit Create or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setAlert({ type: "error", text: "Judul tugas atau PR wajib diisi." });
      return;
    }
    if (!formSubject.trim()) {
      setAlert({ type: "error", text: "Mata pelajaran wajib dipilih." });
      return;
    }
    if (!formDeadline) {
      setAlert({ type: "error", text: "Tenggat waktu (deadline) wajib diisi." });
      return;
    }

    setIsSubmitting(true);
    setAlert(null);

    try {
      const payload = {
        id: editingTask?.id,
        title: formTitle.trim(),
        subject: formSubject.trim(),
        teacher_name: formTeacher.trim(),
        type: formType,
        deadline: formDeadline,
        deadline_time: formDeadlineTime,
        description: formDesc.trim(),
        status: formStatus,
      };

      const res = await fetch("/api/tasks", {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal menyimpan tugas." });
      } else {
        setAlert({ type: "success", text: json.message });
        setShowModal(false);
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Toggle Status between active & completed
  const handleToggleStatus = async (task: TaskItem) => {
    if (!data.canManage) return;
    setTogglingId(task.id);

    const newStatus = task.status === "completed" ? "active" : "completed";
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: newStatus,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal memperbarui status." });
      } else {
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi." });
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!data.canManage) return;
    if (!confirm(`Hapus tugas "${taskTitle}"?`)) return;

    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: json.error || "Gagal menghapus tugas." });
      } else {
        setAlert({ type: "success", text: json.message });
        await refreshData();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan saat menghapus." });
    }
  };

  // Format Indonesian date
  const formatIndoDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(d);
      }
    } catch {}
    return dateStr;
  };

  // Calculate days remaining until deadline
  const getDeadlineStatus = (deadlineStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { label: "Selesai", isUrgent: false, isOverdue: false, textClass: "text-emerald-600 dark:text-emerald-400" };
    }

    const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
    if (deadlineStr < todayStr) {
      return { label: "Sudah Lewat Deadline", isUrgent: true, isOverdue: true, textClass: "text-rose-600 dark:text-rose-400" };
    }
    if (deadlineStr === todayStr) {
      return { label: "Hari Ini Terakhir!", isUrgent: true, isOverdue: false, textClass: "text-amber-600 dark:text-amber-400" };
    }

    const d1 = new Date(todayStr);
    const d2 = new Date(deadlineStr);
    const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return { label: "Besok (1 Hari Lagi)", isUrgent: true, isOverdue: false, textClass: "text-amber-600 dark:text-amber-400" };
    }
    if (diffDays <= 3) {
      return { label: `${diffDays} Hari Lagi`, isUrgent: true, isOverdue: false, textClass: "text-orange-600 dark:text-orange-400" };
    }

    return { label: `${diffDays} Hari Lagi`, isUrgent: false, isOverdue: false, textClass: "text-zinc-600 dark:text-zinc-400" };
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (selectedSubject !== "all" && t.subject !== selectedSubject) {
      return false;
    }

    const deadlineInfo = getDeadlineStatus(t.deadline, t.status === "completed");
    if (statusFilter === "active") return t.status === "active";
    if (statusFilter === "urgent") return (deadlineInfo.isUrgent || deadlineInfo.isOverdue) && t.status !== "completed";
    if (statusFilter === "completed") return t.status === "completed";

    return true;
  });

  const activeCount = tasks.filter((t) => t.status === "active").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const urgentCount = tasks.filter(
    (t) => t.status !== "completed" && getDeadlineStatus(t.deadline, false).isUrgent
  ).length;

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
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-2xl border border-cyan-200/60 dark:border-cyan-800/60 shadow-xs shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Daftar Tugas &amp; PR Kelas 10 RPL
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Pantau jadwal tugas harian, PR, projek, dan praktikum coding
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-linear-to-br from-cyan-600 to-blue-700 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15">
            <BookOpen className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-xs font-medium text-cyan-100 uppercase tracking-wider">
              Tugas Aktif Berjalan
            </p>
            <h2 className="text-3xl font-extrabold mt-1">{activeCount} Tugas</h2>
            <p className="text-xs text-cyan-100/90 mt-2">
              Harus diselesaikan tepat waktu
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Mendekati Deadline (&le; 3 Hari)
            </p>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {urgentCount} Tugas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Perlu segera dikerjakan
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Tugas Selesai
            </p>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount} Tugas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Telah diselesaikan oleh kelas
            </p>
          </div>
        </div>
      </div>

      {/* Main Task List Container */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          {/* Search & Subject Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Cari judul tugas, materi, guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 transition"
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

            {/* Subject Selector */}
            <div className="w-full sm:w-64">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 transition"
              >
                <option value="all">Semua Mata Pelajaran</option>
                {CLASS_SUBJECTS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Buttons & Add Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "active"
                    ? "bg-cyan-600 text-white shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Aktif ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("urgent")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "urgent"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Mendesak ({urgentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  statusFilter === "completed"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Selesai ({completedCount})
              </button>
            </div>

            {/* Add Task Button (Sekretaris & Admin) */}
            {data.canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tugas / PR</span>
              </button>
            )}
          </div>
        </div>

        {/* Role Helper Info */}
        {data.canManage ? (
          <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-800/50 text-cyan-800 dark:text-cyan-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>
              <strong>Mode Sekretaris Aktif:</strong> Anda dapat menambah tugas baru dengan memilih mata pelajaran dari daftar dropdown, mengubah detail tugas, menandai selesai, atau menghapus tugas.
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Daftar Tugas Kelas:</strong> Pantau seluruh tugas dan PR aktif. Pengelolaan tugas dikelola oleh Sekretaris Kelas.
            </span>
          </div>
        )}

        {/* Task Cards List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold">Tidak ada tugas yang sesuai dengan filter.</p>
            <p className="text-xs">Silakan ubah filter atau kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const subjectInfo =
                CLASS_SUBJECTS.find((s) => s.name === task.subject) ||
                CLASS_SUBJECTS[CLASS_SUBJECTS.length - 1];
              const typeInfo =
                TASK_TYPES.find((t) => t.value === task.type) || TASK_TYPES[0];
              const isDone = task.status === "completed";
              const deadlineInfo = getDeadlineStatus(task.deadline, isDone);

              return (
                <div
                  key={task.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${
                    isDone
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30 opacity-85"
                      : deadlineInfo.isOverdue
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/50"
                      : deadlineInfo.isUrgent
                      ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50"
                      : "bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Badges Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${subjectInfo.color}`}
                        >
                          {task.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </div>

                      {/* Status indicator */}
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${deadlineInfo.textClass}`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : deadlineInfo.isUrgent ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{deadlineInfo.label}</span>
                      </span>
                    </div>

                    {/* Task Title */}
                    <div>
                      <h3
                        className={`text-base font-bold text-zinc-900 dark:text-zinc-100 ${
                          isDone ? "line-through text-zinc-400 dark:text-zinc-500" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Guru: {task.teacher_name}</span>
                      </p>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <div className="p-3 rounded-2xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Footer Bar */}
                  <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                        <span>
                          Deadline: {formatIndoDate(task.deadline)} ({task.deadline_time} WIB)
                        </span>
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Oleh {task.created_by_name}
                      </p>
                    </div>

                    {/* Action buttons (Sekretaris & Admin) */}
                    {data.canManage && (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          disabled={togglingId === task.id}
                          onClick={() => handleToggleStatus(task)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                            isDone
                              ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                          }`}
                          title={isDone ? "Batal Selesai" : "Tandai Selesai"}
                        >
                          {togglingId === task.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isDone ? (
                            <span>Buka Lagi</span>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Selesai</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(task)}
                          className="p-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-cyan-600 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                          title="Edit Tugas"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="p-1.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-rose-600 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH / EDIT TUGAS & PR */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md p-4 sm:p-6 flex justify-center items-start sm:items-center min-h-screen py-8 sm:py-12 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto flex flex-col">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {editingTask ? "Edit Tugas / PR Kelas" : "Tambah Tugas / PR Baru"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pilih mata pelajaran dan tentukan tenggat waktu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleSubmitForm} className="flex flex-col">
              <div className="p-6 overflow-y-auto max-h-[62vh] space-y-4">
                {/* Mata Pelajaran Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                    Mata Pelajaran (Tinggal Pilih) *
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                    required
                  >
                    {CLASS_SUBJECTS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} ({s.teacher})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Guru Pengampu (Autofilled, but editable) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                    Guru Pengampu
                  </label>
                  <input
                    type="text"
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="Nama Guru..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Judul Tugas */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                    Judul Tugas / Materi / PR *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Latihan Soal Bab 3 Halaman 45-50..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                {/* Tipe Tugas & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                      Jenis Tugas
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                      Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="active">Aktif (Sedang Berjalan)</option>
                      <option value="completed">Selesai</option>
                    </select>
                  </div>
                </div>

                {/* Deadline Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                      Tenggat Tanggal (Deadline) *
                    </label>
                    <input
                      type="date"
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                      Jam Pengumpulan (WIB)
                    </label>
                    <input
                      type="time"
                      value={formDeadlineTime}
                      onChange={(e) => setFormDeadlineTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Deskripsi & Instruksi */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">
                    Deskripsi / Instruksi / Link Modul (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Ketik detail instruksi, cara pengumpulan, link Google Drive/GitHub, buku paket hal berapa, dsb..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingTask ? "Simpan Perubahan" : "Tambahkan Tugas"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
