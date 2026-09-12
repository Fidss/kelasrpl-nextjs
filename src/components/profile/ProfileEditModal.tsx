"use client";

import { useState, useRef } from "react";
import { X, Camera, Trash2, Loader2, Check, User, Sparkles } from "lucide-react";

export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: number;
    name: string;
    nis?: string;
    role?: string;
    gender?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  };
  onProfileUpdated: (updatedUser: any) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: ProfileEditModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.avatar_url || null
  );
  const [bio, setBio] = useState<string>(user.bio || "");
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Harap pilih file gambar (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 10 MB.");
      return;
    }

    setErrorMsg("");
    setSelectedFile(file);
    setIsRemoving(false);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRemoving(true);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      if (isRemoving) {
        formData.append("remove_avatar", "true");
      } else if (selectedFile) {
        formData.append("photo", selectedFile);
      }
      formData.append("bio", bio.trim());

      const res = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      setSuccessMsg("Foto profil berhasil diperbarui!");
      onProfileUpdated(data.user);

      // Trigger custom event so any component listening can update immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("user-profile-updated", { detail: data.user })
        );
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayAvatar =
    previewUrl || (isRemoving ? DEFAULT_AVATAR_URL : (user.avatar_url || DEFAULT_AVATAR_URL));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header (Fixed at top) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center font-bold text-sm shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                Ubah Foto Profil
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Sesuaikan foto profil akun Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form with Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Avatar Preview & Actions */}
            <div className="flex flex-col items-center gap-3.5">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-accent-500/20 dark:ring-accent-500/30 overflow-hidden bg-zinc-100 dark:bg-zinc-800 shadow-inner flex items-center justify-center">
                  <img
                    src={displayAvatar}
                    alt={user.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>

                {/* Quick Upload Trigger overlay on Avatar */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity cursor-pointer text-xs font-medium gap-1"
                  title="Ganti Foto"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px]">Pilih Foto</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-accent-500" />
                  <span>Upload Foto Baru</span>
                </button>

                {(previewUrl || user.avatar_url) && !isRemoving && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    title="Gunakan avatar default"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              <p className="text-[10px] text-zinc-400 text-center max-w-xs leading-relaxed">
                Mendukung file JPG, PNG, atau WEBP (Maksimal 10 MB). Foto profil akan muncul di percakapan dan di landing page.
              </p>
            </div>

            {/* User Bio Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Status / Bio Singkat (Opsional)
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Belajar coding dan web dev..."
                maxLength={150}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
              />
              <p className="text-[10px] text-zinc-400 text-right">
                {bio.length}/150 karakter
              </p>
            </div>

            {/* User Info Read-only */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Nama Lengkap</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[180px]">
                  {user.name}
                </span>
              </div>
              {user.nis && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">NIS Siswa</span>
                  <span className="font-mono text-zinc-600 dark:text-zinc-400">
                    {user.nis}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-accent-600/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
