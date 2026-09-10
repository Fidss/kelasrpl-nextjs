"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Server,
  Database,
  Users,
  MessageSquare,
  Calendar,
  Lock,
  Power,
  LogOut,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface ControlClientProps {
  authenticated: boolean;
  stats?: {
    totalUsers: number;
    totalChats: number;
    todayAttendance: number;
    dbStatus: string;
    dbHost: string;
    framework: string;
  };
  control?: {
    is_shutdown: boolean;
    mode: string;
    title: string;
    message: string;
  };
}

export default function ControlClient({
  authenticated,
  stats,
  control,
}: ControlClientProps) {
  const router = useRouter();

  // Login state
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Toggle state
  const [isShutdown, setIsShutdown] = useState(control?.is_shutdown || false);
  const [mode, setMode] = useState(control?.mode || "maintenance");
  const [toggling, setToggling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch("/api/control/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Akses ditolak.");
      } else {
        router.refresh();
      }
    } catch {
      setLoginError("Terjadi gangguan jaringan.");
    }
    setLoggingIn(false);
  };

  const handleLogout = async () => {
    await fetch("/api/control/logout", { method: "POST" });
    router.refresh();
  };

  const handleToggle = async (newShutdown: boolean) => {
    setToggling(true);
    setMessage(null);

    try {
      const res = await fetch("/api/control/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_shutdown: newShutdown,
          mode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsShutdown(newShutdown);
        setMessage(data.message);
        router.refresh();
      }
    } catch {}
    setToggling(false);
  };

  // 1. LOGIN GATE
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-950/60 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SERVER CONTROL ROOM</h1>
            <p className="text-xs text-zinc-400">
              Area terbatas. Masukkan Security Code untuk mengakses control switch.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                SECURITY ACCESS CODE
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kode otentikasi..."
                className="w-full rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm text-white font-mono tracking-widest focus:outline-hidden focus:ring-2 focus:ring-red-500"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>OTENTIKASI KE SERVER</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
              &larr; Kembali ke Portal Publik
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">CONTROL ROOM — 10 RPL</h1>
              <p className="text-xs text-zinc-400 font-mono">Status: MONITORING AKTIF</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              Portal Depan
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-950/60 border border-red-800/60 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <Users className="w-4 h-4" />
                <span>TOTAL AKUN</span>
              </div>
              <p className="text-3xl font-bold font-mono">{stats.totalUsers}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <MessageSquare className="w-4 h-4" />
                <span>PESAN ELOSTRA</span>
              </div>
              <p className="text-3xl font-bold font-mono">{stats.totalChats}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                <Calendar className="w-4 h-4" />
                <span>ABSENSI HARI INI</span>
              </div>
              <p className="text-3xl font-bold font-mono">{stats.todayAttendance}</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                <Database className="w-4 h-4" />
                <span>DB SUPABASE</span>
              </div>
              <p className="text-xl font-bold text-emerald-400">{stats.dbStatus}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">{stats.dbHost}</p>
            </div>
          </div>
        )}

        {/* Emergency System Toggle Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Power className="w-5 h-5 text-red-500" />
              <span>EMERGENCY SWITCH &amp; SYSTEM TOGGLE</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Gunakan kontrol ini jika sistem memerlukan pemeliharaan darurat atau penonaktifan sementara.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">STATUS SAAT INI:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase font-mono ${
                    isShutdown
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {isShutdown ? `NONAKTIF (${mode.toUpperCase()})` : "NORMAL / OPERASIONAL"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {isShutdown
                  ? "Akses pengguna publik saat ini ditutup."
                  : "Seluruh layanan berjalan normal dan dapat diakses siswa."}
              </p>
            </div>

            <div className="flex gap-2">
              {isShutdown ? (
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => handleToggle(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
                >
                  {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  <span>KEMBALIKAN KE NORMAL</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={toggling}
                  onClick={() => handleToggle(true)}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-xs"
                >
                  {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>AKTIFKAN MAINTENANCE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
