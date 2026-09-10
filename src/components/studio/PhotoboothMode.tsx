"use client";

import React, { useState, useRef, useEffect } from "react";
import CameraViewfinder, { CameraViewfinderRef } from "./CameraViewfinder";
import FilterSelector from "./FilterSelector";
import StickerPicker, { PlacedSticker } from "./StickerPicker";
import TemplatePickerModal from "./TemplatePickerModal";
import {
  PHOTOBOOTH_TEMPLATES,
  PRESET_FRAME_THEMES,
  PhotoboothTemplate,
  FrameTheme,
} from "@/lib/photobooth-templates";
import { STUDIO_FILTERS, StudioFilter } from "@/lib/studio-filters";
import { playCountdownBeep } from "@/lib/studio-audio";
import { StudioSticker } from "@/lib/studio-presets";
import {
  Camera,
  Download,
  RotateCcw,
  Sparkles,
  Layout,
  Play,
  Copy,
  Check,
} from "lucide-react";

export default function PhotoboothMode() {
  const cameraRef = useRef<CameraViewfinderRef>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [currentTemplate, setCurrentTemplate] = useState<PhotoboothTemplate>(
    PHOTOBOOTH_TEMPLATES[0]
  );
  const [currentTheme, setCurrentTheme] = useState<FrameTheme>(PRESET_FRAME_THEMES[0]);
  const [activeFilter, setActiveFilter] = useState<StudioFilter>(STUDIO_FILTERS[0]);
  const [isMirrored, setIsMirrored] = useState(true);

  // Captured Photos Array (maps to slots)
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  // Capture Sequence State
  const [isSequencing, setIsSequencing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Custom Text Customization
  const [customFooterTitle, setCustomFooterTitle] = useState(
    currentTemplate.footerArea.defaultText
  );
  const [customFooterSub, setCustomFooterSub] = useState(
    currentTemplate.footerArea.subText || ""
  );
  const [showTimestamp, setShowTimestamp] = useState(true);

  // Stickers
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  // Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Keep footer text in sync when template changes
  useEffect(() => {
    setCustomFooterTitle(currentTemplate.footerArea.defaultText);
    setCustomFooterSub(currentTemplate.footerArea.subText || "");
    // Reset photos if slot count changed
    setCapturedPhotos([]);
    setCurrentSlotIndex(0);
  }, [currentTemplate]);

  // Handle single manual shot capture
  const takeSingleSnapshot = () => {
    if (!cameraRef.current) return;
    const photoData = cameraRef.current.captureFrame();
    if (photoData) {
      setCapturedPhotos((prev) => {
        const next = [...prev];
        next[currentSlotIndex] = photoData;
        return next;
      });
      if (currentSlotIndex < currentTemplate.totalSlots - 1) {
        setCurrentSlotIndex((prev) => prev + 1);
      }
    }
  };

  // Automated Sequential Capture Workflow (3-2-1 Countdown per slot)
  const startAutoCaptureSequence = async () => {
    if (isSequencing || !cameraRef.current) return;
    setIsSequencing(true);

    const total = currentTemplate.totalSlots;
    const newPhotos: string[] = [];

    for (let slot = 0; slot < total; slot++) {
      setCurrentSlotIndex(slot);

      // Countdown 3, 2, 1
      for (let sec = 3; sec >= 1; sec--) {
        setCountdown(sec);
        playCountdownBeep(sec === 1);
        await new Promise((r) => setTimeout(r, 1000));
      }
      setCountdown(null);

      // Snap picture!
      const photo = cameraRef.current.captureFrame();
      if (photo) {
        newPhotos.push(photo);
        setCapturedPhotos([...newPhotos]);
      }

      // Rest period (2.2 seconds) to let user prepare next pose
      if (slot < total - 1) {
        await new Promise((r) => setTimeout(r, 2200));
      }
    }

    setIsSequencing(false);
  };

  // Sticker Handlers
  const handleAddSticker = (sticker: StudioSticker) => {
    const newSticker: PlacedSticker = {
      uid: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sticker,
      xPercent: 20 + Math.random() * 60,
      yPercent: 20 + Math.random() * 60,
      scale: 1,
    };
    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  const handleRemoveSticker = (uid: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.uid !== uid));
  };

  const handleClearStickers = () => {
    setPlacedStickers([]);
  };

  // Retake all photos
  const handleResetPhotos = () => {
    setCapturedPhotos([]);
    setCurrentSlotIndex(0);
    setPlacedStickers([]);
  };

  // High-Resolution Composite Canvas Rendering & Download
  const generateCompositeCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const canvas = hiddenCanvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = currentTemplate.canvasWidth;
    canvas.height = currentTemplate.canvasHeight;

    // 1. Draw Background (Solid, Gradient, or Image)
    if (currentTheme.type === "image" && currentTheme.imageUrl) {
      try {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          bgImg.onload = () => resolve();
          bgImg.onerror = () => reject();
          bgImg.src = currentTheme.imageUrl!;
        });
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      } catch {
        // Fallback color if image fails
        ctx.fillStyle = currentTheme.background || "#18181b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else if (currentTheme.type === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      if (currentTheme.id === "cyber-neon") {
        grad.addColorStop(0, "#090a0f");
        grad.addColorStop(0.5, "#1e1035");
        grad.addColorStop(1, "#032030");
      } else if (currentTheme.id === "sunset-glow") {
        grad.addColorStop(0, "#ff9a9e");
        grad.addColorStop(0.5, "#fecfef");
        grad.addColorStop(1, "#feada6");
      } else {
        grad.addColorStop(0, "#a1c4fd");
        grad.addColorStop(0.5, "#c2e9fb");
        grad.addColorStop(1, "#fbc2eb");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = currentTheme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Draw Photo Slots
    for (let i = 0; i < currentTemplate.slots.length; i++) {
      const slot = currentTemplate.slots[i];
      const photoSrc = capturedPhotos[i];

      // Draw rounded slot container background
      const radius = slot.borderRadius || 12;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(slot.x, slot.y, slot.width, slot.height, radius);
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fill();
      ctx.clip();

      if (photoSrc) {
        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = photoSrc;
        });

        // Cover fill aspect ratio
        const imgAspect = img.width / img.height;
        const slotAspect = slot.width / slot.height;
        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (imgAspect > slotAspect) {
          sWidth = img.height * slotAspect;
          sx = (img.width - sWidth) / 2;
        } else {
          sHeight = img.width / slotAspect;
          sy = (img.height - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, slot.x, slot.y, slot.width, slot.height);
      } else {
        // Placeholder text
        ctx.fillStyle = "rgba(150, 150, 150, 0.3)";
        ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
        ctx.fillStyle = currentTheme.textColor;
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`Pose ${i + 1}`, slot.x + slot.width / 2, slot.y + slot.height / 2);
      }
      ctx.restore();
    }

    // 3. Draw Placed Stickers
    for (const item of placedStickers) {
      const x = (item.xPercent / 100) * canvas.width;
      const y = (item.yPercent / 100) * canvas.height;

      ctx.save();
      if (item.sticker.type === "rpl") {
        // Draw cute pill badge
        ctx.font = "bold 24px sans-serif";
        const textMetrics = ctx.measureText(item.sticker.content);
        const paddingX = 18;
        const pillW = textMetrics.width + paddingX * 2;
        const pillH = 46;

        ctx.fillStyle = "#4f46e5";
        ctx.beginPath();
        ctx.roundRect(x - pillW / 2, y - pillH / 2, pillW, pillH, 23);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.sticker.content, x, y);
      } else {
        // Draw emoji
        ctx.font = "52px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.sticker.content, x, y);
      }
      ctx.restore();
    }

    // 4. Draw Footer Title & Subtitle Branding
    const footer = currentTemplate.footerArea;
    ctx.save();
    ctx.fillStyle = currentTheme.textColor;
    ctx.textAlign = "center";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(customFooterTitle, footer.x + footer.width / 2, footer.y + 45);

    if (customFooterSub) {
      ctx.font = "italic 20px sans-serif";
      ctx.globalAlpha = 0.85;
      ctx.fillText(customFooterSub, footer.x + footer.width / 2, footer.y + 80);
      ctx.globalAlpha = 1.0;
    }

    // 5. Draw Date & Time Stamp
    if (showTimestamp) {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      ctx.font = "600 16px monospace";
      ctx.globalAlpha = 0.75;
      ctx.fillText(
        `${dateStr} • ${timeStr} WIB`,
        footer.x + footer.width / 2,
        footer.y + 115
      );
    }
    ctx.restore();

    return canvas;
  };

  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = await generateCompositeCanvas();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `10RPL-Photobooth-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      const canvas = await generateCompositeCanvas();
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } catch (err) {
      console.warn("Copy to clipboard error:", err);
    }
  };

  const isCompleted =
    capturedPhotos.length === currentTemplate.totalSlots &&
    capturedPhotos.every(Boolean);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Hidden offscreen canvas for 300 DPI high-res rendering */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition cursor-pointer border border-zinc-200 dark:border-zinc-700/60 shadow-xs"
          >
            <Layout className="w-4 h-4 text-accent-500" />
            <span>Ganti Template & Bingkai</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
              isMirrored
                ? "bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300 border-accent-200 dark:border-accent-800"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
            }`}
          >
            Mirror: {isMirrored ? "ON" : "OFF"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {capturedPhotos.filter(Boolean).length} / {currentTemplate.totalSlots} Pose Terambil
          </span>
          {capturedPhotos.length > 0 && (
            <button
              type="button"
              onClick={handleResetPhotos}
              className="ml-2 flex items-center gap-1 text-red-500 hover:text-red-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Camera Viewfinder & Capture Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <CameraViewfinder
              ref={cameraRef}
              cssFilter={activeFilter.cssFilter}
              activeFilterId={activeFilter.id}
              isMirrored={isMirrored}
              aspectRatioClass="aspect-4/3"
              overlayContent={
                countdown !== null && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="w-28 h-28 rounded-full border-4 border-accent-400 flex items-center justify-center animate-bounce">
                      <span className="text-6xl font-black text-white drop-shadow-md">
                        {countdown}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white mt-3 uppercase tracking-wider">
                      Pose ke-{currentSlotIndex + 1} dari {currentTemplate.totalSlots}
                    </span>
                  </div>
                )
              }
            />
          </div>

          {/* Filter Bar */}
          <div>
            <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-1">
              Pilih Efek / Filter
            </div>
            <FilterSelector
              activeFilterId={activeFilter.id}
              onSelectFilter={setActiveFilter}
            />
          </div>

          {/* Big Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              disabled={isSequencing || isCompleted}
              onClick={startAutoCaptureSequence}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-accent-600/30 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>
                {isSequencing
                  ? "Sedang Mengambil Foto..."
                  : isCompleted
                  ? "Semua Pose Lengkap!"
                  : `Mulai Pemotretan Otomatis (${currentTemplate.totalSlots} Pose)`}
              </span>
            </button>

            <button
              type="button"
              disabled={isSequencing}
              onClick={takeSingleSnapshot}
              className="py-3.5 px-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition border border-zinc-200 dark:border-zinc-700 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil 1 Foto Manual</span>
            </button>
          </div>

          {/* Stickers & Customization Options */}
          <StickerPicker
            placedStickers={placedStickers}
            onAddSticker={handleAddSticker}
            onRemoveSticker={handleRemoveSticker}
            onClearStickers={handleClearStickers}
          />
        </div>

        {/* RIGHT: Live Photobooth Strip Preview & Output Customizer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-500" />
                <span>Pratinjau Hasil Photobooth</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950 text-accent-600 dark:text-accent-400">
                {currentTemplate.name}
              </span>
            </div>

            {/* Visual Frame Strip Container */}
            <div className="flex justify-center p-3 rounded-2xl bg-zinc-100/60 dark:bg-zinc-950/60 border border-zinc-200/60 dark:border-zinc-800">
              <div
                className="w-full max-w-[280px] p-3 rounded-2xl shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
                style={{
                  background:
                    currentTheme.type === "image" && currentTheme.imageUrl
                      ? `url("${currentTheme.imageUrl}") center/cover no-repeat`
                      : currentTheme.background,
                  color: currentTheme.textColor,
                  minHeight: currentTemplate.id === "4-cut-strip" ? "420px" : "340px",
                }}
              >
                {/* Photo Slots Layout Preview */}
                <div
                  className={`grid gap-2 mb-3 ${
                    currentTemplate.id === "2x2-grid"
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  }`}
                >
                  {Array.from({ length: currentTemplate.totalSlots }).map(
                    (_, idx) => {
                      const photo = capturedPhotos[idx];
                      const isCurrent = currentSlotIndex === idx && isSequencing;
                      return (
                        <div
                          key={idx}
                          onClick={() => setCurrentSlotIndex(idx)}
                          className={`relative rounded-xl overflow-hidden bg-black/10 dark:bg-white/10 aspect-4/3 flex items-center justify-center border transition-all cursor-pointer ${
                            isCurrent
                              ? "ring-2 ring-accent-400 scale-102"
                              : "border-black/5 dark:border-white/10 hover:opacity-90"
                          }`}
                        >
                          {photo ? (
                            <img
                              src={photo}
                              alt={`Pose ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <Camera className="w-5 h-5 mx-auto opacity-40 mb-1" />
                              <span className="text-[10px] font-bold opacity-60">
                                Pose {idx + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Placed Stickers Preview */}
                {placedStickers.map((item) => (
                  <div
                    key={item.uid}
                    style={{
                      position: "absolute",
                      left: `${item.xPercent}%`,
                      top: `${item.yPercent}%`,
                      transform: "translate(-50%, -50%)",
                      pointerEvents: "none",
                    }}
                    className="select-none drop-shadow-md text-xl"
                  >
                    {item.sticker.type === "rpl" ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-bold border border-white">
                        {item.sticker.content}
                      </span>
                    ) : (
                      item.sticker.content
                    )}
                  </div>
                ))}

                {/* Strip Footer Branding */}
                <div className="text-center pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="font-black text-xs tracking-wider leading-tight">
                    {customFooterTitle}
                  </div>
                  {customFooterSub && (
                    <div className="text-[10px] italic opacity-85 mt-0.5 font-medium">
                      {customFooterSub}
                    </div>
                  )}
                  {showTimestamp && (
                    <div className="text-[9px] opacity-70 font-mono mt-1">
                      10 RPL 2026 • JAKARTA
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text Customization Inputs */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                Teks & Watermark Strip
              </div>
              <input
                type="text"
                value={customFooterTitle}
                onChange={(e) => setCustomFooterTitle(e.target.value)}
                placeholder="Judul footer (cth: 10 RPL SMK 17)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-accent-500 font-medium"
              />
              <input
                type="text"
                value={customFooterSub}
                onChange={(e) => setCustomFooterSub(e.target.value)}
                placeholder="Slogan / Catatan kenangan (opsional)"
                className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-accent-500 font-medium"
              />
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showTimestamp}
                  onChange={(e) => setShowTimestamp(e.target.checked)}
                  className="rounded-sm text-accent-600 focus:ring-accent-500"
                />
                <span>Tampilkan Tanggal & Jam Realtime</span>
              </label>
            </div>

            {/* Export & Download Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={capturedPhotos.length === 0 || isExporting}
                onClick={handleDownloadPNG}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? "Membuat File PNG..." : "Unduh Foto Strip (PNG Resolusi Tinggi)"}
                </span>
              </button>

              <button
                type="button"
                disabled={capturedPhotos.length === 0}
                onClick={handleCopyImage}
                className="w-full py-2.5 px-4 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer border border-zinc-200 dark:border-zinc-700/60"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Gambar ke Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template & Frame Modal */}
      <TemplatePickerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentTemplate={currentTemplate}
        onSelectTemplate={(tmpl) => {
          setCurrentTemplate(tmpl);
          setIsTemplateModalOpen(false);
        }}
        currentTheme={currentTheme}
        onSelectTheme={(th) => {
          setCurrentTheme(th);
        }}
      />
    </div>
  );
}
