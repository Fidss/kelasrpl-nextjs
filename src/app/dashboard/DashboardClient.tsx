"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Clock,
  Bot,
  Heart,
  Music,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  X,
  Loader2,
  Play,
  Pause,
  ArrowRight,
  BookOpen,
  Camera,
  Trash2,
  Plus,
  UploadCloud,
  ExternalLink,
  Shield,
  Crown,
  Sparkles,
  Award,
  Users,
  UserCheck,
  Image as ImageIcon,
  Wallet,
} from "lucide-react";
import ClassSchedule from "@/components/landing/ClassSchedule";
import { useLanguage } from "@/context/LanguageContext";

export type AppRole =
  | "admin"
  | "teacher"
  | "student"
  | "ketuakelas"
  | "wakilketuakelas"
  | "sekertaris"
  | "bendahara"
  | "keamanan"
  | "kebersihan"
  | string;

export interface RoleConfig {
  label: string;
  badgeClass: string;
  icon?: any;
}

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  admin: {
    label: "Admin Kelas",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  },
  teacher: {
    label: "Guru / Wali Kelas",
    badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
  },
  ketuakelas: {
    label: "Ketua Kelas",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  },
  wakilketuakelas: {
    label: "Wakil Ketua Kelas",
    badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  },
  sekertaris: {
    label: "Sekretaris",
    badgeClass: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50",
  },
  bendahara: {
    label: "Bendahara",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
  },
  keamanan: {
    label: "Seksi Keamanan",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
  },
  kebersihan: {
    label: "Seksi Kebersihan",
    badgeClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  },
  student: {
    label: "Murid (Siswa)",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
  },
};

export const ASSIGNABLE_ROLES = [
  { value: "student", label: "Murid (Default)" },
  { value: "teacher", label: "Guru" },
  { value: "ketuakelas", label: "Ketua Kelas" },
  { value: "wakilketuakelas", label: "Wakil Ketua Kelas" },
  { value: "sekertaris", label: "Sekretaris" },
  { value: "bendahara", label: "Bendahara" },
  { value: "keamanan", label: "Keamanan" },
  { value: "kebersihan", label: "Kebersihan" },
];

// Roles that can see the full class attendance list
const ATTENDANCE_PRIVILEGED_ROLES: string[] = ["admin", "teacher", "ketuakelas", "wakilketuakelas"];

interface UserData {
  id: number;
  name: string;
  nis: string;
  role: AppRole;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  notes: string | null;
  time?: string | null;
}

interface MenfessRecord {
  id: number;
  sender_name: string;
  is_anonymous: boolean;
  message: string;
  type: string;
  song_title?: string | null;
  song_artist?: string | null;
  song_album_art?: string | null;
  song_track_id?: string | null;
  song_preview_url?: string | null;
  is_read: boolean;
  created_at: string;
}

interface StudentAdminRow {
  id: number;
  name: string;
  nis: string;
  gender: string;
  role?: string;
  status?: string;
  notes?: string | null;
  time?: string | null;
}

export interface MemoryItem {
  id: number;
  title: string;
  tag: string;
  date: string;
  description: string;
  image_url: string;
  user_id?: number | null;
  user_name: string;
  created_at: string;
}

export interface AttendanceDateOption {
  date: string;
  label: string;
  isToday: boolean;
}

interface DashboardClientProps {
  user: UserData;
  todayAttendance?: AttendanceRecord | null;
  history?: AttendanceRecord[];
  receivedMenfesses?: MenfessRecord[];
  unreadCount?: number;
  latestUnreadMenfess?: MenfessRecord | null;
  students?: StudentAdminRow[];
  stats?: {
    total: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
  };
  memories?: MemoryItem[];
  availableDates?: AttendanceDateOption[];
  initialAttendanceDate?: string;
}

function formatIndoDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d);
    }
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(isoStr: string): string {
  if (!isoStr) return "";
  try {
    const date = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return "1 hari yang lalu";
    if (diffDay < 30) return `${diffDay} hari yang lalu`;
    return formatIndoDate(isoStr);
  } catch {
    return "";
  }
}

const EMPTY_ARRAY: any[] = [];

export default function DashboardClient({
  user,
  todayAttendance,
  history = EMPTY_ARRAY,
  receivedMenfesses = EMPTY_ARRAY,
  unreadCount = 0,
  latestUnreadMenfess,
  students = EMPTY_ARRAY,
  stats,
  memories = EMPTY_ARRAY,
  availableDates = EMPTY_ARRAY,
  initialAttendanceDate = "",
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    setNavigatingTo(null);
  }, [pathname]);

  // Realtime clock
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  // Student Izin Form
  const [izinStatus, setIzinStatus] = useState<"izin" | "sakit">("izin");
  const [izinNotes, setIzinNotes] = useState("");
  const [submittingIzin, setSubmittingIzin] = useState(false);

  // Admin Quick Reset Select
  const [quickResetUserId, setQuickResetUserId] = useState("");

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Admin Attendance Date Selector State
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState<string>(
    initialAttendanceDate || (availableDates.length > 0 ? availableDates[0].date : "")
  );
  const [attendanceDateOptions, setAttendanceDateOptions] = useState<AttendanceDateOption[]>(
    availableDates
  );
  const [adminStudents, setAdminStudents] = useState<StudentAdminRow[]>(students);
  const [adminStats, setAdminStats] = useState(stats);
  const [isLoadingAttendanceDate, setIsLoadingAttendanceDate] = useState(false);

  // Sync admin state when props change
  useEffect(() => {
    if (students) setAdminStudents(students);
  }, [students]);

  useEffect(() => {
    if (stats) setAdminStats(stats);
  }, [stats]);

  useEffect(() => {
    if (availableDates && availableDates.length > 0) {
      setAttendanceDateOptions(availableDates);
      if (!selectedAttendanceDate) {
        setSelectedAttendanceDate(availableDates[0].date);
      }
    }
  }, [availableDates]);

  // Memories Management State
  const [memoryList, setMemoryList] = useState<MemoryItem[]>(memories || []);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [memTitle, setMemTitle] = useState("");
  const [memTag, setMemTag] = useState("Kegiatan Kelas");
  const [memDescription, setMemDescription] = useState("");
  const [memFile, setMemFile] = useState<File | null>(null);
  const [memPreview, setMemPreview] = useState<string | null>(null);
  const [isUploadingMemory, setIsUploadingMemory] = useState(false);
  const [deleteConfirmMemory, setDeleteConfirmMemory] = useState<MemoryItem | null>(null);
  const [isDeletingMemory, setIsDeletingMemory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync memoryList when memories prop changes
  useEffect(() => {
    if (memories) {
      setMemoryList(memories);
    }
  }, [memories]);

  // Alerts
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Anti-spam loading states
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);
  const [resettingStudentId, setResettingStudentId] = useState<number | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
  const [isQuickResetting, setIsQuickResetting] = useState(false);

  // Floating Mini Audio Player for Songfess
  const [playingSongfess, setPlayingSongfess] = useState<{
    id: number | string;
    title: string;
    artist: string;
    art: string | null;
    audioUrl: string;
  } | null>(null);
  const [loadingSongfessId, setLoadingSongfessId] = useState<number | string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
          .format(now)
          .replace(/\./g, ":") + " WIB"
      );
      setDateStr(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now)
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlaySongfess = async (mf: MenfessRecord) => {
    if (playingSongfess?.id === mf.id) {
      if (audioRef.current) {
        if (isPlayingAudio) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
        } else {
          audioRef.current.play().catch(console.error);
          setIsPlayingAudio(true);
        }
      }
      return;
    }

    setLoadingSongfessId(mf.id);
    setAlert(null);

    try {
      const params = new URLSearchParams({
        artist: mf.song_artist || "",
        title: mf.song_title || "",
        track_id: mf.song_track_id || "",
        url: mf.song_preview_url || "",
      });

      const res = await fetch(`/api/music/preview?${params.toString()}`);
      const data = await res.json();

      if (!data.success || !data.preview_url) {
        setAlert({ type: "error", text: "Cuplikan audio untuk lagu ini tidak tersedia atau kedaluwarsa." });
        setLoadingSongfessId(null);
        return;
      }

      const url = data.preview_url;

      setPlayingSongfess({
        id: mf.id,
        title: mf.song_title || "Lagu",
        artist: mf.song_artist || "Artis",
        art: mf.song_album_art || null,
        audioUrl: url,
      });

      if (audioRef.current) {
        audioRef.current.src = url;
        try {
          await audioRef.current.play();
          setIsPlayingAudio(true);
        } catch (playErr) {
          console.error("Audio playback error:", playErr);
          setIsPlayingAudio(false);
          setAlert({ type: "error", text: "Browser mencegah pemutaran otomatis atau terjadi gangguan audio." });
        }
      }
    } catch (err) {
      console.error("Songfess playback error:", err);
      setAlert({ type: "error", text: "Gagal memuat cuplikan lagu." });
    } finally {
      setLoadingSongfessId(null);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    if (markingReadId === id) return;
    setMarkingReadId(id);
    try {
      const res = await fetch(`/api/menfess/${id}/read`, { method: "POST" });
      if (res.ok) {
        setAlert({ type: "success", text: "Pesan berhasil ditandai sudah dibaca." });
        router.refresh();
      }
    } catch {
      setAlert({ type: "error", text: "Gagal memperbarui status pesan." });
    } finally {
      setMarkingReadId(null);
    }
  };

  const submitIzin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingIzin(true);
    setAlert(null);

    try {
      const res = await fetch("/api/attendance/izin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: izinStatus, notes: izinNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengajukan izin." });
      } else {
        setAlert({ type: "success", text: "Pengajuan izin berhasil dikirim!" });
        setIzinNotes("");
        router.refresh();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmittingIzin(false);
    }
  };

  const handleDateChange = async (newDate: string) => {
    if (!newDate) return;
    setSelectedAttendanceDate(newDate);
    setIsLoadingAttendanceDate(true);

    try {
      const res = await fetch(`/api/admin/attendances?date=${encodeURIComponent(newDate)}`);
      const json = await res.json();
      if (json.success) {
        setAdminStudents(json.students);
        setAdminStats(json.stats);
        if (json.availableDates && json.availableDates.length > 0) {
          setAttendanceDateOptions(json.availableDates);
        }
      } else {
        setAlert({
          type: "error",
          text: json.error || "Gagal memuat rekapitulasi tanggal tersebut.",
        });
      }
    } catch (err) {
      console.error("Fetch attendances error:", err);
      setAlert({
        type: "error",
        text: "Terjadi kesalahan jaringan saat memuat data absensi.",
      });
    } finally {
      setIsLoadingAttendanceDate(false);
    }
  };

  const handleResetPassword = async (studentId: number, studentName: string) => {
    if (!confirm(`Reset password untuk ${studentName} ke default (12345678)?`)) return;

    setResettingStudentId(studentId);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mereset password." });
      } else {
        setAlert({ type: "success", text: data.message });
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setResettingStudentId(null);
    }
  };

  const handleQuickReset = async () => {
    if (!quickResetUserId) {
      setAlert({ type: "error", text: "Pilih siswa terlebih dahulu." });
      return;
    }
    const student = students.find((s) => s.id === parseInt(quickResetUserId));
    const studentName = student ? student.name : "Siswa terpilih";
    setIsQuickResetting(true);
    try {
      await handleResetPassword(parseInt(quickResetUserId), studentName);
      setQuickResetUserId("");
    } finally {
      setIsQuickResetting(false);
    }
  };

  const handleUpdateRole = async (studentId: number, studentName: string, newRole: string) => {
    setUpdatingRoleId(studentId);
    try {
      const res = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: studentId, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengubah role." });
      } else {
        setAlert({ type: "success", text: data.message });
        setAdminStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, role: newRole } : s))
        );
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan jaringan saat mengubah role." });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", text: "Konfirmasi password baru tidak cocok." });
      return;
    }
    setSubmittingPassword(true);
    setAlert(null);

    try {
      const res = await fetch("/api/password/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengganti password." });
      } else {
        setAlert({ type: "success", text: "Password berhasil diperbarui!" });
        setPasswordModalOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan jaringan." });
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleSelectMemoryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAlert({ type: "error", text: "File yang dipilih harus berupa gambar (JPG, PNG, WEBP)." });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAlert({ type: "error", text: "Ukuran gambar maksimal 15 MB." });
      return;
    }

    setMemFile(file);
    const objectUrl = URL.createObjectURL(file);
    setMemPreview(objectUrl);
  };

  const handleClearSelectedFile = () => {
    if (memPreview) URL.revokeObjectURL(memPreview);
    setMemFile(null);
    setMemPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memFile) {
      setAlert({ type: "error", text: "Silakan pilih foto kenangan terlebih dahulu." });
      return;
    }
    if (!memTitle.trim()) {
      setAlert({ type: "error", text: "Judul kenangan wajib diisi." });
      return;
    }

    setIsUploadingMemory(true);
    setAlert(null);

    try {
      const formData = new FormData();
      formData.append("image", memFile);
      formData.append("title", memTitle.trim());
      formData.append("tag", memTag.trim() || "Kegiatan Kelas");
      formData.append("description", memDescription.trim());

      const res = await fetch("/api/memories", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengunggah foto kenangan." });
      } else {
        setAlert({
          type: "success",
          text: "Foto kenangan berhasil diunggah dan kini tampil di Landing Page!",
        });
        if (data.data) {
          setMemoryList((prev) => [data.data, ...prev]);
        }
        handleClearSelectedFile();
        setMemTitle("");
        setMemTag("Kegiatan Kelas");
        setMemDescription("");
        setUploadModalOpen(false);
        router.refresh();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi saat mengunggah foto." });
    } finally {
      setIsUploadingMemory(false);
    }
  };

  const handleDeleteMemorySubmit = async () => {
    if (!deleteConfirmMemory) return;

    setIsDeletingMemory(true);
    try {
      const res = await fetch(`/api/memories/${deleteConfirmMemory.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal menghapus foto kenangan." });
      } else {
        setAlert({
          type: "success",
          text: data.message || "Foto kenangan berhasil dihapus dari Landing Page.",
        });
        setMemoryList((prev) => prev.filter((m) => m.id !== deleteConfirmMemory.id));
        setDeleteConfirmMemory(null);
        router.refresh();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan saat menghapus kenangan." });
    } finally {
      setIsDeletingMemory(false);
    }
  };

  const currentSelectedDateObj = attendanceDateOptions.find(
    (d) => d.date === selectedAttendanceDate
  );
  const currentSelectedDateLabel = currentSelectedDateObj
    ? currentSelectedDateObj.label
    : selectedAttendanceDate
    ? formatIndoDate(selectedAttendanceDate)
    : "Hari Ini";

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hidden Audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
        onError={() => {
          setIsPlayingAudio(false);
          setLoadingSongfessId(null);
        }}
      />

      {/* Notifications Alert Banner */}
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

      {/* Menfess Broadcast Announcement Banner */}
      {!ATTENDANCE_PRIVILEGED_ROLES.includes(user.role) && latestUnreadMenfess && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-200 dark:border-pink-900/50 text-zinc-900 dark:text-zinc-100 shadow-xs relative overflow-hidden transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 shadow-xs text-xl">
                💌
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                    {latestUnreadMenfess.type === "songfess"
                      ? "Songfess Baru Untukmu!"
                      : "Menfess Baru Untukmu!"}
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                  </span>
                </div>
                <p className="text-sm font-semibold mt-0.5 text-zinc-800 dark:text-zinc-200">
                  Haii <strong>{user.name}</strong>, kamu mendapatkan{" "}
                  {latestUnreadMenfess.type === "songfess" ? "songfess" : "menfess"} ni dari{" "}
                  <span className="text-pink-600 dark:text-pink-400 font-bold">
                    {latestUnreadMenfess.sender_name}
                  </span>
                  !
                </p>
              </div>
            </div>
            <a
              href="#menfess-inbox"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs hover:scale-[1.02] transition-all shrink-0"
            >
              <span>Cek Lengkapnya Di Sini</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Realtime Jakarta Time Card Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-emerald-400"></span>
                </span>
                <span data-i18n="dash.badge">{t("dash.badge")}</span>
              </span>

              {/* User Role Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                  ROLE_CONFIGS[user.role]?.badgeClass ||
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {user.role === "admin" && <Shield className="w-3.5 h-3.5" />}
                {user.role === "teacher" && <Award className="w-3.5 h-3.5" />}
                {user.role === "ketuakelas" && <Crown className="w-3.5 h-3.5" />}
                {user.role === "wakilketuakelas" && <Sparkles className="w-3.5 h-3.5" />}
                <span>{ROLE_CONFIGS[user.role]?.label || user.role}</span>
              </span>

              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
                Asia/Jakarta (UTC+7)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                <span data-i18n="dash.welcome">{t("dash.welcome")}</span>, {user.name}!
              </h1>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/60 transition cursor-pointer shadow-xs"
                title={t("nav.change_password")}
              >
                <KeyRound className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span data-i18n="nav.change_password">{t("nav.change_password")}</span>
              </button>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
              {dateStr || "Memuat tanggal..."}
            </p>
          </div>

          <div className="flex items-center gap-3.5 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 self-start md:self-auto">
            <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl text-emerald-600 dark:text-emerald-400 border border-zinc-200/60 dark:border-zinc-700/60 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div
                className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                data-i18n="dash.current_time"
              >
                {t("dash.current_time")}
              </div>
              <div className="text-xl sm:text-2xl font-mono font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400 tabular-nums">
                {timeStr || "00:00:00 WIB"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick App Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/chatbot"
          onClick={() => setNavigatingTo("/chatbot")}
          className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
            navigatingTo === "/chatbot" ? "opacity-75 pointer-events-none" : "hover:border-accent-500/50 hover:shadow-md"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {navigatingTo === "/chatbot" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6" />}
          </div>
          <div>
            <h3
              className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-accent-600 dark:group-hover:text-accent-400 transition"
              data-i18n="dash.chatbot_title"
            >
              {t("dash.chatbot_title")}
            </h3>
            <p
              className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
              data-i18n="dash.chatbot_desc"
            >
              {t("dash.chatbot_desc")}
            </p>
          </div>
        </Link>

        <Link
          href="/learning"
          onClick={() => setNavigatingTo("/learning")}
          className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
            navigatingTo === "/learning" ? "opacity-75 pointer-events-none" : "hover:border-indigo-500/50 hover:shadow-md"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {navigatingTo === "/learning" ? <Loader2 className="w-6 h-6 animate-spin" /> : <BookOpen className="w-6 h-6" />}
          </div>
          <div>
            <h3
              className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
              data-i18n="dash.learning_title"
            >
              {t("dash.learning_title")}
            </h3>
            <p
              className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
              data-i18n="dash.learning_desc"
            >
              {t("dash.learning_desc")}
            </p>
          </div>
        </Link>

        <Link
          href="/music"
          onClick={() => setNavigatingTo("/music")}
          className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
            navigatingTo === "/music" ? "opacity-75 pointer-events-none" : "hover:border-purple-500/50 hover:shadow-md"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {navigatingTo === "/music" ? <Loader2 className="w-6 h-6 animate-spin" /> : <Music className="w-6 h-6" />}
          </div>
          <div>
            <h3
              className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition"
              data-i18n="dash.music_title"
            >
              {t("dash.music_title")}
            </h3>
            <p
              className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
              data-i18n="dash.music_desc"
            >
              {t("dash.music_desc")}
            </p>
          </div>
        </Link>

        <a
          href="#memories-section"
          className="group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-rose-500/50 hover:shadow-md transition flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
              Our Memories
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Unggah &amp; kelola foto kenangan kelas
            </p>
          </div>
        </a>

        {(user.role === "kebersihan" ||
          ATTENDANCE_PRIVILEGED_ROLES.includes(user.role)) && (
          <Link
            href="/dashboard/piket"
            onClick={() => setNavigatingTo("/dashboard/piket")}
            className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
              navigatingTo === "/dashboard/piket"
                ? "opacity-75 pointer-events-none"
                : "hover:border-teal-500/50 hover:shadow-md"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              {navigatingTo === "/dashboard/piket" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Users className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
                Piket Kebersihan
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {user.role === "kebersihan"
                  ? "Unggah foto & pantau piket kelas"
                  : "Lihat data piket kebersihan kelas"}
              </p>
            </div>
          </Link>
        )}

        {/* Kas & Keuangan Kelas Card */}
        <Link
          href="/dashboard/kas"
          onClick={() => setNavigatingTo("/dashboard/kas")}
          className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
            navigatingTo === "/dashboard/kas"
              ? "opacity-75 pointer-events-none"
              : "hover:border-emerald-500/50 hover:shadow-md"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {navigatingTo === "/dashboard/kas" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Wallet className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
              Kas &amp; Keuangan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user.role === "bendahara"
                ? "Kelola uang kas & pengeluaran kelas"
                : "Lihat status kas & transparansi kelas"}
            </p>
          </div>
        </Link>

        {/* Tugas & PR Kelas Card (Sekretaris) */}
        <Link
          href="/dashboard/tugas"
          onClick={() => setNavigatingTo("/dashboard/tugas")}
          className={`group p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition flex items-center gap-4 ${
            navigatingTo === "/dashboard/tugas"
              ? "opacity-75 pointer-events-none"
              : "hover:border-cyan-500/50 hover:shadow-md"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            {navigatingTo === "/dashboard/tugas" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <BookOpen className="w-6 h-6" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
              Tugas &amp; PR Kelas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {user.role === "sekertaris"
                ? "Kelola & bagikan daftar tugas kelas"
                : "Lihat daftar tugas & PR aktif"}
            </p>
          </div>
        </Link>
      </div>

      {/* STUDENT VIEW (shown for non-privileged roles: student, sekertaris, bendahara, keamanan, kebersihan) */}
      {!ATTENDANCE_PRIVILEGED_ROLES.includes(user.role) && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Kehadiran Hari Ini (1/3) */}
            <div className="lg:col-span-1 bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <h2
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6"
                  data-i18n="dash.today_status"
                >
                  {t("dash.today_status")}
                </h2>

                {todayAttendance ? (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    {todayAttendance.status === "hadir" ? (
                      <>
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                          Anda Sudah Hadir
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2">
                          Terima kasih sudah absen via mesin IoT hari ini.
                        </p>
                        {todayAttendance.time && (
                          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tercatat: {todayAttendance.time} WIB</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
                          <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                          Status: {todayAttendance.status}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-2">{todayAttendance.notes || "-"}</p>
                        {todayAttendance.time && (
                          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Diajukan: {todayAttendance.time} WIB</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="text-center py-4 mb-4">
                      <div className="inline-block w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 mb-3 mx-auto">
                        <Clock className="w-8 h-8" />
                      </div>
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Belum Absen</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Tempelkan kartu Anda ke mesin IoT di kelas.
                      </p>
                    </div>

                    <hr className="border-zinc-200 dark:border-zinc-800 mb-5" />

                    <h4 className="font-medium text-xs text-zinc-900 dark:text-zinc-100 mb-3">
                      Atau ajukan izin / sakit:
                    </h4>
                    <form onSubmit={submitIzin} className="space-y-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Status</label>
                        <select
                          value={izinStatus}
                          onChange={(e) => setIzinStatus(e.target.value as "izin" | "sakit")}
                          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 py-2 px-3 text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-accent-600 outline-none"
                        >
                          <option value="izin">Izin</option>
                          <option value="sakit">Sakit</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">
                          Keterangan (Wajib)
                        </label>
                        <textarea
                          required
                          rows={2}
                          value={izinNotes}
                          onChange={(e) => setIzinNotes(e.target.value)}
                          placeholder="Contoh: Mengikuti lomba / Sakit demam..."
                          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-800 py-2 px-3 text-xs text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-accent-600 outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingIzin}
                        className="w-full rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-2.5 text-xs font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                      >
                        {submittingIzin ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>Kirim Pengajuan</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Riwayat Absensi Bulan Ini (2/3) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Riwayat Bulan Ini
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">30 Catatan Terakhir</p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-sm">
                  Belum ada riwayat absensi.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[10px]">
                        <th className="py-3 px-3 font-semibold">Tanggal</th>
                        <th className="py-3 px-3 font-semibold">Waktu</th>
                        <th className="py-3 px-3 font-semibold">Status</th>
                        <th className="py-3 px-3 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {history.map((record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <td className="py-3 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                            {formatIndoDate(record.date)}
                          </td>
                          <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                            {record.time ? `${record.time} WIB` : "-"}
                          </td>
                          <td className="py-3 px-3">
                            {record.status === "hadir" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                Hadir
                              </span>
                            )}
                            {record.status === "izin" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Izin
                              </span>
                            )}
                            {record.status === "sakit" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                                Sakit
                              </span>
                            )}
                            {record.status !== "hadir" &&
                              record.status !== "izin" &&
                              record.status !== "sakit" && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                                  Alpa
                                </span>
                              )}
                          </td>
                          <td className="py-3 px-3 text-zinc-500">{record.notes || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Kotak Surat Menfess & Songfess Saya */}
          <div
            id="menfess-inbox"
            className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 rounded-2xl border border-pink-200/60 dark:border-pink-800/60 shadow-xs shrink-0 text-xl">
                  💌
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      Kotak Surat Menfess &amp; Songfess
                    </h2>
                    {unreadCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-pink-500 text-white animate-pulse">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Pesan rahasia dan persembahan lagu yang dikirimkan khusus untukmu
                  </p>
                </div>
              </div>

              <Link
                href="/menfess"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition shrink-0"
              >
                <span>Lihat Feed Menfess Kelas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {receivedMenfesses.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center text-xl mb-2">
                  📬
                </div>
                <p className="font-medium">Belum ada menfess yang masuk untukmu.</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Pesan dari teman atau secret admirer akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedMenfesses.map((mf) => (
                  <div
                    key={mf.id}
                    className={`rounded-2xl border p-5 transition-all ${
                      !mf.is_read
                        ? "bg-pink-50/40 dark:bg-pink-950/20 border-pink-300/80 dark:border-pink-900/60 ring-1 ring-pink-500/20"
                        : "bg-zinc-50/60 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            mf.type === "songfess"
                              ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                              : "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40"
                          }`}
                        >
                          {mf.type === "songfess" ? "🎵 Songfess" : "✉️ Menfess"}
                        </span>
                        {!mf.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500 text-white animate-pulse">
                            BARU
                          </span>
                        )}
                        <span className="text-xs text-zinc-600 dark:text-zinc-300">
                          Dari:{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {mf.sender_name}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 self-start sm:self-center">
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {formatRelativeTime(mf.created_at)}
                        </span>
                        {!mf.is_read && (
                          <button
                            type="button"
                            disabled={markingReadId === mf.id}
                            onClick={() => handleMarkAsRead(mf.id)}
                            className="text-[11px] font-bold text-pink-600 hover:text-pink-800 dark:text-pink-400 cursor-pointer underline inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            {markingReadId === mf.id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Menandai...</span>
                              </>
                            ) : (
                              <span>Tandai Sudah Dibaca</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed mb-3">
                      {mf.message}
                    </p>

                    {mf.type === "songfess" && mf.song_title && (
                      <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative flex items-center justify-center shadow-xs">
                            {mf.song_album_art ? (
                              <img
                                src={mf.song_album_art}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-purple-600 text-xl">🎵</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                              Lagu Yang Dipersembahkan:
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {mf.song_title}
                            </h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                              {mf.song_artist}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePlaySongfess(mf)}
                          disabled={loadingSongfessId === mf.id}
                          className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-75 ${
                            playingSongfess?.id === mf.id && isPlayingAudio
                              ? "bg-pink-600 hover:bg-pink-700 shadow-pink-600/20"
                              : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                          }`}
                        >
                          {loadingSongfessId === mf.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Memuat...</span>
                            </>
                          ) : playingSongfess?.id === mf.id && isPlayingAudio ? (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>Jeda</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Putar</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN, TEACHER, KETUA & WAKIL KETUA VIEW */}
      {ATTENDANCE_PRIVILEGED_ROLES.includes(user.role) && (
        <div className="space-y-6">
          {/* Tanggal Rekapitulasi Selector Bar */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Rekapitulasi Absensi
                  </span>
                  {isLoadingAttendanceDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memuat data...</span>
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  Tanggal Rekap: <span className="text-emerald-600 dark:text-emerald-400">{currentSelectedDateLabel}</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Pilih hari untuk melihat statistik kehadiran dan rincian absen siswa pada tanggal tersebut.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-center">
              {/* Dropdown Options */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Pilih Hari (Daftar Rekap):
                </label>
                <select
                  value={selectedAttendanceDate}
                  disabled={isLoadingAttendanceDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs min-w-[210px]"
                >
                  {attendanceDateOptions.map((opt) => (
                    <option key={opt.date} value={opt.date}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arbitrary Calendar Picker */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Kalender Bebas:
                </label>
                <input
                  type="date"
                  value={selectedAttendanceDate}
                  disabled={isLoadingAttendanceDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
                  title="Pilih tanggal bebas dari kalender"
                />
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {adminStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">
                  Total Siswa
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  {adminStats.total}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold mb-1">
                  Hadir (IoT)
                </p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-500">
                  {adminStats.hadir}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/50 shadow-xs">
                <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold mb-1">
                  Izin / Sakit
                </p>
                <p className="text-3xl font-bold text-amber-700 dark:text-amber-500">
                  {adminStats.izin + adminStats.sakit}
                </p>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl border border-rose-100 dark:border-rose-900/50 shadow-xs">
                <p className="text-xs text-rose-600 dark:text-rose-400 uppercase tracking-wider font-semibold mb-1">
                  Belum Absen (Alpa)
                </p>
                <p className="text-3xl font-bold text-rose-700 dark:text-rose-500">
                  {adminStats.alpa}
                </p>
              </div>
            </div>
          )}

          {/* Admin Password Reset Quick Card */}
          {user.role === "admin" && (
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>Pusat Reset Password Siswa</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                        Khusus Admin
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                      Jika siswa lupa password, Anda dapat mereset akun mereka ke password default:{" "}
                      <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                        12345678
                      </code>
                      .
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0 w-full sm:w-auto">
                  <select
                    value={quickResetUserId}
                    onChange={(e) => setQuickResetUserId(e.target.value)}
                    className="text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none flex-1 sm:flex-initial"
                  >
                    <option value="">-- Pilih Siswa Untuk Direset --</option>
                    {adminStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis || "No NIS"})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isQuickResetting || !quickResetUserId}
                    onClick={handleQuickReset}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isQuickResetting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mereset...</span>
                      </>
                    ) : (
                      <span>Reset to Default</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rekapitulasi Kehadiran Kelas Table */}
          <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Rekapitulasi Kehadiran Kelas ({currentSelectedDateLabel})
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pemantauan data kehadiran siswa pada {currentSelectedDateLabel}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-xs font-semibold text-zinc-700 dark:text-zinc-300 self-start sm:self-auto">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>{currentSelectedDateLabel}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[10px]">
                    <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                    <th className="py-3 px-4 font-semibold">NIS</th>
                    <th className="py-3 px-4 font-semibold">Role / Jabatan</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Waktu Absen</th>
                    <th className="py-3 px-4 font-semibold">Keterangan</th>
                    {user.role === "admin" && (
                      <th className="py-3 px-4 font-semibold text-center">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {adminStudents.map((student) => {
                    const studentRole = student.role || "student";
                    const roleConfig = ROLE_CONFIGS[studentRole] || {
                      label: studentRole,
                      badgeClass: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200",
                    };

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {student.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-500">{student.nis}</td>
                        <td className="py-3 px-4">
                          {user.role === "admin" ? (
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                value={studentRole}
                                disabled={updatingRoleId === student.id}
                                onChange={(e) =>
                                  handleUpdateRole(student.id, student.name, e.target.value)
                                }
                                className={`text-[11px] font-bold rounded-lg border px-2 py-1 outline-none transition cursor-pointer shadow-2xs ${roleConfig.badgeClass} disabled:opacity-50`}
                                title="Ubah role / jabatan siswa ini"
                              >
                                {ASSIGNABLE_ROLES.map((r) => (
                                  <option
                                    key={r.value}
                                    value={r.value}
                                    className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-normal"
                                  >
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                              {updatingRoleId === student.id && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-500" />
                              )}
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${roleConfig.badgeClass}`}
                            >
                              {roleConfig.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {student.status === "hadir" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                              Hadir
                            </span>
                          )}
                          {student.status === "izin" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              Izin
                            </span>
                          )}
                          {student.status === "sakit" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                              Sakit
                            </span>
                          )}
                          {student.status !== "hadir" &&
                            student.status !== "izin" &&
                            student.status !== "sakit" && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                                Belum Absen
                              </span>
                            )}
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                          {student.time ? (
                            <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              {student.time} WIB
                            </span>
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">{student.notes || "-"}</td>
                        {user.role === "admin" && (
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              disabled={resettingStudentId === student.id}
                              onClick={() => handleResetPassword(student.id, student.name)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/50 transition cursor-pointer shadow-xs disabled:opacity-50"
                              title="Reset password siswa ini ke default (12345678)"
                            >
                              {resettingStudentId === student.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Mereset...</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Reset 12345678</span>
                                </>
                              )}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* KELOLA OUR MEMORIES & KENANGAN KELAS SECTION */}
      <div
        id="memories-section"
        className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 transition-colors space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-800/60 shadow-xs">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Our Memories
                </span>
                <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                  {memoryList.length} Foto Tersimpan
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {user.role === "admin"
                  ? "Pusat Pengelolaan Foto Kenangan (Admin)"
                  : "Galeri Kenangan & Our Memories"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-2xl">
                {user.role === "admin"
                  ? "Kelola semua foto kenangan kelas yang tampil di Landing Page. Anda dapat mengunggah momen baru atau menghapus foto yang kurang sesuai."
                  : "Bagikan momen berharga dan kenangan serumu bersama kawan 10 RPL. Setiap foto yang kamu unggah akan otomatis tampil di Landing Page!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
            <Link
              href="/#memories"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700/60 transition shadow-xs"
            >
              <span>Lihat di Landing Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                handleClearSelectedFile();
                setUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-accent-600 hover:from-rose-600 hover:to-accent-700 text-white shadow-sm hover:scale-[1.02] active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Kenangan Baru</span>
            </button>
          </div>
        </div>

        {/* List of Memories */}
        {memoryList.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 mx-auto flex items-center justify-center mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-1">
              Belum Ada Foto Kenangan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
              Jadilah yang pertama mengunggah momen indah bersama kelas 10 RPL ke Landing Page!
            </p>
            <button
              type="button"
              onClick={() => {
                handleClearSelectedFile();
                setUploadModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Kenangan Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {memoryList.map((item) => {
              const canDelete =
                user.role === "admin" ||
                (item.user_id !== null && Number(item.user_id) === Number(user.id));

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-950/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                >
                  {/* Image View */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

                    {/* Badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/70 text-white border border-white/15 backdrop-blur-xs">
                        {item.tag}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-xs">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.description || "Tidak ada keterangan."}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[60%]">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                        <span className="truncate">{item.user_name}</span>
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={item.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                          title="Lihat Foto Full"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmMemory(item)}
                            className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 transition cursor-pointer"
                            title="Hapus Kenangan Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Jadwal Pelajaran Interaktif */}
      <div className="pt-4">
        <ClassSchedule />
      </div>

      {/* Floating Mini Music Player Bar */}
      {playingSongfess && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-2xl p-3 sm:p-3.5 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative shadow-xs flex items-center justify-center">
                {playingSongfess.art ? (
                  <img
                    src={playingSongfess.art}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-purple-600 text-lg">🎵</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                  <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    Memutar Lagu
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {playingSongfess.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {playingSongfess.artist}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) {
                    if (isPlayingAudio) {
                      audioRef.current.pause();
                      setIsPlayingAudio(false);
                    } else {
                      audioRef.current.play().catch(console.error);
                      setIsPlayingAudio(true);
                    }
                  }
                }}
                className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
              >
                {isPlayingAudio ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.pause();
                  setPlayingSongfess(null);
                  setIsPlayingAudio(false);
                }}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                title="Tutup Pemutar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti Password */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Ganti Password Akun
              </h3>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={updatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Password Baru (Min. 8 Karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingPassword}
                className="w-full py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {submittingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>Simpan Password Baru</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Upload Memory Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200 dark:border-zinc-800 shadow-2xl my-8">
            <button
              onClick={() => {
                if (!isUploadingMemory) {
                  handleClearSelectedFile();
                  setUploadModalOpen(false);
                }
              }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Unggah Foto Kenangan Baru
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Foto akan disimpan di ImgBB dan langsung muncul di Landing Page.
                </p>
              </div>
            </div>

            <form onSubmit={handleUploadMemorySubmit} className="space-y-4">
              {/* Image Picker Dropzone */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Pilih Foto Kenangan *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectMemoryFile}
                  className="hidden"
                  id="memory-file-input"
                />

                {memPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-[16/10] bg-zinc-950">
                    <img
                      src={memPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="memory-file-input"
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-900 font-bold text-xs cursor-pointer hover:bg-zinc-100 shadow-md transition"
                      >
                        Ganti Foto
                      </label>
                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="memory-file-input"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-2xl p-6 cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 text-zinc-400 group-hover:text-rose-500 flex items-center justify-center transition mb-2">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Klik untuk memilih foto dari perangkat
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1">
                      Mendukung format JPG, PNG, WEBP (Maksimal 15 MB)
                    </span>
                  </label>
                )}
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Judul Kenangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Canda Tawa di Koridor Kelas"
                  value={memTitle}
                  onChange={(e) => setMemTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Tag / Category Select */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Kategori / Tag
                </label>
                <select
                  value={memTag}
                  onChange={(e) => setMemTag(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Kegiatan Kelas">Kegiatan Kelas</option>
                  <option value="Praktikum Lab">Praktikum Lab</option>
                  <option value="Koridor 10 RPL">Koridor 10 RPL</option>
                  <option value="Solidaritas 10 RPL">Solidaritas 10 RPL</option>
                  <option value="Acara Sekolah">Acara Sekolah</option>
                  <option value="Lapangan & Olahraga">Lapangan &amp; Olahraga</option>
                  <option value="Wali Kelas & Guru">Wali Kelas &amp; Guru</option>
                  <option value="Vintage Memory">Vintage Memory</option>
                </select>
              </div>

              {/* Description / Caption */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Cerita / Keterangan Singkat (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan momen seru di balik foto ini..."
                  value={memDescription}
                  onChange={(e) => setMemDescription(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isUploadingMemory}
                  onClick={() => {
                    handleClearSelectedFile();
                    setUploadModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isUploadingMemory}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-accent-600 hover:from-rose-600 hover:to-accent-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-75"
                >
                  {isUploadingMemory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunggah ke ImgBB...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Unggah ke Landing Page</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmMemory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Hapus Foto Kenangan?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center gap-3">
              <img
                src={deleteConfirmMemory.image_url}
                alt=""
                className="w-14 h-14 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {deleteConfirmMemory.title}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate">
                  {deleteConfirmMemory.tag} • {deleteConfirmMemory.date}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Foto ini akan dihapus permanen dari Landing Page dan database server.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingMemory}
                onClick={() => setDeleteConfirmMemory(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingMemory}
                onClick={handleDeleteMemorySubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-75"
              >
                {isDeletingMemory ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Foto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
