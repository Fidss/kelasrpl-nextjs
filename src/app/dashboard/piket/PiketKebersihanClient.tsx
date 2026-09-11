"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Camera,
  X,
  Check,
  UserCheck,
  Users,
  Loader2,
  Trash2,
  ZoomIn,
  AlertCircle,
  CheckCircle2,
  Shield,
  Crown,
  Sparkles,
  Award,
  Edit3,
  UserX,
} from "lucide-react";

const ROLE_ICONS: Record<string, React.ComponentType<Record<string, unknown>>> = {
  admin: Shield,
  teacher: Award,
  ketuakelas: Crown,
  wakilketuakelas: Sparkles,
  kebersihan: Users,
  student: UserCheck,
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin Kelas",
  teacher: "Guru / Wali Kelas",
  ketuakelas: "Ketua Kelas",
  wakilketuakelas: "Wakil Ketua Kelas",
  kebersihan: "Seksi Kebersihan",
  student: "Murid (Siswa)",
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50",
  teacher: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50",
  ketuakelas: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
  wakilketuakelas: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50",
  kebersihan: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50",
  student: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50",
};

interface PiketRosterItem {
  order: number;
  piket_name: string;
  matched_student_id: number | null;
  matched_student_name: string | null;
  matched_nis: string | null;
}

interface NoPiketItem {
  id?: number;
  name?: string;
  piket_name?: string;
  matched_student_name?: string | null;
  matched_nis?: string | null;
  [key: string]: unknown;
}

interface StudentItem {
  id: number;
  name: string;
  nis: string;
  gender: string;
  role: string;
}

interface PiketRecord {
  id: number;
  piket_date: string;
  photo_url: string;
  delete_url: string | null;
  uploader_id: number | null;
  uploader_name: string;
  no_piket_list: NoPiketItem[];
  created_at: string | null;
  updated_at: string | null;
}

interface UserType {
  id: number;
  name: string;
  nis: string;
  role: string;
}

interface PiketKebersihanClientProps {
  user: UserType;
  today: string;
  todayLabel: string;
  dayName: string;
  isWeekend: boolean;
  canUpload: boolean;
  piketRoster: PiketRosterItem[];
  piketCount: number;
  notOnPiketStudents: StudentItem[];
  notOnPiketCount: number;
  piketRecord: PiketRecord | null;
}

export default function PiketKebersihanClient({
  user,
  today,
  todayLabel,
  dayName,
  isWeekend,
  canUpload,
  piketRoster = [],
  piketCount = 0,
  notOnPiketStudents = [],
  notOnPiketCount = 0,
  piketRecord = null,
}: PiketKebersihanClientProps) {
  const router = useRouter();

  // Upload Form State
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedNoPiket, setSelectedNoPiket] = useState<NoPiketItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [localPiketRecord, setLocalPiketRecord] = useState<PiketRecord | null>(piketRecord);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Close lightbox on Escape
  const handleLightboxKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setLightboxUrl(null);
  }, []);

  useEffect(() => {
    if (lightboxUrl) {
      document.addEventListener("keydown", handleLightboxKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleLightboxKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxUrl, handleLightboxKeyDown]);

  // Sync localPiketRecord when prop changes
  useEffect(() => {
    setLocalPiketRecord(piketRecord);
  }, [piketRecord]);

  const piketRosterStudents = piketRoster.map((r) => ({
    id: r.matched_student_id ?? 0,
    name: r.matched_student_name || r.piket_name,
    nis: r.matched_nis || "-",
    piket_name: r.piket_name,
  }));

  // Format relative time
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
      return new Date(isoStr).toLocaleDateString("id-ID");
    } catch {
      return "";
    }
  }

  // Handle photo selection
  const handleSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setPhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);
  };

  const handleClearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Toggle student in no_piket selection
  const toggleNoPiket = (student: { id: number; name: string; nis: string; piket_name: string }) => {
    setSelectedNoPiket((prev) => {
      const exists = prev.some(
        (s) => (s.id && s.id === student.id) || s.piket_name === student.piket_name
      );
      if (exists) {
        return prev.filter(
          (s) => !((s.id && s.id === student.id) || s.piket_name === student.piket_name)
        );
      }
      return [...prev, student];
    });
  };

  // Switch to edit mode with existing selections
  const startEditMode = () => {
    if (localPiketRecord) {
      setSelectedNoPiket(localPiketRecord.no_piket_list || []);
      setPhotoPreview(localPiketRecord.photo_url || null);
    }
    setIsEditing(true);
  };

  const cancelEditMode = () => {
    setIsEditing(false);
    handleClearPhoto();
    setSelectedNoPiket([]);
  };

  // Submit piket form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile && !localPiketRecord?.photo_url) {
      setAlert({ type: "error", text: "Silakan pilih foto piket kelas terlebih dahulu." });
      return;
    }

    setIsUploading(true);
    setAlert(null);

    try {
      const formData = new FormData();
      if (photoFile) {
        formData.append("photo", photoFile);
      } else if (localPiketRecord?.photo_url) {
        // Fetch existing image as blob or keep current
        // If no new photo chosen during edit, we can send existing image URL or require re-select
      }
      formData.append("no_piket", JSON.stringify(selectedNoPiket));

      // Note: If no new photoFile during edit, we require photo selection or upload
      if (!photoFile) {
        setAlert({ type: "error", text: "Silakan pilih foto bukti piket untuk diunggah." });
        setIsUploading(false);
        return;
      }

      const res = await fetch("/api/piket", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal menyimpan data piket kebersihan." });
      } else {
        setAlert({ type: "success", text: data.message || "Data piket kebersihan berhasil disimpan!" });
        setLocalPiketRecord(data.data);
        setIsEditing(false);
        handleClearPhoto();
        setSelectedNoPiket([]);
        router.refresh();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan koneksi saat mengunggah foto." });
    } finally {
      setIsUploading(false);
    }
  };

  // Clear all no_piket selections (when piket is complete for all)
  const handleClearSelections = () => {
    setSelectedNoPiket([]);
  };

  // Select all piket roster students as not piket
  const handleSelectAllAsNoPiket = () => {
    setSelectedNoPiket(piketRosterStudents);
  };

  // Delete piket record
  const handleDeleteRecord = async () => {
    if (!localPiketRecord) return;
    if (!confirm(`Hapus data piket kebersihan untuk tanggal ${todayLabel}?`)) return;

    try {
      const res = await fetch(`/api/piket?date=${encodeURIComponent(today)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: "success", text: data.message });
        setLocalPiketRecord(null);
        setIsEditing(false);
        router.refresh();
      } else {
        setAlert({ type: "error", text: data.error || "Gagal menghapus data." });
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi kesalahan saat menghapus data." });
    }
  };

  const RoleIcon = ROLE_ICONS[user.role] || UserCheck;
  const roleBadgeClass = ROLE_BADGE_CLASSES[user.role] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200";

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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-200/60 dark:border-teal-800/60 shadow-xs shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Data Piket Kebersihan Kelas
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {todayLabel} • {dayName}
              {isWeekend && " (Akhir Pekan)"}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${roleBadgeClass}`}
        >
          <RoleIcon className="w-3.5 h-3.5" />
          <span>{ROLE_LABELS[user.role] || user.role}</span>
        </span>
      </div>

      {/* Weekend Warning */}
      {isWeekend && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>Hari ini adalah akhir pekan ({["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][new Date().getDay()]}). Jadwal piket hanya berlaku hari Senin - Jumat.</span>
        </div>
      )}

      {/* Piket Roster Section */}
      <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Daftar Regu Piket Hari Ini ({dayName})
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {piketCount} siswa bertugas piket kebersihan kelas hari ini
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            {piketCount} Orang
          </span>
        </div>

        {piketCount === 0 ? (
          <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">
            {isWeekend
              ? "Tidak ada jadwal piket pada akhir pekan."
              : "Tidak ada jadwal piket untuk hari ini."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {piketRoster.map((item) => (
              <div
                key={item.order}
                className="p-4 rounded-2xl border transition-all flex items-center gap-3.5 bg-zinc-50/80 dark:bg-zinc-800/40 border-zinc-200/80 dark:border-zinc-800"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800/40">
                  {item.order}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {item.matched_student_name || item.piket_name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    NIS: {item.matched_nis || "-"} • Jadwal: {item.piket_name}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                    Piket
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar: Upload Form (kebersihan/admin) vs View Only */}
      {canUpload ? (
        <div className="space-y-6">
          {/* Upload / Edit Form */}
          {!localPiketRecord || isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload */}
              <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span>{isEditing ? "Ubah Bukti Foto Piket" : "Unggah Bukti Foto Piket Hari Ini"}</span>
                  </h2>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEditMode}
                      className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                  Unggah foto bukti kegiatan piket kebersihan kelas hari ini. Foto disimpan secara aman di storage cloud.
                </p>

                {!photoPreview ? (
                  <label
                    htmlFor="piket-photo-input"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-8 cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 transition group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-teal-50 dark:group-hover:bg-teal-950/40 text-zinc-400 group-hover:text-teal-500 flex items-center justify-center transition mb-3">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Klik untuk pilih foto dari perangkat
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-1">
                      Mendukung JPG, PNG, WEBP (Maksimal 15 MB)
                    </span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-[16/9] max-h-96 bg-zinc-950">
                    <img
                      src={photoPreview}
                      alt="Preview Foto Piket"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                      <label
                        htmlFor="piket-photo-input"
                        className="px-3.5 py-2 rounded-xl bg-white text-zinc-900 font-bold text-xs cursor-pointer hover:bg-zinc-100 shadow-md transition"
                      >
                        Ganti Foto
                      </label>
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shadow-md transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectPhoto}
                  className="hidden"
                  id="piket-photo-input"
                />
              </div>

              {/* No Piket Selection */}
              {piketCount > 0 && (
                <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4 gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <UserX className="w-5 h-5 text-rose-500" />
                        <span>Siswa yang Tidak Piket / Tidak Hadir</span>
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Centang nama siswa dari regu piket hari ini yang <strong>tidak menjalankan piket</strong>.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 self-start sm:self-auto">
                      {selectedNoPiket.length} Siswa Tidak Piket
                    </span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 bg-zinc-50/50 dark:bg-zinc-800/30">
                    {piketRosterStudents.map((student) => {
                      const isSelected = selectedNoPiket.some(
                        (s) => (s.id && s.id === student.id) || s.piket_name === student.piket_name
                      );
                      return (
                        <div
                          key={student.piket_name}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                            isSelected
                              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          }`}
                          onClick={() => toggleNoPiket(student)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              {student.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className={`text-sm font-semibold ${isSelected ? "text-rose-900 dark:text-rose-200" : "text-zinc-900 dark:text-zinc-100"}`}>
                                {student.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                NIS: {student.nis} • Jadwal: {student.piket_name}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition ${
                              isSelected
                                ? "bg-rose-600 border-rose-600 text-white"
                                : "border-zinc-300 dark:border-zinc-600"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action helpers */}
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {selectedNoPiket.length === 0
                        ? "Semua siswa regu piket hadir dan bertugas."
                        : `${selectedNoPiket.length} siswa ditandai tidak piket.`}
                    </p>
                    <div className="flex gap-2">
                      {selectedNoPiket.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearSelections}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/60 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Semua Piket Selesai</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSelectAllAsNoPiket}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Tandai Semua Tidak Piket</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                {isEditing && (
                  <button
                    type="button"
                    onClick={cancelEditMode}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-sm transition"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isUploading || !photoFile}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengunggah & Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      <span>{isEditing ? "Perbarui Data Piket" : "Simpan Data Piket Kebersihan"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Existing record view for kebersihan role
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Bukti Piket Kebersihan Hari Ini</span>
                  </h2>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    Diunggah: {formatRelativeTime(localPiketRecord.created_at || "")}
                  </span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mt-6">
                  <div className="lg:w-1/2 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 aspect-[4/3] relative group">
                    <img
                      src={localPiketRecord.photo_url}
                      alt="Bukti Foto Piket"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxUrl(localPiketRecord.photo_url)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Lihat Foto Penuh</span>
                    </button>
                  </div>

                  <div className="lg:w-1/2 space-y-5">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Diunggah Oleh
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {localPiketRecord.uploader_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Tanggal Piket
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {todayLabel} ({dayName})
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                        Status Pelaksanaan Piket
                      </p>
                      {localPiketRecord.no_piket_list && localPiketRecord.no_piket_list.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                            <UserX className="w-4 h-4" />
                            <span>{localPiketRecord.no_piket_list.length} Siswa Tidak Piket:</span>
                          </p>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {localPiketRecord.no_piket_list.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between"
                              >
                                <span>{String(item.piket_name || item.name || item.matched_student_name || "-")}</span>
                                {item.matched_nis && (
                                  <span className="font-mono text-[11px] text-rose-500">
                                    NIS: {String(item.matched_nis)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Semua regu piket hadir dan menyelesaikan tugas dengan baik!</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={startEditMode}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit / Unggah Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteRecord}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Bukti</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // View-only mode for privileged roles (admin, teacher, ketuakelas, wakil)
        <div className="space-y-6">
          {/* Piket Record View (Read Only) */}
          {localPiketRecord ? (
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-2">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Bukti Foto Piket Hari Ini</span>
                </h2>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  Diunggah: {formatRelativeTime(localPiketRecord.created_at || "")}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 mt-6">
                <div className="lg:w-1/2 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 aspect-[4/3] relative">
                  <img
                    src={localPiketRecord.photo_url}
                    alt="Bukti Foto Piket"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(localPiketRecord.photo_url)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Lihat Foto Penuh</span>
                  </button>
                </div>

                <div className="lg:w-1/2 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Diunggah Oleh
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {localPiketRecord.uploader_name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Tanggal Piket
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {todayLabel} ({dayName})
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                      Status Pelaksanaan Piket
                    </p>
                    {localPiketRecord.no_piket_list && localPiketRecord.no_piket_list.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <UserX className="w-4 h-4" />
                          <span>{localPiketRecord.no_piket_list.length} Siswa Tidak Hadir / Tidak Piket:</span>
                        </p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {localPiketRecord.no_piket_list.map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between"
                            >
                              <span>{String(item.piket_name || item.name || item.matched_student_name || "-")}</span>
                              {item.matched_nis && (
                                <span className="font-mono text-[11px] text-rose-500">
                                  NIS: {String(item.matched_nis)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Semua regu piket hadir dan menyelesaikan tugas dengan baik!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center mb-4">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2">
                Belum Ada Bukti Foto Piket Hari Ini
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Seksi Kebersihan belum mengunggah foto piket kebersihan untuk hari ini.
                Halaman ini akan otomatis menampilkan foto dan status begitu diunggah.
              </p>
            </div>
          )}

          {/* Students NOT on piket today */}
          <div className="bg-white dark:bg-zinc-900 shadow-sm rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Daftar Siswa yang Tidak Bertugas Piket Hari Ini
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {notOnPiketCount} siswa yang bertugas pada hari lain
                  </p>
                </div>
              </div>
            </div>

            {notOnPiketCount === 0 ? (
              <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">
                Semua siswa terdaftar dalam regu piket hari ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                {notOnPiketStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold text-xs flex items-center justify-center border border-zinc-300/60 dark:border-zinc-700">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {student.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        NIS: {student.nis} • {student.gender === "P" ? "Perempuan" : "Laki-laki"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ROLE_BADGE_CLASSES[student.role] ||
                        "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200"
                      }`}
                    >
                      {ROLE_LABELS[student.role] || student.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Photo View */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 transition cursor-pointer z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Foto Piket Penuh"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
