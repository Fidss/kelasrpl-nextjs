"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sun,
  Moon,
  Menu,
  X,
  Heart,
  Music,
  Bot,
  LayoutDashboard,
  LogOut,
  Home,
  BookOpen,
  Camera,
  Users,
  MessageSquare,
} from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";
import ProfileEditModal, { DEFAULT_AVATAR_URL } from "@/components/profile/ProfileEditModal";

interface NavbarProps {
  user?: {
    id?: number;
    name: string;
    nis?: string;
    role?: string;
    gender?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } | null;
}

export default function Navbar({ user: initialUser }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name: string;
    nis?: string;
    role?: string;
    gender?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  } | null>(initialUser || null);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [realtimeClock, setRealtimeClock] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync profile update event
  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setCurrentUser((prev: any) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("user-profile-updated" as any, handleProfileUpdate);
    return () => {
      window.removeEventListener(
        "user-profile-updated" as any,
        handleProfileUpdate
      );
    };
  }, []);

  // Sync theme with document class and custom event
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

  // Fetch current user if not provided via props
  useEffect(() => {
    if (initialUser !== undefined) {
      setCurrentUser(initialUser);
      return;
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, [initialUser]);

  // Realtime Jakarta (WIB) Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const jakarta = new Date(utc + 3600000 * 7);
      const h = String(jakarta.getHours()).padStart(2, "0");
      const m = String(jakarta.getMinutes()).padStart(2, "0");
      const s = String(jakarta.getSeconds()).padStart(2, "0");
      setRealtimeClock(`${h}:${m}:${s} WIB`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isLoggedIn = !!currentUser;
  const isLanding = pathname === "/";

  return (
    <>
      <nav className="fixed top-0 w-full z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Mobile hamburger & Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 transition cursor-pointer"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  10
                </div>
                <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                  RPL
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden xl:flex items-center space-x-1 2xl:space-x-1.5 text-xs font-semibold">
              {isLanding ? (
                /* Landing Page: Always show standard landing page anchor links */
                <>
                  <Link
                    href="/#about"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.about"
                  >
                    {t("nav.about")}
                  </Link>
                  <Link
                    href="/#members"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.students"
                  >
                    {t("nav.students")}
                  </Link>
                  <Link
                    href="/#memories"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.memories"
                  >
                    {t("nav.memories")}
                  </Link>
                  <Link
                    href="/#values"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.vision"
                  >
                    {t("nav.vision")}
                  </Link>
                  <Link
                    href="/#schedule"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.schedule"
                  >
                    {t("nav.schedule")}
                  </Link>
                  <Link
                    href="/menfess"
                    className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
                  </Link>
                  <Link
                    href="/music"
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <span>🎵 {t("nav.music")}</span>
                  </Link>
                  <Link
                    href="/studio"
                    className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span data-i18n="nav.studio">{t("nav.studio")}</span>
                  </Link>
                </>
              ) : isLoggedIn ? (
                /* Authenticated Non-Landing Pages (e.g. /dashboard, /chatbot) */
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                      pathname === "/dashboard"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                    data-i18n="nav.dashboard"
                  >
                    {t("nav.dashboard")}
                  </Link>
                  <Link
                    href="/chatbot"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/chatbot")
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-accent-500" />
                    <span data-i18n="nav.chatbot">{t("nav.chatbot")}</span>
                  </Link>
                  <Link
                    href="/learning"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/learning")
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span data-i18n="nav.learning">{t("nav.learning")}</span>
                  </Link>
                  <Link
                    href="/music"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/music")
                        ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-indigo-500" />
                    <span data-i18n="nav.music">{t("nav.music")}</span>
                  </Link>
                  <Link
                    href="/studio"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/studio")
                        ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-accent-500" />
                    <span data-i18n="nav.studio">{t("nav.studio")}</span>
                  </Link>
                  <Link
                    href="/chat"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/chat")
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    <span data-i18n="nav.chat">{t("nav.chat")}</span>
                  </Link>
                  <Link
                    href="/menfess"
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      pathname.startsWith("/menfess")
                        ? "bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/60 dark:border-pink-800/50 font-bold"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
                  </Link>
                </>
              ) : (
                /* Guest Non-Landing Pages */
                <>
                  <Link
                    href="/"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                  >
                    Beranda
                  </Link>
                  <Link
                    href="/#schedule"
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors px-2 py-1"
                    data-i18n="nav.schedule"
                  >
                    {t("nav.schedule")}
                  </Link>
                  <Link
                    href="/menfess"
                    className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
                  </Link>
                  <Link
                    href="/music"
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <span>🎵 {t("nav.music")}</span>
                  </Link>
                  <Link
                    href="/studio"
                    className="text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 transition-colors flex items-center gap-1 font-semibold px-2 py-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span data-i18n="nav.studio">{t("nav.studio")}</span>
                  </Link>
                </>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Language Selector (Always visible on desktop and mobile topbar) */}
              <LanguageSelector />

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700/60"
                title={t("nav.theme_toggle")}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" />
                )}
              </button>

              {/* On Landing Page: Simple Dashboard button if logged in, or Login button if guest */}
              {isLanding ? (
                isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="px-4 sm:px-5 py-2 rounded-full bg-accent-600 hover:bg-accent-700 text-white text-xs sm:text-sm font-medium hover:scale-105 transition-transform shadow-md shadow-accent-600/20"
                    data-i18n="nav.dashboard"
                  >
                    {t("nav.dashboard")}
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-4 sm:px-5 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-medium hover:scale-105 transition-transform shadow-xs"
                    data-i18n="nav.login"
                  >
                    {t("nav.login")}
                  </Link>
                )
              ) : isLoggedIn ? (
                /* On Authenticated App Pages: Show Clock, Username, and Logout button */
                <div className="flex items-center gap-2">
                  {realtimeClock && (
                    <div
                      className="hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 shrink-0"
                      title="Waktu Realtime Jakarta (WIB)"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                        {realtimeClock}
                      </span>
                    </div>
                  )}
                  {/* User Profile Avatar & Name Button (Opens Profile Modal) */}
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group cursor-pointer shrink-0"
                    title="Ubah Foto Profil & Status"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-2 ring-accent-500/30 group-hover:ring-accent-500 transition-all flex items-center justify-center shrink-0">
                      <img
                        src={currentUser.avatar_url || DEFAULT_AVATAR_URL}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            DEFAULT_AVATAR_URL;
                        }}
                      />
                    </div>
                    <span className="hidden 2xl:block text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[100px] truncate group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                      {currentUser.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200/80 dark:border-red-900/40 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    title="Keluar dari akun"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline" data-i18n="nav.logout">
                      {t("nav.logout")}
                    </span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-4 sm:px-5 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs sm:text-sm font-medium hover:scale-105 transition-transform shadow-xs shrink-0"
                  data-i18n="nav.login"
                >
                  {t("nav.login")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 xl:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out xl:hidden flex flex-col shadow-2xl ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-600 flex items-center justify-center text-white font-bold text-sm">
              10
            </div>
            <div>
              <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                10 RPL
              </span>
              <p className="text-[10px] text-zinc-500 font-medium">
                SMK Negeri 17 Jakarta
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm font-medium">
          {isLanding ? (
            /* On Landing Page */
            <>
              <div
                className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                data-i18n="nav.menu"
              >
                {t("nav.menu")}
              </div>
              <Link
                href="/#about"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-i18n="nav.about"
              >
                {t("nav.about")}
              </Link>
              <Link
                href="/#members"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-i18n="nav.students"
              >
                {t("nav.students")}
              </Link>
              <Link
                href="/#memories"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-i18n="nav.memories"
              >
                {t("nav.memories")}
              </Link>
              <Link
                href="/#values"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-i18n="nav.vision"
              >
                {t("nav.vision")}
              </Link>
              <Link
                href="/#schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                data-i18n="nav.schedule"
              >
                {t("nav.schedule")}
              </Link>
              <Link
                href="/menfess"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-semibold"
              >
                <Heart className="w-4 h-4 fill-pink-500" />
                <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
              </Link>
              <Link
                href="/music"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-semibold"
              >
                <Music className="w-4 h-4 text-indigo-500" />
                <span>{t("nav.music")}</span>
              </Link>
              <Link
                href="/studio"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30 font-semibold"
              >
                <Camera className="w-4 h-4 text-accent-500" />
                <span data-i18n="nav.studio">{t("nav.studio")}</span>
              </Link>
            </>
          ) : isLoggedIn ? (
            /* On Authenticated App Pages */
            <>
              <div
                className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                data-i18n="nav.menu"
              >
                {t("nav.menu")}
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname === "/dashboard"
                    ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-accent-500" />
                <span data-i18n="nav.dashboard">{t("nav.dashboard")}</span>
              </Link>
              <Link
                href="/chatbot"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/chatbot")
                    ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Bot className="w-4 h-4 text-accent-500" />
                <span data-i18n="nav.chatbot">{t("nav.chatbot")}</span>
              </Link>
              <Link
                href="/learning"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/learning")
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span data-i18n="nav.learning">{t("nav.learning")}</span>
              </Link>
              <Link
                href="/music"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/music")
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Music className="w-4 h-4 text-indigo-500" />
                <span data-i18n="nav.music">{t("nav.music")}</span>
              </Link>
              <Link
                href="/studio"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/studio")
                    ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Camera className="w-4 h-4 text-accent-500" />
                <span data-i18n="nav.studio">{t("nav.studio")}</span>
              </Link>
              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/chat")
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span data-i18n="nav.chat">{t("nav.chat")}</span>
              </Link>
              <Link
                href="/menfess"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-colors ${
                  pathname.startsWith("/menfess")
                    ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
              </Link>
               <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                >
                  <Home className="w-4 h-4 text-zinc-500" />
                  <span>Halaman Utama</span>
                </Link>
              </div>
            </>
          ) : (
            /* On Guest Pages */
            <>
              <div
                className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
                data-i18n="nav.menu"
              >
                {t("nav.menu")}
              </div>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
              >
                Beranda
              </Link>
              <Link
                href="/#schedule"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold"
                data-i18n="nav.schedule"
              >
                {t("nav.schedule")}
              </Link>
              <Link
                href="/menfess"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-semibold"
              >
                <Heart className="w-4 h-4 fill-pink-500" />
                <span data-i18n="nav.menfess">{t("nav.menfess")}</span>
              </Link>
              <Link
                href="/music"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 font-semibold"
              >
                <Music className="w-4 h-4 text-indigo-500" />
                <span data-i18n="nav.music">{t("nav.music")}</span>
              </Link>
              <Link
                href="/studio"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30 font-semibold"
              >
                <Camera className="w-4 h-4 text-accent-500" />
                <span data-i18n="nav.studio">{t("nav.studio")}</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Drawer Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          {/* Language Switcher in Mobile Drawer */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Bahasa
            </span>
            <LanguageSelector />
          </div>

          {isLoggedIn ? (
            <div>
              <div
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="flex items-center gap-2.5 p-2 mb-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60 cursor-pointer group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Klik untuk ubah foto profil"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 ring-2 ring-accent-500/30 flex items-center justify-center shrink-0">
                  <img
                    src={currentUser.avatar_url || DEFAULT_AVATAR_URL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-accent-600">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-accent-600 dark:text-accent-400 font-medium">
                    Ubah Foto Profil &rarr;
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold text-center shadow-xs transition"
                  data-i18n="nav.dashboard"
                >
                  {t("nav.dashboard")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200/80 dark:border-red-900/40 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span data-i18n="nav.logout">{t("nav.logout")}</span>
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full block py-2.5 px-4 text-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold shadow-xs hover:scale-[1.02] transition"
              data-i18n="nav.login"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      </aside>

      {/* Global Profile Edit Modal */}
      {currentUser && (
        <ProfileEditModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={{
            id: currentUser.id || 0,
            name: currentUser.name,
            nis: currentUser.nis,
            role: currentUser.role,
            gender: currentUser.gender,
            avatar_url: currentUser.avatar_url,
            bio: currentUser.bio,
          }}
          onProfileUpdated={(updated) => {
            setCurrentUser((prev: any) => ({ ...prev, ...updated }));
          }}
        />
      )}
    </>
  );
}
