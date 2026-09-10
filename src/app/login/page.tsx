"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import LanguageSelector from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    window.addEventListener("theme-changed", checkDark);
    return () => {
      window.removeEventListener("theme-changed", checkDark);
    };
  }, []);

  const toggleTheme = () => {
    if (typeof (window as unknown as { toggleTheme?: () => void }).toggleTheme === "function") {
      (window as unknown as { toggleTheme: () => void }).toggleTheme();
      setIsDark(document.documentElement.classList.contains("dark"));
    } else {
      const nextDark = !isDark;
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      window.dispatchEvent(
        new CustomEvent("theme-changed", { detail: { isDark: nextDark } })
      );
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal masuk. Periksa kembali NIS/Nama dan Password Anda.");
        setLoading(false);
        return;
      }

      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi gangguan koneksi. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
        <LanguageSelector />
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 transition cursor-pointer flex items-center justify-center shadow-xs"
          title={t("nav.theme_toggle")}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-accent-600/20">
              10
            </div>
            <span className="font-bold text-2xl tracking-tight">RPL</span>
          </Link>
        </div>
        <h2
          className="mt-4 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
          data-i18n="auth.title"
        >
          {t("auth.title")}
        </h2>
        <p
          className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400"
          data-i18n="auth.subtitle"
        >
          {t("auth.subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-zinc-200 dark:border-zinc-800">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                data-i18n="auth.identifier_label"
              >
                {t("auth.identifier_label")}
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("auth.identifier_placeholder")}
                data-i18n-placeholder="auth.identifier_placeholder"
                className="block w-full rounded-xl py-3 px-4 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-600 text-sm transition-all"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                data-i18n="auth.password"
              >
                {t("auth.password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-xl py-3 pl-4 pr-11 text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-600 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-accent-600 shadow-md shadow-accent-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span data-i18n="auth.btn">{loading ? "Memverifikasi..." : t("auth.btn")}</span>
            </button>
          </form>

          {/* Forgot Password Tip matching Laravel */}
          <div className="mt-6 p-4 rounded-xl bg-accent-50/50 dark:bg-accent-950/20 border border-accent-200/50 dark:border-accent-800/30 text-xs text-accent-700 dark:text-accent-300 flex items-start gap-3">
            <span className="text-base leading-none">💡</span>
            <div>
              <strong className="block font-semibold mb-0.5" data-i18n="auth.forgot_tip_title">
                {t("auth.forgot_tip_title")}
              </strong>
              <span data-i18n="auth.forgot_tip_desc">
                {t("auth.forgot_tip_desc")}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors"
            >
              &larr; <span data-i18n="auth.back_home">{t("auth.back_home")}</span>{" "}
              <span data-i18n="auth.home_link" className="underline">{t("auth.home_link")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
