"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Heart,
  Music,
  Send,
  Lock,
  User as UserIcon,
  Search,
  Play,
  Pause,
  Filter,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface StudentOption {
  id: number;
  name: string;
  nis: string;
}

interface MenfessItem {
  id: number;
  recipient_id: number;
  recipient_name: string;
  sender_name: string;
  is_anonymous: boolean;
  message: string;
  type: "menfess" | "songfess";
  song_title?: string | null;
  song_artist?: string | null;
  song_album_art?: string | null;
  song_track_id?: string | null;
  song_preview_url?: string | null;
  created_at: string;
}

interface SongTrack {
  track_id: string;
  title: string;
  artist: string;
  album_art: string;
  preview_url: string;
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
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export default function MenfessPage() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [menfesses, setMenfesses] = useState<MenfessItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingFeed, setLoadingFeed] = useState(true);

  // Form State
  const [recipientId, setRecipientId] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [isSongfess, setIsSongfess] = useState(false);

  // Song Search State
  const [songQuery, setSongQuery] = useState("");
  const [searchingSong, setSearchingSong] = useState(false);
  const [songResults, setSongResults] = useState<SongTrack[]>([]);
  const [selectedSong, setSelectedSong] = useState<SongTrack | null>(null);

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters
  const [filterRecipient, setFilterRecipient] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  // Audio Playback
  const [playingSong, setPlayingSong] = useState<{
    id: number | string;
    title: string;
    artist: string;
    art: string | null;
    url: string;
  } | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<number | string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => res.json())
      .then((data) => {
        if (data.students) setStudents(data.students);
      })
      .catch(() => {});
  }, []);

  const loadFeed = useCallback(async () => {
    setLoadingFeed(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (filterRecipient) params.set("recipient", filterRecipient);
      if (filterType) params.set("type", filterType);

      const res = await fetch(`/api/menfess?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMenfesses(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch {}
    setLoadingFeed(false);
  }, [page, filterRecipient, filterType]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const searchSongs = async () => {
    if (!songQuery.trim()) return;
    setSearchingSong(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(songQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSongResults(data.data || []);
      }
    } catch {}
    setSearchingSong(false);
  };

  const handlePlayAudio = async (
    id: number | string,
    title: string,
    artist: string,
    art: string | null,
    previewUrl?: string | null,
    trackId?: string | null
  ) => {
    if (playingSong?.id === id) {
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

    setLoadingAudioId(id);
    setAlert(null);

    try {
      const params = new URLSearchParams({
        artist: artist || "",
        title: title || "",
        track_id: trackId || "",
        url: previewUrl || "",
      });

      const res = await fetch(`/api/music/preview?${params.toString()}`);
      const data = await res.json();

      if (!data.success || !data.preview_url) {
        setAlert({ type: "error", text: "Cuplikan audio untuk lagu ini tidak tersedia atau kedaluwarsa." });
        setLoadingAudioId(null);
        return;
      }

      const validUrl = data.preview_url;
      setPlayingSong({ id, title, artist, art, url: validUrl });

      if (audioRef.current) {
        audioRef.current.src = validUrl;
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
      console.error("Audio preview resolve error:", err);
      setAlert({ type: "error", text: "Gagal memuat cuplikan audio lagu." });
    } finally {
      setLoadingAudioId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!recipientId) {
      setAlert({ type: "error", text: "Pilih siswa penerima terlebih dahulu." });
      return;
    }

    if (!isAnonymous && !senderName.trim()) {
      setAlert({ type: "error", text: "Tuliskan nama pengirim jika tidak anonim." });
      return;
    }

    if (!message.trim() || message.trim().length < 3) {
      setAlert({ type: "error", text: "Pesan minimal 3 karakter." });
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = {
        recipient_id: recipientId,
        sender_name: isAnonymous ? "Anonim" : senderName.trim(),
        is_anonymous: isAnonymous,
        message: message.trim(),
        type: isSongfess ? "songfess" : "menfess",
      };

      if (isSongfess && selectedSong) {
        payload.song_title = selectedSong.title;
        payload.song_artist = selectedSong.artist;
        payload.song_album_art = selectedSong.album_art;
        payload.song_track_id = selectedSong.track_id;
        payload.song_preview_url = selectedSong.preview_url;
      }

      const res = await fetch("/api/menfess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({ type: "error", text: data.error || "Gagal mengirim pesan." });
      } else {
        const student = students.find((s) => s.id === parseInt(recipientId));
        const studentName = student ? student.name : "siswa yang dituju";
        const successMsg = isSongfess
          ? `Songfess beserta lagu berhasil dikirimkan untuk ${studentName}! 🎵💌`
          : `Menfess berhasil dikirimkan untuk ${studentName}! 💌`;

        setAlert({ type: "success", text: successMsg });
        setMessage("");
        setSelectedSong(null);
        setIsSongfess(false);
        setRecipientId("");
        setSongQuery("");
        setSongResults([]);

        // Reload feed
        loadFeed();
      }
    } catch {
      setAlert({ type: "error", text: "Terjadi gangguan koneksi jaringan." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      {/* Hidden Audio */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onPause={() => setIsPlayingAudio(false)}
        onPlay={() => setIsPlayingAudio(true)}
        onError={() => {
          setIsPlayingAudio(false);
          setLoadingAudioId(null);
        }}
      />

      <main className="flex-1 pt-20 pb-32 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Header / Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200/80 dark:border-pink-800/60 mb-4 shadow-xs">
            <span className="animate-bounce text-sm">💌</span>
            <span className="tracking-wide">RPL MENFESS &amp; SONGFESS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Ungkapkan Pesan &amp; Persembahkan Lagu
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">
            Kirim salam hangat, apresiasi rahasia, atau dedikasikan lagu favorit untuk teman sekelas di 10 RPL. Bebas kirim kapan saja tanpa perlu login!
          </p>

          {/* Alert Notifications */}
          {alert && (
            <div
              className={`mt-6 p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between shadow-xs ${
                alert.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{alert.type === "success" ? "✨" : "⚠️"}</span>
                <span>{alert.text}</span>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* FORM PENGIRIMAN MENFESS & SONGFESS (Kiri / Col 5) */}
          <div
            id="form-container"
            className="lg:col-span-5 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-7 shadow-sm lg:sticky lg:top-24"
          >
            <div className="flex items-center justify-between pb-5 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400 flex items-center justify-center text-xl shadow-xs border border-pink-100 dark:border-pink-900/40">
                  ✍️
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Kirim Menfess Baru
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Pengirim tidak perlu login (Bisa Anonim)
                  </p>
                </div>
              </div>
              <a
                href="#feed-wall"
                className="lg:hidden inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 px-2.5 py-1.5 rounded-xl border border-pink-200/80 dark:border-pink-900/40"
              >
                <span>Lihat Wall</span>
                <span>👇</span>
              </a>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Pilih Siswa Penerima */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Tujukan Ke Siapa? <span className="text-pink-500">*</span>
                </label>
                <select
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                >
                  <option value="" disabled>
                    -- Pilih Siswa Kelas 10 RPL --
                  </option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Identitas Pengirim (Segmented Buttons) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  Identitas Pengirim
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 mb-2.5">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isAnonymous
                        ? "bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span>🔒</span>
                    <span>Kirim Anonim</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(false)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isAnonymous
                        ? "bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span>👤</span>
                    <span>Pakai Nama</span>
                  </button>
                </div>

                {isAnonymous ? (
                  <div className="px-3 py-2 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/30 text-[11px] text-pink-700 dark:text-pink-300 flex items-center gap-2">
                    <span>✨</span>
                    <span>
                      Identitasmu dirahasiakan sebagai <strong>&quot;Anonim&quot;</strong>.
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Tuliskan nama atau inisial kamu..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 transition"
                  />
                )}
              </div>

              {/* 3. Isi Pesan */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Isi Pesan Menfess <span className="text-pink-500">*</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {message.length} / 1000
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan pesanmu di sini dengan sopan &amp; positif..."
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500 placeholder:text-zinc-400 leading-relaxed transition"
                />
              </div>

              {/* 4. Opsi Songfess (Lampirkan Lagu) */}
              <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base shrink-0">
                      🎵
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Jadikan Songfess?
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Dedikasikan lagu untuknya
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSongfess}
                      onChange={(e) => setIsSongfess(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Song Search & Selected Widget */}
                {isSongfess && (
                  <div className="mt-4 pt-3.5 border-t border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
                    {!selectedSong ? (
                      <>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                            Cari Lagu Favorit
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={songQuery}
                              onChange={(e) => setSongQuery(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  searchSongs();
                                }
                              }}
                              placeholder="Ketik judul lagu atau artis..."
                              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs px-3.5 py-2.5 pr-20 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            />
                            <button
                              type="button"
                              onClick={searchSongs}
                              disabled={searchingSong}
                              className="absolute right-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                            >
                              {searchingSong ? "Mencari..." : "Cari"}
                            </button>
                          </div>
                        </div>

                        {/* Results List */}
                        {songResults.length > 0 && (
                          <div className="max-h-52 overflow-y-auto space-y-1.5 p-1.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs text-xs">
                            {songResults.map((song) => (
                              <div
                                key={song.track_id}
                                onClick={() => setSelectedSong(song)}
                                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer flex items-center justify-between gap-3 transition"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <img
                                    src={song.album_art}
                                    alt=""
                                    className="w-9 h-9 rounded-md object-cover shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                      {song.title}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 truncate">
                                      {song.artist}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                  Pilih +
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-800 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 relative flex items-center justify-center">
                            {selectedSong.album_art ? (
                              <img
                                src={selectedSong.album_art}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-purple-600 text-base">🎵</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {selectedSong.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {selectedSong.artist}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handlePlayAudio(
                                "preview",
                                selectedSong.title,
                                selectedSong.artist,
                                selectedSong.album_art,
                                selectedSong.preview_url,
                                selectedSong.track_id
                              )
                            }
                            disabled={loadingAudioId === "preview"}
                            className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold hover:bg-purple-100 transition cursor-pointer flex items-center gap-1 disabled:opacity-75"
                          >
                            {loadingAudioId === "preview" ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <span>
                                {playingSong?.id === "preview" && isPlayingAudio ? "❚❚" : "▶"}
                              </span>
                            )}
                            <span>Tes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSong(null)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          >
                            Ganti
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm tracking-wide shadow-md shadow-pink-600/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Kirim Pesan Sekarang</span>
                    <span>💌</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* PUBLIC FEED WALL (Kanan / Col 7) */}
          <div id="feed-wall" className="lg:col-span-7 space-y-6 scroll-mt-24">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="inline-flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    !filterType
                      ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("menfess");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "menfess"
                      ? "bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  ✉️ Menfess
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("songfess");
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterType === "songfess"
                      ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-xs font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  🎵 Songfess
                </button>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={filterRecipient}
                  onChange={(e) => {
                    setFilterRecipient(e.target.value);
                    setPage(1);
                  }}
                  className="w-full sm:w-auto appearance-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3.5 py-1.5 pr-8 text-xs font-medium focus:outline-none"
                >
                  <option value="">-- Semua Siswa Penerima --</option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      Untuk: {stu.name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feed List */}
            {loadingFeed ? (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
                <span className="text-xs">Memuat pesan dinding...</span>
              </div>
            ) : menfesses.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-10 sm:p-14 text-center shadow-xs">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-pink-100 dark:bg-pink-900/30 animate-ping opacity-30"></div>
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40 border border-pink-200 dark:border-pink-800/60 flex items-center justify-center text-3xl shadow-xs">
                    💌
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Belum Ada Menfess
                </h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Kotak menfess masih kosong. Jadilah orang pertama yang mengirimkan pesan apresiasi atau dedikasi lagu manis untuk teman sekelasmu!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {menfesses.map((mf) => (
                  <div
                    key={mf.id}
                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-xs hover:border-pink-300 dark:hover:border-pink-900/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            mf.type === "songfess"
                              ? "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                              : "bg-pink-100 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40"
                          }`}
                        >
                          {mf.type === "songfess" ? "🎵 Songfess" : "✉️ Menfess"}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          Untuk:{" "}
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {mf.recipient_name
                              ? mf.recipient_name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                              : "Siswa"}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {formatRelativeTime(mf.created_at)}
                      </span>
                    </div>

                    {/* Pesan */}
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed mb-4">
                      {mf.message}
                    </p>

                    {/* Songfess Player Widget */}
                    {mf.type === "songfess" && mf.song_title && (
                      <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 flex items-center justify-between gap-3 mb-4 transition-all hover:border-purple-300 dark:hover:border-purple-800">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative flex items-center justify-center shadow-xs">
                            {mf.song_album_art ? (
                              <img
                                src={mf.song_album_art}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-purple-600 text-xl">🎵</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5 flex-wrap">
                              <span>Lagu Persembahan</span>
                              {playingSong?.id === mf.id && isPlayingAudio && (
                                <span className="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                  Sedang Memutar
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {mf.song_title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                              {mf.song_artist}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handlePlayAudio(
                              mf.id,
                              mf.song_title || "Lagu",
                              mf.song_artist || "Artis",
                              mf.song_album_art || null,
                              mf.song_preview_url,
                              mf.song_track_id
                            )
                          }
                          disabled={loadingAudioId === mf.id}
                          className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer disabled:opacity-75 ${
                            playingSong?.id === mf.id && isPlayingAudio
                              ? "bg-pink-600 hover:bg-pink-700 shadow-pink-600/20"
                              : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                          }`}
                        >
                          {loadingAudioId === mf.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Memuat...</span>
                            </>
                          ) : playingSong?.id === mf.id && isPlayingAudio ? (
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

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        Dari:{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300">
                          {mf.sender_name}
                        </strong>
                      </span>
                      {mf.is_anonymous && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-pink-600 dark:text-pink-400 font-bold bg-pink-50 dark:bg-pink-950/40 px-2 py-0.5 rounded-md border border-pink-200/60 dark:border-pink-900/40">
                          <span>🔒 Rahasia</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
                <span className="text-xs text-zinc-500">
                  Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Mini Music Player Bar */}
      {playingSong && (
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-2xl p-3 sm:p-3.5 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 relative shadow-xs flex items-center justify-center">
                {playingSong.art ? (
                  <img
                    src={playingSong.art}
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
                  {playingSong.title}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {playingSong.artist}
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
                  setPlayingSong(null);
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

      <Footer />
    </div>
  );
}
