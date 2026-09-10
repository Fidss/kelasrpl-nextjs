"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
  Sparkles,
  MoveHorizontal,
  Camera,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Memory {
  id: number;
  title: string;
  tag: string;
  date: string;
  desc: string;
  image: string;
  user_id?: number | null;
  user_name?: string | null;
}

const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 1,
    title: "Canda & Tawa di Koridor Kelas",
    tag: "Koridor 10 RPL",
    date: "Agustus 2026",
    desc: "Momen kebersamaan penuh senyum di depan kelas setelah jam istirahat. Tempat bertukar cerita, tawa, dan canda bareng teman-teman sekelas.",
    image: "https://i.ibb.co.com/DHzZLDC2/Whats-App-Image-2026-09-09-at-7-27-34-PM-1.jpg",
    user_name: "Admin Kelas",
  },
  {
    id: 2,
    title: "Hangatnya Bimbingan Wali Kelas",
    tag: "Lapangan Basket & Wali Kelas",
    date: "September 2026",
    desc: "Foto bersama Bapak Wali Kelas tercinta di tengah lapangan SMKN 17 Jakarta. Sosok pembimbing yang selalu memotivasi dan merangkul kami.",
    image: "https://i.ibb.co.com/1J2PstFg/Whats-App-Image-2026-09-09-at-7-27-35-PM.jpg",
    user_name: "Admin Kelas",
  },
  {
    id: 3,
    title: "Retro Vibes & Sahabat Sejati",
    tag: "Vintage Memory",
    date: "Oktober 2026",
    desc: "Potret candid gaya vintage bersama kawan-kawan terbaik. Senyum polos dan kenangan masa putih abu-abu yang takkan pernah pudar.",
    image: "https://i.ibb.co.com/m5nLDBpD/Whats-App-Image-2026-09-09-at-7-27-35-PM-1.jpg",
    user_name: "Admin Kelas",
  },
  {
    id: 4,
    title: "Keluarga Besar 10 RPL Terpadu",
    tag: "Solidaritas 10 RPL",
    date: "November 2026",
    desc: "Seluruh kawan seangkatan berkumpul dengan bangga di lapangan basket. Satu frekuensi, satu impian menjadi software engineer masa depan.",
    image: "https://i.ibb.co.com/0y8ypjMn/Whats-App-Image-2026-09-09-at-7-27-34-PM.jpg",
    user_name: "Admin Kelas",
  },
];

const STACK_STYLES = [
  { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", zIndex: 40, opacity: 1 },
  { transform: "translate3d(0, -14px, 0) scale(0.96) rotate(2deg)", zIndex: 30, opacity: 0.9 },
  { transform: "translate3d(0, -28px, 0) scale(0.92) rotate(-2deg)", zIndex: 20, opacity: 0.75 },
  { transform: "translate3d(0, -42px, 0) scale(0.88) rotate(1deg)", zIndex: 10, opacity: 0.5 },
];

export default function OurMemories() {
  const { t } = useLanguage();
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const startPosRef = useRef({ x: 0, y: 0 });
  const totalCards = memories.length;

  // Fetch dynamic memories from API
  useEffect(() => {
    let isMounted = true;
    fetch("/api/memories")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setMemories(json.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching dynamic memories:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure currentIndex stays within bounds when memories length changes
  useEffect(() => {
    if (currentIndex >= totalCards && totalCards > 0) {
      setCurrentIndex(0);
    }
  }, [totalCards, currentIndex]);

  // Next Card Animation
  const nextCard = useCallback(() => {
    if (isTransitioning || totalCards === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalCards);
      setDragOffset({ x: 0, y: 0 });
      setIsTransitioning(false);
    }, 220);
  }, [isTransitioning, totalCards]);

  // Previous Card Animation
  const prevCard = useCallback(() => {
    if (isTransitioning || totalCards === 0) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
      setDragOffset({ x: 0, y: 0 });
      setIsTransitioning(false);
    }, 220);
  }, [isTransitioning, totalCards]);

  const jumpTo = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setCurrentIndex(index);
    setDragOffset({ x: 0, y: 0 });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === "Escape") setLightboxIndex(null);
        if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null ? (prev + 1) % totalCards : 0));
        if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null ? (prev - 1 + totalCards) % totalCards : 0));
        return;
      }
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, nextCard, prevCard, totalCards]);

  // Pointer drag events for front card
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isTransitioning) return;
    setIsDragging(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = dragOffset.x;
    if (deltaX < -70) {
      nextCard();
    } else if (deltaX > 70) {
      prevCard();
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  return (
    <section
      id="memories"
      className="py-16 sm:py-24 relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-900 transition-colors duration-200"
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/5 via-transparent to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span data-i18n="home.memories_badge">{t("home.memories_badge")}</span>
          </div>
          <h2
            className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3"
            data-i18n="home.memories_title"
          >
            {t("home.memories_title")}
          </h2>
          <p
            className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400"
            data-i18n="home.memories_desc"
          >
            {t("home.memories_desc")}
          </p>

          {/* Interactive Hint & Action Link */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full shadow-2xs">
              <MoveHorizontal className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span data-i18n="home.memories_hint">{t("home.memories_hint")}</span>
            </div>
            <Link
              href="/dashboard#memories-section"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 px-3.5 py-1 rounded-full shadow-2xs transition-all hover:scale-105 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>+ Tambah Kenangan</span>
            </Link>
          </div>
        </div>

        {/* Stacked Card Stage */}
        <div className="relative max-w-md sm:max-w-xl mx-auto flex flex-col items-center">
          {/* Card Deck Stage Container */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[16/13] max-h-[490px] flex items-center justify-center">
            {memories.map((item, originalIdx) => {
              const pos = (originalIdx - currentIndex + totalCards) % totalCards;
              const preset = STACK_STYLES[pos] || STACK_STYLES[STACK_STYLES.length - 1];

              const isTop = pos === 0;
              let styleTransform = preset.transform;

              if (isTop) {
                if (isTransitioning) {
                  styleTransform = "translate3d(-340px, -20px, 0) rotate(-14deg) scale(0.92)";
                } else if (isDragging) {
                  const rot = dragOffset.x * 0.04;
                  styleTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.2}px, 0) rotate(${rot}deg) scale(1)`;
                }
              }

              return (
                <div
                  key={item.id}
                  onClick={() => !isTop && jumpTo(originalIdx)}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                  style={{
                    transform: styleTransform,
                    zIndex: isTop && isTransitioning ? 50 : preset.zIndex,
                    opacity: isTop && isTransitioning ? 0 : preset.opacity,
                    transition:
                      isDragging && isTop
                        ? "none"
                        : "transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.28s ease",
                    touchAction: "pan-y",
                  }}
                  className={`absolute inset-x-2 sm:inset-x-4 inset-y-0 bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-md overflow-hidden select-none ${
                    isTop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  }`}
                >
                  {/* Photo Section */}
                  <div className="relative w-full h-[64%] sm:h-[68%] overflow-hidden bg-zinc-950">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover object-center pointer-events-none select-none"
                      loading="eager"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 text-white border border-white/15 backdrop-blur-xs">
                        {item.tag}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/60 text-zinc-300 border border-white/10 backdrop-blur-xs">
                        {item.date}
                      </span>
                    </div>

                    {/* Zoom Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(originalIdx);
                      }}
                      className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/20 shadow-md active:scale-90 transition-transform cursor-pointer z-10"
                      title="Perbesar Foto"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>

                    {/* Drag Stamp: NEXT */}
                    {isTop && dragOffset.x < -30 && (
                      <div className="absolute top-6 right-6 px-3 py-1 rounded-lg border-2 border-emerald-500 text-emerald-500 font-extrabold text-xs uppercase tracking-wider rotate-12 pointer-events-none bg-emerald-950/40 backdrop-blur-xs shadow-lg">
                        NEXT ❯
                      </div>
                    )}

                    {/* Drag Stamp: PREV */}
                    {isTop && dragOffset.x > 30 && (
                      <div className="absolute top-6 left-6 px-3 py-1 rounded-lg border-2 border-rose-500 text-rose-500 font-extrabold text-xs uppercase tracking-wider -rotate-12 pointer-events-none bg-rose-950/40 backdrop-blur-xs shadow-lg">
                        ❮ PREV
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between h-[36%] sm:h-[32%] bg-white dark:bg-zinc-900">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.title}
                        </h3>
                        <span className="text-xs font-mono font-bold text-rose-500">
                          #{String(originalIdx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 font-medium truncate max-w-[70%]">
                        <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                        <span className="truncate">
                          {item.user_name ? `${item.user_name}` : "Memori Angkatan"}
                        </span>
                      </span>
                      <span className="font-mono text-zinc-400 shrink-0">
                        {originalIdx + 1} / {totalCards}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls Bar */}
          <div className="mt-6 flex items-center justify-between gap-3 w-full px-2">
            {/* Counter & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                {totalCards > 0
                  ? `${String(currentIndex + 1).padStart(2, "0")} / ${String(totalCards).padStart(2, "0")}`
                  : "00 / 00"}
              </span>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                {memories[currentIndex]?.title || "Memori Kelas"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={prevCard}
                className="p-2 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 active:scale-95 transition cursor-pointer"
                title="Kartu Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={nextCard}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-accent-600 hover:from-rose-600 hover:to-accent-700 text-white font-semibold text-xs shadow-sm active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                title="Kartu Selanjutnya"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Thumbnail Selector Strip (scrollable if many cards) */}
          <div className="mt-4 flex items-center justify-center gap-2 overflow-x-auto max-w-full py-1 px-2 scrollbar-none">
            {memories.map((thumb, idx) => (
              <button
                key={thumb.id}
                type="button"
                onClick={() => jumpTo(idx)}
                className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 shrink-0 cursor-pointer ${
                  idx === currentIndex
                    ? "border-rose-500 ring-2 ring-rose-500/30 opacity-100 scale-105"
                    : "border-zinc-200 dark:border-zinc-800 opacity-50 hover:opacity-80"
                }`}
                title={thumb.title}
              >
                <img
                  src={thumb.image}
                  alt={thumb.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setLightboxIndex(null)}
          ></div>

          <div className="relative z-10 max-w-3xl w-full max-h-[90vh] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col md:flex-row">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 active:scale-90 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image View */}
            <div className="relative md:w-3/5 bg-black flex items-center justify-center min-h-[240px] sm:min-h-[360px]">
              <img
                src={memories[lightboxIndex]?.image}
                alt={memories[lightboxIndex]?.title}
                className="w-full h-full object-contain max-h-[45vh] md:max-h-[80vh]"
              />
            </div>

            {/* Details */}
            <div className="md:w-2/5 p-5 sm:p-6 flex flex-col justify-between bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {memories[lightboxIndex]?.tag}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {memories[lightboxIndex]?.date}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  {memories[lightboxIndex]?.title}
                </h3>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3">
                  {memories[lightboxIndex]?.desc}
                </p>

                {memories[lightboxIndex]?.user_name && (
                  <p className="text-xs text-rose-400 font-medium">
                    Diunggah oleh: {memories[lightboxIndex]?.user_name}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex(
                        (lightboxIndex - 1 + totalCards) % totalCards
                      )
                    }
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 active:scale-90 transition cursor-pointer"
                    title="Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((lightboxIndex + 1) % totalCards)
                    }
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 active:scale-90 transition cursor-pointer"
                    title="Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <span className="text-[11px] font-mono text-zinc-500">
                  ESC untuk menutup
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
