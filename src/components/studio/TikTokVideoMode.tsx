"use client";

import React, { useState, useRef, useEffect } from "react";
import CameraViewfinder, { CameraViewfinderRef } from "./CameraViewfinder";
import { STUDIO_FILTERS, StudioFilter } from "@/lib/studio-filters";
import { STUDIO_BGM_TRACKS, BgmTrack } from "@/lib/studio-presets";
import { mixMicrophoneAndBgm, playCountdownBeep } from "@/lib/studio-audio";
import {
  Music,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Clock,
  Zap,
  Upload,
  Check,
  X,
  Radio,
  Search,
  RefreshCw,
} from "lucide-react";

export default function TikTokVideoMode() {
  const cameraRef = useRef<CameraViewfinderRef>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  // States
  const [activeFilter, setActiveFilter] = useState<StudioFilter>(STUDIO_FILTERS[0]);
  const [isMirrored, setIsMirrored] = useState(true);

  // Video Settings
  const [maxDuration, setMaxDuration] = useState<number>(30);
  const [recordingSpeed, setRecordingSpeed] = useState<number>(1);
  const [countdownDelay, setCountdownDelay] = useState<number>(3);
  const [selectedBgm, setSelectedBgm] = useState<BgmTrack | null>(STUDIO_BGM_TRACKS[0]);

  // Recording Lifecycle
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);

  // Recorded Video Output
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoCaption, setVideoCaption] = useState("Vibe santai anak 10 RPL 💻🔥 #10RPL #SMK17");

  // Modals
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [customAudioFile, setCustomAudioFile] = useState<string | null>(null);
  const [customAudioName, setCustomAudioName] = useState<string | null>(null);

  // Music API Catalog State (30-second songs)
  const [apiMusicList, setApiMusicList] = useState<BgmTrack[]>([]);
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [isLoadingMusic, setIsLoadingMusic] = useState(false);
  const [activeMusicCategory, setActiveMusicCategory] = useState("viral");

  // Sound Preview in Modal
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch 30-second songs from Music API
  const searchMusicFromApi = async (query = "tiktok viral") => {
    setIsLoadingMusic(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter only songs that have a valid 30-second preview URL
        const withPreview: BgmTrack[] = json.data
          .filter((item: any) => item.preview_url && item.preview_url.trim().length > 0)
          .map((item: any) => ({
            id: String(item.id || item.track_id),
            title: item.title,
            artist: item.artist || "Unknown Artist",
            genre: item.album || "Pop / Viral",
            durationSec: 30, // 30-second preview clip
            url: item.preview_url,
            coverArt: item.thumbnail || item.album_art || "",
            badge: "🎵 30s",
          }));

        if (withPreview.length > 0) {
          setApiMusicList(withPreview);
          // Set first 30s song if user still has fallback track selected
          setSelectedBgm((curr) => (!curr || curr.id.startsWith("bgm-") ? withPreview[0] : curr));
        }
      }
    } catch (err) {
      console.error("Failed to fetch music from API:", err);
    } finally {
      setIsLoadingMusic(false);
    }
  };

  // Load initial 30s songs from Music API on mount
  useEffect(() => {
    searchMusicFromApi("tiktok viral");
  }, []);

  // Handle custom audio upload
  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomAudioFile(url);
    setCustomAudioName(file.name);

    const customTrack: BgmTrack = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Musik Unggahan Sendiri",
      genre: "Custom Audio",
      durationSec: 30,
      url,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&q=80",
      badge: "🎧 30s",
    };
    setSelectedBgm(customTrack);
    setIsMusicModalOpen(false);
  };

  // Recording Timer Interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedSeconds((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return next;
        });
      }, 1000 / recordingSpeed);
    }
    return () => clearInterval(interval);
  }, [isRecording, maxDuration, recordingSpeed]);

  // Start Recording sequence (with optional 3s/10s countdown)
  const handleStartRecordFlow = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (countdownDelay > 0) {
      setIsCountingDown(true);
      for (let i = countdownDelay; i >= 1; i--) {
        setCountdownSec(i);
        playCountdownBeep(i === 1);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setIsCountingDown(false);
      setCountdownSec(null);
    }

    startActualRecording();
  };

  const startActualRecording = () => {
    if (!cameraRef.current) return;
    const stream = cameraRef.current.getCompositeStream() || cameraRef.current.getStream();
    if (!stream) {
      alert("Kamera belum siap. Mohon pastikan izin kamera telah diberikan.");
      return;
    }

    recordedChunksRef.current = [];
    setRecordedSeconds(0);

    // Prepare Background Music (30-second audio track from Music API)
    let bgmElem: HTMLAudioElement | null = null;
    if (selectedBgm && selectedBgm.url) {
      bgmElem = new Audio();
      bgmElem.crossOrigin = "anonymous";
      // Route through proxy to ensure CORS compliance with Web Audio API
      bgmElem.src =
        selectedBgm.url.startsWith("blob:") || selectedBgm.url.startsWith("/")
          ? selectedBgm.url
          : `/api/studio/proxy-audio?url=${encodeURIComponent(selectedBgm.url)}`;
      bgmElem.currentTime = 0;
      bgmElem.volume = 0.75;
      bgmElem.playbackRate = recordingSpeed;
      bgmAudioRef.current = bgmElem;
    }

    // Audio Mixing: Combine mic stream + 30s BGM audio into a single stream
    const { mixedStream, cleanup } = mixMicrophoneAndBgm(stream, bgmElem);
    audioCleanupRef.current = cleanup;

    // Create combined MediaStream (video track from webcam + audio track from mixed audio)
    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...mixedStream.getAudioTracks(),
    ]);

    // Choose supported MIME type
    let mimeType = "video/webm;codecs=vp9,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm;codecs=vp8,opus";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/mp4";
    }

    try {
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });
        const url = URL.createObjectURL(fullBlob);
        setVideoBlobUrl(url);
        setIsRecording(false);

        // Stop BGM
        if (bgmAudioRef.current) {
          bgmAudioRef.current.pause();
        }
        if (audioCleanupRef.current) {
          audioCleanupRef.current();
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // Collect data every 250ms
      setIsRecording(true);

      // Play BGM in sync
      if (bgmElem) {
        bgmElem.play().catch((e) => console.warn("Audio play error:", e));
      }
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Browser Anda tidak mendukung perekaman format video ini.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
    }
  };

  const resetRecording = () => {
    if (videoBlobUrl) {
      URL.revokeObjectURL(videoBlobUrl);
    }
    setVideoBlobUrl(null);
    setRecordedSeconds(0);
    recordedChunksRef.current = [];
  };

  const downloadVideo = () => {
    if (!videoBlobUrl) return;
    const a = document.createElement("a");
    a.href = videoBlobUrl;
    a.download = `10RPL-TikTok-${Date.now()}.webm`;
    a.click();
  };

  // Preview 30-second audio track in modal
  const togglePreviewTrack = (track: BgmTrack) => {
    if (previewingTrackId === track.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingTrackId(null);
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      const audio = new Audio(track.url);
      audio.volume = 0.7;
      audio.play().catch(() => {});
      audio.onended = () => setPreviewingTrackId(null);
      previewAudioRef.current = audio;
      setPreviewingTrackId(track.id);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* If Video has been recorded, show Post-Recording Preview Screen */}
      {videoBlobUrl ? (
        <div className="bg-zinc-950 text-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-zinc-800 max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Video Berhasil Direkam!
            </span>
            <button
              type="button"
              onClick={resetRecording}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rekam Ulang
            </button>
          </div>

          {/* 9:16 Video Player */}
          <div className="relative aspect-9/16 bg-black rounded-2xl overflow-hidden shadow-inner border border-zinc-800">
            <video
              src={videoBlobUrl}
              autoPlay
              loop
              playsInline
              controls
              className="w-full h-full object-cover"
            />

            {/* Simulated TikTok Watermark & Sound Tag */}
            <div className="absolute bottom-14 left-3 right-3 pointer-events-none text-left">
              <div className="text-xs font-bold text-white drop-shadow-md">
                @10rpl.smkn17
              </div>
              <p className="text-[11px] text-zinc-200 line-clamp-2 drop-shadow-sm mt-0.5">
                {videoCaption}
              </p>
              {selectedBgm && (
                <div className="flex items-center gap-1 text-[10px] text-pink-300 font-medium mt-1">
                  <Music className="w-3 h-3 animate-spin" />
                  <span className="truncate">{selectedBgm.title} • {selectedBgm.artist}</span>
                </div>
              )}
            </div>
          </div>

          {/* Caption Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">
              Teks / Caption Video
            </label>
            <input
              type="text"
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-hidden focus:ring-2 focus:ring-accent-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={downloadVideo}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Unduh Video (TikTok Ready)
            </button>
            <button
              type="button"
              onClick={resetRecording}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Ulangi
            </button>
          </div>
        </div>
      ) : (
        /* Camera Recording Viewfinder (TikTok 9:16 Style) */
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-9/16 bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800/80">
            {/* Top Progress Bar */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-white/20 z-30">
              <div
                className="h-full bg-rose-500 transition-all duration-300 ease-linear shadow-xs"
                style={{
                  width: `${(recordedSeconds / maxDuration) * 100}%`,
                }}
              />
            </div>

            {/* Top Music Bar Pill (TikTok Header) */}
            <div className="absolute top-3 inset-x-0 z-30 flex items-center justify-center px-3">
              <button
                type="button"
                onClick={() => setIsMusicModalOpen(true)}
                className="max-w-[85%] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20 shadow-md transition hover:scale-105 cursor-pointer truncate"
              >
                <Music className="w-3.5 h-3.5 text-pink-400 shrink-0 animate-pulse" />
                <span className="truncate">
                  {selectedBgm ? `${selectedBgm.title} - ${selectedBgm.artist}` : "Pilih Lagu (30 Detik)"}
                </span>
                <span className="px-1.5 py-0.2 bg-pink-500/30 text-pink-300 text-[9px] rounded-full shrink-0 font-bold">
                  30s
                </span>
              </button>
            </div>

            {/* Viewfinder Camera Feed */}
            <CameraViewfinder
              ref={cameraRef}
              cssFilter={activeFilter.cssFilter}
              activeFilterId={activeFilter.id}
              isMirrored={isMirrored}
              aspectRatioClass="aspect-9/16"
              overlayContent={
                <>
                  {/* VHS Overlay Timestamp effect if retro filter active */}
                  {activeFilter.id === "retro-vhs" && (
                    <div className="absolute top-12 left-4 z-20 pointer-events-none font-mono text-emerald-400 text-xs tracking-widest drop-shadow-md">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>REC [●] 00:00:{String(recordedSeconds).padStart(2, "0")}</span>
                      </div>
                      <div className="text-[9px] text-emerald-300/80 mt-0.5">
                        SP • 10 RPL VHS TAPE
                      </div>
                    </div>
                  )}

                  {/* Countdown Overlay */}
                  {isCountingDown && countdownSec !== null && (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs">
                      <div className="w-24 h-24 rounded-full border-4 border-rose-500 flex items-center justify-center animate-ping">
                        <span className="text-6xl font-black text-white">
                          {countdownSec}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white mt-4 uppercase tracking-widest">
                        Bersiap Pose...
                      </span>
                    </div>
                  )}

                  {/* Recording Indicator */}
                  {isRecording && (
                    <div className="absolute top-12 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[10px] font-bold shadow-md animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>
                        00:{String(recordedSeconds).padStart(2, "0")} / 00:
                        {String(maxDuration).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </>
              }
            />

            {/* Right TikTok Action Sidebar */}
            <div className="absolute right-3 top-16 z-30 flex flex-col items-center gap-3">
              {/* Duration Switcher (15s or 30s) */}
              <button
                type="button"
                onClick={() => setMaxDuration((prev) => (prev === 15 ? 30 : 15))}
                disabled={isRecording}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex flex-col items-center justify-center text-[10px] font-bold transition hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Ganti Durasi Maksimal (15s / 30s)"
              >
                <Clock className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
                <span>{maxDuration}s</span>
              </button>

              {/* Speed Switcher */}
              <button
                type="button"
                onClick={() =>
                  setRecordingSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 0.5 : 1))
                }
                disabled={isRecording}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex flex-col items-center justify-center text-[10px] font-bold transition hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Kecepatan Rekaman"
              >
                <Zap className="w-3.5 h-3.5 mb-0.5 text-yellow-400" />
                <span>{recordingSpeed}x</span>
              </button>

              {/* Timer Countdown Toggle */}
              <button
                type="button"
                onClick={() =>
                  setCountdownDelay((prev) => (prev === 0 ? 3 : prev === 3 ? 10 : 0))
                }
                disabled={isRecording}
                className={`w-10 h-10 rounded-full backdrop-blur-md text-white border flex flex-col items-center justify-center text-[10px] font-bold transition hover:scale-105 cursor-pointer disabled:opacity-50 ${
                  countdownDelay > 0
                    ? "bg-rose-600/80 border-rose-400"
                    : "bg-black/50 border-white/20 hover:bg-black/70"
                }`}
                title="Timer Hitung Mundur Sebelum Rekam"
              >
                <Radio className="w-3.5 h-3.5 mb-0.5" />
                <span>{countdownDelay === 0 ? "Off" : `${countdownDelay}s`}</span>
              </button>

              {/* Visual Filter Picker Button */}
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                disabled={isRecording}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex flex-col items-center justify-center text-[10px] font-bold transition hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Pilih Efek Filter"
              >
                <Sparkles className="w-3.5 h-3.5 mb-0.5 text-pink-400" />
                <span>Efek</span>
              </button>

              {/* Mirror Toggle */}
              <button
                type="button"
                onClick={() => setIsMirrored(!isMirrored)}
                disabled={isRecording}
                className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex flex-col items-center justify-center text-[9px] font-bold transition hover:scale-105 cursor-pointer disabled:opacity-50"
                title="Mirror Kamera"
              >
                <span>{isMirrored ? "🪞 Mir" : "Normal"}</span>
              </button>
            </div>

            {/* Bottom Controls (Big Red Record Button) */}
            <div className="absolute bottom-4 inset-x-0 z-30 flex flex-col items-center gap-2">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleStartRecordFlow}
                  className={`relative flex items-center justify-center transition-all cursor-pointer ${
                    isRecording ? "scale-110" : "hover:scale-105"
                  }`}
                  aria-label={isRecording ? "Hentikan Rekaman" : "Mulai Rekam"}
                >
                  {/* Outer Pulsing Ring */}
                  <div
                    className={`w-18 h-18 rounded-full border-4 flex items-center justify-center transition-all ${
                      isRecording
                        ? "border-red-500 animate-ping duration-1000"
                        : "border-white/80"
                    }`}
                  >
                    {/* Inner Button */}
                    <div
                      className={`transition-all ${
                        isRecording
                          ? "w-8 h-8 rounded-md bg-red-600 shadow-lg"
                          : "w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 shadow-md"
                      }`}
                    />
                  </div>
                </button>
              </div>

              <div className="text-[11px] font-bold text-white drop-shadow-md">
                {isRecording ? "Ketuk untuk Berhenti" : "Ketuk untuk Rekam"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Music Picker (Lagu 30 Detik dari API Music) */}
      {isMusicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-3.5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Pilih Lagu TikTok (30 Detik)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Lagu diambil dari API Musik lengkap dengan klip 30 detik
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (previewAudioRef.current) previewAudioRef.current.pause();
                  setPreviewingTrackId(null);
                  setIsMusicModalOpen(false);
                }}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (musicSearchQuery.trim()) {
                  searchMusicFromApi(musicSearchQuery.trim());
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={musicSearchQuery}
                  onChange={(e) => setMusicSearchQuery(e.target.value)}
                  placeholder="Cari judul lagu / artis (cth: Bernadya, Hindia, Lofi, Phonk)..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <span>Cari</span>
              </button>
            </form>

            {/* Quick Category Chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { label: "🔥 TikTok Viral", query: "tiktok viral", key: "viral" },
                { label: "🎧 Lo-Fi Koding", query: "lofi beats", key: "lofi" },
                { label: "☕ Indie Senja", query: "indie pop indonesia", key: "indie" },
                { label: "⚡ Phonk & Beat", query: "phonk tiktok", key: "phonk" },
                { label: "✨ Anime Chill", query: "anime chill", key: "anime" },
                { label: "🎸 Pop Hits", query: "pop hits", key: "pop" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveMusicCategory(cat.key);
                    setMusicSearchQuery(cat.query);
                    searchMusicFromApi(cat.query);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeMusicCategory === cat.key
                      ? "bg-pink-600 text-white shadow-xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Song List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-1">
              {isLoadingMusic ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-pink-500" />
                  <span className="text-xs">Mencari lagu 30 detik dari API...</span>
                </div>
              ) : apiMusicList.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">
                  Tidak ada lagu dengan klip 30 detik yang ditemukan. Coba cari judul lain.
                </div>
              ) : (
                apiMusicList.map((track) => {
                  const isSelected = selectedBgm?.id === track.id;
                  const isPlaying = previewingTrackId === track.id;
                  return (
                    <div
                      key={track.id}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? "border-pink-500 bg-pink-50/50 dark:bg-pink-950/30 shadow-xs"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 mr-2">
                        {/* Cover art with play/pause preview button overlay */}
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                          {track.coverArt ? (
                            <img
                              src={track.coverArt}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-500">
                              <Music className="w-5 h-5" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePreviewTrack(track)}
                            className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition cursor-pointer"
                            title="Dengar 30 Detik"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 fill-white" />
                            )}
                          </button>
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {track.title}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {track.artist}
                          </div>
                          <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 mt-0.5">
                            🎵 30 Detik
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBgm(track);
                          if (previewAudioRef.current) previewAudioRef.current.pause();
                          setPreviewingTrackId(null);
                          setIsMusicModalOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                          isSelected
                            ? "bg-pink-600 text-white shadow-xs"
                            : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {isSelected ? "Dipakai" : "Pilih"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Custom Upload Option */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <label className="flex items-center justify-center gap-2 p-2.5 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-pink-500 transition cursor-pointer text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <Upload className="w-4 h-4 text-pink-500" />
                <span>
                  {customAudioName ? `Ganti Unggahan (${customAudioName})` : "Atau Unggah Lagu Sendiri (.mp3)"}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleCustomAudioUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Visual Filter Selector */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Pilih Efek Filter Kamera
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {STUDIO_FILTERS.map((f) => {
                const isSelected = activeFilter.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setActiveFilter(f);
                      setIsFilterModalOpen(false);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                      isSelected
                        ? "border-accent-600 bg-accent-50/50 dark:bg-accent-950/30 ring-2 ring-accent-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl">{f.badge}</span>
                      {f.isAr && (
                        <span className="px-1.5 py-0.2 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 text-[9px] font-bold">
                          AR Wajah
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {f.name}
                    </div>
                    <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                      {f.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
