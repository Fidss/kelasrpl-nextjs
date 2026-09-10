"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/layout/Navbar";
import {
  Search,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Music,
  Disc3,
  Loader2,
  Sparkles,
  ArrowLeft,
  ListMusic,
  Mic2,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Song {
  id: string | number;
  track_id?: string;
  title: string;
  artist: string;
  artist_id?: number | null;
  album?: string;
  thumbnail: string;
  album_art?: string;
  duration: string;
  duration_sec: number;
  preview_url?: string | null;
}

interface LyricLine {
  time: number;
  text: string;
}

const QUICK_GENRES = [
  { name: "Lo-Fi Coding", query: "Lofi Beats Koding", icon: "🎧" },
  { name: "Anime OST", query: "Anime OST Acoustic", icon: "✨" },
  { name: "Indie Senja", query: "Indie Pop Indonesia", icon: "☕" },
  { name: "Synthwave Cyber", query: "Synthwave Chillwave", icon: "⚡" },
  { name: "Study Piano", query: "Study Piano Relax", icon: "🎹" },
  { name: "J-Rock & Pop", query: "J-Rock Japanese Pop", icon: "🎸" },
];

const CURATED_CARDS = [
  {
    title: "Lo-Fi Coding",
    desc: "Ritme santai tanpa lirik untuk fokus mengetik kode.",
    query: "Lofi Beats Koding",
    icon: "🎧",
  },
  {
    title: "Anime OST",
    desc: "Lagu soundtrack anime terfavorit versi instrumen akustik.",
    query: "Anime OST Chill",
    icon: "✨",
  },
  {
    title: "Indie Senja",
    desc: "Alunan hangat musisi indie tanah air untuk suasana santai.",
    query: "Indie Pop Indonesia",
    icon: "☕",
  },
  {
    title: "Synthwave Cyber",
    desc: "Nuansa retro futuristik 80-an yang memacu adrenalin koding.",
    query: "Synthwave Chillwave",
    icon: "⚡",
  },
];

export default function MusicPage() {
  // Navigation
  const [currentPage, setCurrentPage] = useState<"search" | "player">("search");
  const [activeTab, setActiveTab] = useState<"queue" | "lyrics">("queue");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Song[]>([]);

  // Player State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [prevVolume, setPrevVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"all" | "one" | "off">("all");

  // Queue & Recommendations
  const [queueList, setQueueList] = useState<Song[]>([]);
  const [isFetchingRelated, setIsFetchingRelated] = useState(false);

  // Lyrics
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  // Refs & Caches
  const ytPlayerRef = useRef<any>(null);
  const isYtReadyRef = useRef(false);
  const ytCacheRef = useRef<Record<string, string>>({});
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dummyAudioRef = useRef<HTMLAudioElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------
  // 1. YouTube IFrame API Initialization
  // -------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      isYtReadyRef.current = true;
    } else {
      const existingScript = document.getElementById("yt-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        isYtReadyRef.current = true;
      };
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 2. Progress Tracker
  // -------------------------------------------------------------
  const startProgressTracker = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        try {
          const cur = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);

          // Update active lyric index
          setLyrics((currentLyrics) => {
            if (currentLyrics.length > 0 && currentLyrics[0].time > 0) {
              let idx = -1;
              for (let i = 0; i < currentLyrics.length; i++) {
                if (cur >= currentLyrics[i].time - 0.25) {
                  idx = i;
                } else {
                  break;
                }
              }
              setActiveLyricIndex(idx);
            }
            return currentLyrics;
          });
        } catch {}
      }
    }, 150);
  }, []);

  const stopProgressTracker = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Scroll active lyric to center
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = document.getElementById(`lyric-${activeLyricIndex}`);
      if (activeEl) {
        const container = lyricsContainerRef.current;
        const targetScroll =
          activeEl.offsetTop - container.clientHeight / 2 + activeEl.clientHeight / 2;
        container.scrollTo({
          top: targetScroll,
          behavior: "smooth",
        });
      }
    }
  }, [activeLyricIndex]);

  // -------------------------------------------------------------
  // 3. Search Songs
  // -------------------------------------------------------------
  const searchMusic = async (q?: string) => {
    const queryToSearch = (q !== undefined ? q : searchQuery).trim();
    if (!queryToSearch) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const quickSearch = (q: string) => {
    setSearchQuery(q);
    searchMusic(q);
  };

  // -------------------------------------------------------------
  // 4. Lyrics Fetching & Parsing
  // -------------------------------------------------------------
  const parseLyrics = (lrcString: string): LyricLine[] => {
    if (!lrcString) return [];
    const lines = lrcString.split("\n");
    const parsed: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds =
          parseInt(match[3], 10) * (match[3].length === 2 ? 10 : 1);
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = line.replace(timeRegex, "").trim();
        if (text) {
          parsed.push({ time, text });
        }
      }
    }
    return parsed;
  };

  const fetchLyrics = async (song: Song) => {
    setLyrics([]);
    setActiveLyricIndex(-1);
    setIsFetchingLyrics(true);

    try {
      const params = new URLSearchParams({
        artist: song.artist || "",
        title: song.title || "",
        duration: (song.duration_sec || 0).toString(),
      });
      const res = await fetch(`/api/music/lyrics?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data?.syncedLyrics) {
        setLyrics(parseLyrics(data.data.syncedLyrics));
      } else if (data.success && data.data?.plainLyrics) {
        const plainLines = data.data.plainLyrics
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0);
        setLyrics(plainLines.map((text: string) => ({ time: 0, text })));
      }
    } catch {
      setLyrics([]);
    } finally {
      setIsFetchingLyrics(false);
    }
  };

  // -------------------------------------------------------------
  // 5. Related Songs & Smart Queue
  // -------------------------------------------------------------
  const fetchRelatedSongs = async (song: Song, autoPlayNextSong = false) => {
    if (!song) return;
    setIsFetchingRelated(true);

    try {
      const params = new URLSearchParams({
        artist_id: song.artist_id ? song.artist_id.toString() : "",
        artist_name: song.artist || "",
        title: song.title || "",
        current_id: String(song.id || ""),
      });
      const res = await fetch(`/api/music/related?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setQueueList((prevQueue) => {
          const existingIds = new Set(prevQueue.map((s) => String(s.id)));
          existingIds.add(String(song.id));
          const newSongs = data.data.filter((s: Song) => !existingIds.has(String(s.id)));

          if (isShuffled) {
            for (let i = newSongs.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [newSongs[i], newSongs[j]] = [newSongs[j], newSongs[i]];
            }
          }

          const updatedQueue = [...prevQueue, ...newSongs];
          if (autoPlayNextSong && updatedQueue.length > 0) {
            const nextTrack = updatedQueue[0];
            const remaining = updatedQueue.slice(1);
            setTimeout(() => {
              playSongFromQueue(nextTrack, remaining);
            }, 0);
          }
          return updatedQueue;
        });
      }
    } catch {
    } finally {
      setIsFetchingRelated(false);
    }
  };

  // -------------------------------------------------------------
  // 6. Playback Core (YouTube Resolution & Player Creation)
  // -------------------------------------------------------------
  const startPlayback = useCallback(
    (videoId: string) => {
      if (!isYtReadyRef.current || !window.YT) {
        setTimeout(() => startPlayback(videoId), 300);
        return;
      }

      if (!ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player("youtube-player", {
          height: "1",
          width: "1",
          videoId: videoId,
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(volume);
              event.target.playVideo();
              setIsPlaying(true);
              setIsResolving(false);
              startProgressTracker();
              dummyAudioRef.current?.play().catch(() => {});
            },
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsResolving(false);
                setDuration(ytPlayerRef.current.getDuration() || 0);
                startProgressTracker();
                dummyAudioRef.current?.play().catch(() => {});
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
                stopProgressTracker();
                dummyAudioRef.current?.pause();
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                stopProgressTracker();
                dummyAudioRef.current?.pause();

                // Repeat Mode Logic
                if (repeatMode === "one" && ytPlayerRef.current) {
                  ytPlayerRef.current.seekTo(0, true);
                  ytPlayerRef.current.playVideo();
                } else if (repeatMode !== "off") {
                  handleAutoNext();
                }
              }
            },
          },
        });
      } else {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.setVolume(volume);
        setIsPlaying(true);
        setIsResolving(false);
        startProgressTracker();
        dummyAudioRef.current?.play().catch(() => {});
      }
    },
    [volume, repeatMode, startProgressTracker, stopProgressTracker]
  );

  const resolveAndPlay = useCallback(
    async (song: Song) => {
      fetchLyrics(song);

      const songKey = String(song.id);
      if (ytCacheRef.current[songKey]) {
        startPlayback(ytCacheRef.current[songKey]);
        return;
      }

      setIsResolving(true);

      try {
        const params = new URLSearchParams({
          artist: song.artist || "",
          title: song.title || "",
          deezer_id: songKey,
          duration: (song.duration_sec || 0).toString(),
        });
        const res = await fetch(`/api/music/resolve-youtube?${params.toString()}`);
        const data = await res.json();

        if (data.success && data.video_id) {
          ytCacheRef.current[songKey] = data.video_id;
          startPlayback(data.video_id);
        } else {
          setIsResolving(false);
          // Fallback to next track if resolution fails
          handleAutoNext();
        }
      } catch (err) {
        setIsResolving(false);
      }
    },
    [startPlayback]
  );

  // -------------------------------------------------------------
  // 7. Queue Operations
  // -------------------------------------------------------------
  const openPlayer = (song: Song) => {
    setCurrentSong(song);
    const newQueue = results.filter((s) => String(s.id) !== String(song.id));
    if (isShuffled) {
      for (let i = newQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
      }
    }
    setQueueList(newQueue);
    setCurrentPage("player");
    resolveAndPlay(song);
    fetchRelatedSongs(song);
  };

  const playSongFromQueue = (song: Song, explicitQueue?: Song[]) => {
    const list = explicitQueue || queueList;
    const remaining = list.filter((s) => String(s.id) !== String(song.id));
    setQueueList(remaining);
    setCurrentSong(song);
    resolveAndPlay(song);
    if (remaining.length < 3) {
      fetchRelatedSongs(song);
    }
  };

  const playNext = () => {
    if (queueList.length > 0) {
      const nextSong = queueList[0];
      const remaining = queueList.slice(1);
      setQueueList(remaining);
      setCurrentSong(nextSong);
      resolveAndPlay(nextSong);
      if (remaining.length < 3) {
        fetchRelatedSongs(nextSong);
      }
    }
  };

  const playPrevious = () => {
    if (currentTime > 3 && ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(0, true);
      setCurrentTime(0);
    } else if (results.length > 0) {
      const idx = results.findIndex((s) => String(s.id) === String(currentSong?.id));
      if (idx > 0) {
        const prevSong = results[idx - 1];
        setCurrentSong(prevSong);
        resolveAndPlay(prevSong);
      }
    }
  };

  const handleAutoNext = () => {
    if (queueList.length > 0) {
      playNext();
    } else if (currentSong) {
      fetchRelatedSongs(currentSong, true);
    }
  };

  const toggleShuffle = () => {
    const nextShuffled = !isShuffled;
    setIsShuffled(nextShuffled);
    if (nextShuffled && queueList.length > 1) {
      const copy = [...queueList];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      setQueueList(copy);
    }
  };

  const toggleRepeat = () => {
    if (repeatMode === "all") setRepeatMode("one");
    else if (repeatMode === "one") setRepeatMode("off");
    else setRepeatMode("all");
  };

  const togglePlay = () => {
    const player = ytPlayerRef.current;
    if (!player || isResolving) return;

    if (isPlaying) {
      player.pauseVideo();
      dummyAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      player.playVideo();
      dummyAudioRef.current?.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
      if (ytPlayerRef.current) ytPlayerRef.current.setVolume(0);
    } else {
      const restored = prevVolume || 75;
      setVolume(restored);
      if (ytPlayerRef.current) ytPlayerRef.current.setVolume(restored);
    }
  };

  const onVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVol);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ytPlayerRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    ytPlayerRef.current.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const seekToLyric = (line: LyricLine) => {
    if (ytPlayerRef.current && line.time > 0) {
      ytPlayerRef.current.seekTo(line.time, true);
      setCurrentTime(line.time);
    }
  };

  // MediaSession API integration
  useEffect(() => {
    if (typeof window !== "undefined" && "mediaSession" in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.album || "10 RPL Music Studio",
        artwork: [
          {
            src: currentSong.thumbnail || currentSong.album_art || "/favicon.ico",
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      });

      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.setActionHandler("previoustrack", () => playPrevious());
      navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    }
  }, [currentSong]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* TOP BANNER / HEADER (Sleek Studio Aesthetic)             */}
        {/* ======================================================== */}
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-800 relative overflow-hidden transition-colors">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-300 border border-accent-200/80 dark:border-accent-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500 dark:bg-accent-400"></span>
                  </span>
                  <span>STUDIO MUSIK RPL</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Full Audio &amp; Karaoke Stream</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                <span>RPL Music Player</span>
                {isPlaying && (
                  <div className="flex items-end space-x-1 h-5 pb-0.5">
                    <div
                      className="w-1 bg-accent-500 dark:bg-accent-400 rounded-full animate-[musicBar_0.6s_ease-in-out_infinite]"
                      style={{ height: "60%" }}
                    ></div>
                    <div
                      className="w-1 bg-accent-500 dark:bg-accent-400 rounded-full animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"
                      style={{ height: "100%" }}
                    ></div>
                    <div
                      className="w-1 bg-accent-500 dark:bg-accent-400 rounded-full animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"
                      style={{ height: "40%" }}
                    ></div>
                    <div
                      className="w-1 bg-accent-500 dark:bg-accent-400 rounded-full animate-[musicBar_0.7s_ease-in-out_infinite_0.3s]"
                      style={{ height: "80%" }}
                    ></div>
                  </div>
                )}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm sm:text-base max-w-xl">
                Temani sesi coding dan belajarmu dengan lagu favorit berdurasi penuh berkualitas jernih tanpa jeda.
              </p>
            </div>

            {/* Quick Status / Mini Controller Widget in Header */}
            {currentSong && (
              <div
                onClick={() => setCurrentPage("player")}
                className="cursor-pointer group flex items-center gap-3.5 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 px-4 py-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs self-start md:self-auto max-w-sm"
              >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs shrink-0 bg-zinc-200 dark:bg-zinc-700">
                  <img
                    src={currentSong.thumbnail || currentSong.album_art}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt=""
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
                    <span>{isPlaying ? "Sedang Diputar" : "Dijeda"}</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {currentSong.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {currentSong.artist}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-700/50 group-hover:bg-accent-600 text-zinc-500 dark:text-zinc-300 group-hover:text-white border border-zinc-200/60 dark:border-transparent flex items-center justify-center transition-all duration-200 shrink-0">
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PAGE 1: SEARCH & DISCOVERY                               */}
        {/* ======================================================== */}
        {currentPage === "search" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Search Input Box */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-6 transition-all">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                  <Search className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchMusic()}
                  className="w-full bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl pl-12 sm:pl-14 pr-28 sm:pr-36 py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition placeholder-zinc-400 dark:placeholder-zinc-500 text-sm sm:text-base font-medium"
                  placeholder="Cari judul lagu, artis, band, atau soundtrack..."
                />
                <div className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setResults([]);
                        setHasSearched(false);
                      }}
                      className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition rounded-lg"
                      title="Hapus pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => searchMusic()}
                    disabled={isSearching}
                    className="bg-accent-600 hover:bg-accent-500 active:scale-95 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition shadow-md shadow-accent-600/25 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {isSearching ? "Mencari..." : "Cari Lagu"}
                    </span>
                    <span className="sm:hidden">{isSearching ? "..." : "Cari"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Mood / Genre Chips */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs custom-scrollbar">
                <span className="text-zinc-400 dark:text-zinc-500 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-accent-500" />
                  Genre:
                </span>
                {QUICK_GENRES.map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => quickSearch(genre.query)}
                    className="px-3.5 py-1.5 rounded-full bg-zinc-100/90 dark:bg-zinc-800/80 hover:bg-accent-50 dark:hover:bg-accent-950/40 text-zinc-700 dark:text-zinc-300 hover:text-accent-600 dark:hover:text-accent-400 border border-zinc-200/80 dark:border-zinc-700/60 transition font-medium shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{genre.icon}</span>
                    <span>{genre.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Initial State (Curated Quick Starts Before Searching) */}
            {!hasSearched && results.length === 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-12 text-center relative overflow-hidden">
                <div className="w-16 h-16 mx-auto bg-accent-50 dark:bg-accent-950/40 rounded-2xl flex items-center justify-center mb-4 text-accent-600 dark:text-accent-400 border border-accent-200/60 dark:border-accent-800/60 shadow-inner">
                  <Music className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Mulai Dengarkan Musik Favoritmu
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-lg mx-auto">
                  Cari lagu apa saja lewat kotak pencarian di atas, atau klik salah satu playlist kurasi pilihan di bawah untuk langsung memutar musik secara penuh.
                </p>

                {/* Quick Curated Cards Grid */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  {CURATED_CARDS.map((card) => (
                    <div
                      key={card.title}
                      onClick={() => quickSearch(card.query)}
                      className="group p-5 rounded-2xl bg-zinc-50 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-zinc-200/80 hover:border-accent-400/80 dark:border-zinc-700/60 dark:hover:border-accent-500/60 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-600/50 flex items-center justify-center text-xl mb-3.5 shadow-xs group-hover:scale-110 transition-transform">
                        {card.icon}
                      </div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors flex items-center justify-between">
                        <span>{card.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-accent-500" />
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results State */}
            {hasSearched && results.length === 0 && !isSearching && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 p-8 sm:p-14 text-center">
                <div className="w-16 h-16 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500">
                  <Disc3 className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                  Lagu Tidak Ditemukan
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md mx-auto">
                  Tidak ada hasil yang sesuai untuk kata kunci &quot;
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                    {searchQuery}
                  </span>
                  &quot;. Coba gunakan nama artis atau judul lagu yang lebih spesifik.
                </p>
              </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 overflow-hidden mb-12">
                {/* Header Bar */}
                <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-500/10 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Daftar Lagu Ditemukan
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                    {results.length} lagu
                  </span>
                </div>

                {/* Track List Rows */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {results.map((song, index) => {
                    const isCur = String(currentSong?.id) === String(song.id);
                    return (
                      <div
                        key={song.id}
                        onClick={() => openPlayer(song)}
                        className={`group flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-150 ${
                          isCur
                            ? "bg-accent-50/70 dark:bg-accent-950/40 border-l-4 border-accent-600"
                            : ""
                        }`}
                      >
                        {/* Index / Animated Wave */}
                        <div className="w-7 text-center shrink-0">
                          {isCur && isPlaying ? (
                            <div className="flex items-end justify-center space-x-0.5 h-3.5">
                              <div
                                className="w-0.5 bg-accent-500 rounded-full animate-[musicBar_0.6s_ease-in-out_infinite]"
                                style={{ height: "60%" }}
                              ></div>
                              <div
                                className="w-0.5 bg-accent-500 rounded-full animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"
                                style={{ height: "100%" }}
                              ></div>
                              <div
                                className="w-0.5 bg-accent-500 rounded-full animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"
                                style={{ height: "40%" }}
                              ></div>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 group-hover:hidden">
                                {index + 1}
                              </span>
                              <div className="hidden group-hover:flex items-center justify-center">
                                <Play className="w-4 h-4 text-accent-600 dark:text-accent-400 fill-current" />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-xs bg-zinc-100 dark:bg-zinc-800">
                          <img
                            src={song.thumbnail || song.album_art}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt=""
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>

                        {/* Song Details */}
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-bold truncate text-sm sm:text-base group-hover:text-accent-600 dark:group-hover:text-accent-400 transition ${
                              isCur
                                ? "text-accent-600 dark:text-accent-400"
                                : "text-zinc-900 dark:text-zinc-100"
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            <span>{song.artist}</span>
                            {song.album && (
                              <span className="text-zinc-400 dark:text-zinc-600">
                                {" "}
                                &bull; {song.album}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Duration Badge */}
                        <div className="text-xs font-mono text-zinc-500 dark:text-zinc-400 shrink-0 bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                          {song.duration}
                        </div>

                        {/* Arrow Action */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 dark:text-zinc-600 group-hover:text-accent-600 dark:group-hover:text-accent-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition shrink-0">
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PAGE 2: DETAILED PLAYER & LYRICS SCREEN                  */}
        {/* ======================================================== */}
        {currentPage === "player" && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Back Button Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentPage("search")}
                className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 hover:text-accent-600 dark:hover:text-accent-400 transition group text-sm font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Kembali ke Pencarian</span>
              </button>
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">
                RPL Music Studio
              </span>
            </div>

            {currentSong && (
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-12">
                {/* Left Column: Artwork, Details & Controls */}
                <div className="lg:w-5/12 xl:w-4/12">
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
                    {/* Vinyl / Cover Stage */}
                    <div className="relative aspect-square overflow-hidden bg-zinc-900 flex items-center justify-center">
                      <img
                        src={currentSong.thumbnail || currentSong.album_art}
                        className="w-full h-full object-cover"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                      {/* Live Indicator */}
                      {isPlaying && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-accent-600/90 backdrop-blur-sm text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-accent-600/30">
                          <div className="flex items-end space-x-0.5 h-3">
                            <div
                              className="w-0.5 bg-white rounded-full animate-[musicBar_0.6s_ease-in-out_infinite]"
                              style={{ height: "60%" }}
                            ></div>
                            <div
                              className="w-0.5 bg-white rounded-full animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"
                              style={{ height: "100%" }}
                            ></div>
                            <div
                              className="w-0.5 bg-white rounded-full animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"
                              style={{ height: "40%" }}
                            ></div>
                          </div>
                          <span>Sedang Diputar</span>
                        </div>
                      )}

                      {/* Audio Resolving Overlay */}
                      {isResolving && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center">
                          <div className="text-center text-white p-4">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2 text-accent-400" />
                            <span className="text-xs font-semibold">
                              Menghubungkan audio stream penuh...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls & Metadata */}
                    <div className="p-6">
                      <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 leading-tight mb-1">
                        {currentSong.title}
                      </h2>
                      <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                        {currentSong.artist}
                      </p>
                      {currentSong.album && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4 truncate">
                          {currentSong.album}
                        </p>
                      )}

                      {/* Quality Badges */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 px-3 py-1 rounded-full border border-accent-200/60 dark:border-accent-800/60">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{currentSong.duration}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>Full Playback</span>
                        </span>
                      </div>

                      {/* Seekable Progress Bar */}
                      <div className="space-y-5">
                        <div>
                          <div
                            className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full cursor-pointer relative group overflow-hidden"
                            onClick={seekTo}
                          >
                            <div
                              className="absolute h-full bg-gradient-to-r from-accent-600 to-indigo-500 rounded-full transition-all duration-100"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-2 font-medium">
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
                        </div>

                        {/* Main Buttons */}
                        <div className="flex items-center justify-between pt-1 px-2">
                          {/* Shuffle */}
                          <button
                            onClick={toggleShuffle}
                            className={`p-2 rounded-xl transition cursor-pointer ${
                              isShuffled
                                ? "text-accent-600 dark:text-accent-400 font-bold"
                                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            }`}
                            title="Acak Antrian"
                          >
                            <Shuffle className="w-5 h-5" />
                          </button>

                          {/* Previous */}
                          <button
                            onClick={playPrevious}
                            className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition active:scale-95 cursor-pointer"
                            title="Lagu Sebelumnya"
                          >
                            <SkipBack className="w-5 h-5 fill-current" />
                          </button>

                          {/* Big Play / Pause */}
                          <button
                            onClick={togglePlay}
                            disabled={isResolving}
                            className="w-16 h-16 rounded-full bg-accent-600 hover:bg-accent-500 flex items-center justify-center text-white shadow-xl shadow-accent-600/35 transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                            title="Putar / Jeda"
                          >
                            {isResolving ? (
                              <Loader2 className="animate-spin h-7 w-7 text-white" />
                            ) : isPlaying ? (
                              <Pause className="w-7 h-7 fill-white" />
                            ) : (
                              <Play className="w-7 h-7 ml-1 fill-white" />
                            )}
                          </button>

                          {/* Next */}
                          <button
                            onClick={playNext}
                            className="w-11 h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-200 transition active:scale-95 cursor-pointer"
                            title="Lagu Selanjutnya"
                          >
                            <SkipForward className="w-5 h-5 fill-current" />
                          </button>

                          {/* Repeat */}
                          <button
                            onClick={toggleRepeat}
                            className={`p-2 rounded-xl transition relative cursor-pointer ${
                              repeatMode !== "off"
                                ? "text-accent-600 dark:text-accent-400 font-bold"
                                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                            }`}
                            title="Ulangi Lagu"
                          >
                            <Repeat className="w-5 h-5" />
                            {repeatMode === "one" && (
                              <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-accent-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                1
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Volume Slider */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={toggleMute}
                            className="text-zinc-400 dark:text-zinc-500 hover:text-accent-600 dark:hover:text-accent-400 transition shrink-0 cursor-pointer"
                          >
                            {volume > 0 ? (
                              <Volume2 className="w-5 h-5" />
                            ) : (
                              <VolumeX className="w-5 h-5" />
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => onVolumeChange(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-accent-600"
                          />
                          <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 w-8 text-right font-medium">
                            {volume}%
                          </span>
                        </div>
                      </div>

                      {/* Footer Signature */}
                      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                        <span>Studio Musik RPL</span>
                        <span className="font-semibold text-accent-600 dark:text-accent-400">
                          RPL Music By Elostra
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Tabs (Queue & Synchronized Karaoke Lyrics) */}
                <div className="lg:w-7/12 xl:w-8/12">
                  <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/80 dark:border-zinc-800 overflow-hidden flex flex-col h-full min-h-[540px]">
                    {/* Tabs Header */}
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <div className="flex space-x-6">
                        <button
                          onClick={() => setActiveTab("queue")}
                          className={`pb-2 transition flex items-center gap-2 text-sm sm:text-base cursor-pointer ${
                            activeTab === "queue"
                              ? "text-accent-600 dark:text-accent-400 font-bold border-b-2 border-accent-600 dark:border-accent-400"
                              : "text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          <ListMusic className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Antrian Lagu</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {queueList.length}
                          </span>
                        </button>

                        <button
                          onClick={() => setActiveTab("lyrics")}
                          className={`pb-2 transition flex items-center gap-2 text-sm sm:text-base cursor-pointer ${
                            activeTab === "lyrics"
                              ? "text-accent-600 dark:text-accent-400 font-bold border-b-2 border-accent-600 dark:border-accent-400"
                              : "text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-zinc-100"
                          }`}
                        >
                          <Mic2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Lirik Sinkron (Karaoke)</span>
                        </button>
                      </div>

                      {activeTab === "queue" && isFetchingRelated && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                          <Loader2 className="animate-spin h-3.5 w-3.5 text-accent-500" />
                          <span>Menyiapkan antrian...</span>
                        </div>
                      )}

                      {activeTab === "lyrics" && isFetchingLyrics && (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                          <Loader2 className="animate-spin h-3.5 w-3.5 text-accent-500" />
                          <span>Mencari lirik...</span>
                        </div>
                      )}
                    </div>

                    {/* Tab 1: Queue Content */}
                    {activeTab === "queue" && (
                      <div className="flex-1 divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-y-auto max-h-[580px] custom-scrollbar">
                        {queueList.map((song, index) => (
                          <div
                            key={`q-${song.id}-${index}`}
                            onClick={() => playSongFromQueue(song)}
                            className="group flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition duration-150"
                          >
                            <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 w-6 text-center shrink-0">
                              {index + 1}
                            </div>
                            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shrink-0 shadow-xs bg-zinc-100 dark:bg-zinc-800">
                              <img
                                src={song.thumbnail || song.album_art}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-sm group-hover:text-accent-600 dark:group-hover:text-accent-400 transition">
                                {song.title}
                              </h4>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                                {song.artist}
                              </p>
                            </div>
                            <div className="text-xs font-mono text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                              {song.duration}
                            </div>
                          </div>
                        ))}

                        {queueList.length === 0 && !isFetchingRelated && (
                          <div className="p-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                            <Disc3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <p>Antrian kosong. Cari lagu lainnya untuk menambahkan ke antrian!</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Synchronized Karaoke Lyrics */}
                    {activeTab === "lyrics" && (
                      <div className="relative flex-1 bg-zinc-950 overflow-hidden min-h-[500px]">
                        <div
                          ref={lyricsContainerRef}
                          className="absolute inset-0 overflow-y-auto px-4 sm:px-8 py-28 text-center custom-scrollbar"
                          style={{ scrollBehavior: "smooth" }}
                        >
                          {!isFetchingLyrics && lyrics.length === 0 && (
                            <div className="text-zinc-500 mt-28 font-medium flex flex-col items-center">
                              <Mic2 className="w-12 h-12 mb-3 text-zinc-600 opacity-60" />
                              <p>Lirik untuk lagu ini belum tersedia di katalog LRCLIB.</p>
                            </div>
                          )}

                          {isFetchingLyrics && (
                            <div className="text-zinc-500 mt-28 animate-pulse font-medium flex flex-col items-center">
                              <Loader2 className="w-8 h-8 animate-spin mb-3 text-accent-500" />
                              <p>Sedang menyinkronkan lirik dengan audio stream...</p>
                            </div>
                          )}

                          {lyrics.map((line, index) => {
                            const isActive = activeLyricIndex === index;
                            const isPast = activeLyricIndex > index;
                            return (
                              <div
                                key={index}
                                id={`lyric-${index}`}
                                onClick={() => seekToLyric(line)}
                                className={`my-4 text-base sm:text-xl font-bold transition-all duration-300 cursor-pointer select-none leading-relaxed ${
                                  isActive
                                    ? "text-accent-400 scale-105 drop-shadow-[0_0_15px_rgba(37,99,235,0.7)]"
                                    : isPast
                                    ? "text-zinc-600"
                                    : "text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                {line.text}
                              </div>
                            );
                          })}
                        </div>

                        {/* Top & Bottom Vignette Gradients */}
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* FLOATING MINI-PLAYER BAR (When browsing Search page)     */}
        {/* ======================================================== */}
        {currentPage === "search" && currentSong && (
          <div
            onClick={() => setCurrentPage("player")}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-zinc-900/95 backdrop-blur-md text-white border border-zinc-800 rounded-2xl shadow-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-zinc-700 transition"
          >
            <img
              src={currentSong.thumbnail || currentSong.album_art}
              className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-xs"
              alt=""
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentSong.title}
              </div>
              <div className="text-[11px] text-zinc-400 truncate">
                {currentSong.artist}
              </div>
              {/* Mini progress */}
              <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-accent-500 h-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl hover:bg-zinc-800 text-white transition cursor-pointer"
                title={isPlaying ? "Jeda" : "Putar"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
              </button>
              <button
                onClick={playNext}
                className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                title="Lagu Berikutnya"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* COPYRIGHT FOOTER                                         */}
        {/* ======================================================== */}
        <footer className="mt-14 mb-8 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs text-xs text-zinc-500 dark:text-zinc-400">
            <Music className="w-3.5 h-3.5 text-accent-500" />
            <span>
              &copy; {new Date().getFullYear()}{" "}
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                RPL Music By Elostra
              </strong>
              . Hak Cipta Dilindungi.
            </span>
          </div>
        </footer>

        {/* Hidden YouTube Player Iframe */}
        <div
          id="youtube-player"
          className="fixed bottom-0 left-0 w-px h-px opacity-0 pointer-events-none"
        ></div>

        {/* Native Dummy Audio to unlock iOS/Android Media Session */}
        <audio
          ref={dummyAudioRef}
          loop
          src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
        />
      </main>
    </div>
  );
}
