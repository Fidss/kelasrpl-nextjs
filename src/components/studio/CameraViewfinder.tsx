"use client";

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { SwitchCamera, AlertCircle, RefreshCw } from "lucide-react";
import { playShutterSound } from "@/lib/studio-audio";
import { getFaceLandmarker, drawArFilter } from "@/lib/studio-ar-filters";
import { getFilterById } from "@/lib/studio-filters";

export interface CameraViewfinderRef {
  captureFrame: () => string | null;
  getVideoElement: () => HTMLVideoElement | null;
  getStream: () => MediaStream | null;
  getCompositeStream: () => MediaStream | null;
}

interface CameraViewfinderProps {
  cssFilter?: string;
  activeFilterId?: string;
  isMirrored?: boolean;
  aspectRatioClass?: string;
  onCameraReady?: (stream: MediaStream) => void;
  overlayContent?: React.ReactNode;
}

const CameraViewfinder = forwardRef<CameraViewfinderRef, CameraViewfinderProps>(
  (
    {
      cssFilter = "none",
      activeFilterId = "normal",
      isMirrored = true,
      aspectRatioClass = "aspect-4/3",
      onCameraReady,
      overlayContent,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const arCanvasRef = useRef<HTMLCanvasElement>(null);
    const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [isFlashActive, setIsFlashActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initialize camera stream
    const startCamera = async () => {
      setErrorMessage(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
        if (onCameraReady) {
          onCameraReady(stream);
        }
      } catch (err: unknown) {
        console.warn("Camera access error:", err);
        const error = err as { name?: string; message?: string };
        setHasPermission(false);
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setErrorMessage("Izin kamera ditolak. Mohon izinkan akses di browser Anda.");
        } else {
          setErrorMessage("Perangkat kamera tidak terdeteksi atau sedang dipakai aplikasi lain.");
        }
      }
    };

    useEffect(() => {
      startCamera();
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      };
    }, [facingMode]);

    // Flip camera front / back
    const toggleFacingMode = () => {
      setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    // Shutter flash animation & sound
    const triggerFlashAndShutter = () => {
      playShutterSound();
      setIsFlashActive(true);
      setTimeout(() => {
        setIsFlashActive(false);
      }, 250);
    };

    // Real-Time AR Face Tracking Loop (MediaPipe)
    useEffect(() => {
      let isMounted = true;
      const currentFilter = getFilterById(activeFilterId);
      const isArActive = currentFilter.isAr;

      const runArDetectionLoop = async () => {
        const video = videoRef.current;
        const canvas = arCanvasRef.current;
        if (!video || !canvas || !isArActive) {
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
          }
          return;
        }

        const landmarker = await getFaceLandmarker();
        if (!landmarker || !isMounted) return;

        let lastVideoTime = -1;
        let lastTimestamp = 0;

        const loop = () => {
          if (!isMounted) return;

          if (video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const now = performance.now();
            // In MediaPipe VIDEO mode, timestamps must be strictly increasing and video frame must have updated
            if (video.currentTime !== lastVideoTime && now > lastTimestamp) {
              lastVideoTime = video.currentTime;
              lastTimestamp = now;

              const ctx = canvas.getContext("2d");
              if (ctx) {
                try {
                  const result = landmarker.detectForVideo(video, now);
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  if (result && result.faceLandmarks && result.faceLandmarks.length > 0) {
                    drawArFilter(ctx, result.faceLandmarks[0], activeFilterId, canvas.width, canvas.height, now);
                  }
                } catch {
                  // Silently ignore transient frame drops
                }
              }
            }
          }

          if (isMounted) {
            animationFrameIdRef.current = requestAnimationFrame(loop);
          }
        };

        animationFrameIdRef.current = requestAnimationFrame(loop);
      };

      if (isArActive) {
        runArDetectionLoop();
      } else {
        const canvas = arCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      return () => {
        isMounted = false;
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current);
        }
      };
    }, [activeFilterId]);

    // Composite stream generator for video recording with baked-in AR filters
    const getCompositeStream = useCallback((): MediaStream | null => {
      const video = videoRef.current;
      const arCanvas = arCanvasRef.current;
      const stream = streamRef.current;
      if (!video || !stream) return null;

      const currentFilter = getFilterById(activeFilterId);
      // If no AR filter is active and filter is normal, return direct camera stream
      if (!currentFilter.isAr && (!cssFilter || cssFilter === "none")) {
        return stream;
      }

      // Create composite canvas for recording stream
      if (!compositeCanvasRef.current) {
        compositeCanvasRef.current = document.createElement("canvas");
      }
      const compCanvas = compositeCanvasRef.current;
      compCanvas.width = video.videoWidth || 1280;
      compCanvas.height = video.videoHeight || 720;
      const ctx = compCanvas.getContext("2d");
      if (!ctx) return stream;

      let isRecordingActive = true;
      const renderComposite = () => {
        if (!isRecordingActive) return;

        ctx.save();
        if (isMirrored && facingMode === "user") {
          ctx.translate(compCanvas.width, 0);
          ctx.scale(-1, 1);
        }
        if (cssFilter && cssFilter !== "none") {
          ctx.filter = cssFilter;
        }
        ctx.drawImage(video, 0, 0, compCanvas.width, compCanvas.height);
        ctx.restore();

        // Draw AR overlay if active
        if (arCanvas && currentFilter.isAr) {
          ctx.save();
          if (isMirrored && facingMode === "user") {
            ctx.translate(compCanvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(arCanvas, 0, 0, compCanvas.width, compCanvas.height);
          ctx.restore();
        }

        requestAnimationFrame(renderComposite);
      };
      renderComposite();

      const canvasStream = compCanvas.captureStream(30);
      return canvasStream;
    }, [activeFilterId, cssFilter, isMirrored, facingMode]);

    // Imperative handle for parent component
    useImperativeHandle(ref, () => ({
      captureFrame: () => {
        const video = videoRef.current;
        const arCanvas = arCanvasRef.current;
        if (!video || video.readyState < 2) return null;

        triggerFlashAndShutter();

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.save();
        if (isMirrored && facingMode === "user") {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }

        if (cssFilter && cssFilter !== "none") {
          ctx.filter = cssFilter;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw AR filter onto photo snapshot if active
        const currentFilter = getFilterById(activeFilterId);
        if (arCanvas && currentFilter.isAr) {
          ctx.save();
          if (isMirrored && facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(arCanvas, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        return canvas.toDataURL("image/jpeg", 0.95);
      },
      getVideoElement: () => videoRef.current,
      getStream: () => streamRef.current,
      getCompositeStream,
    }));

    return (
      <div
        className={`relative w-full ${aspectRatioClass} bg-black rounded-3xl overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800 flex items-center justify-center select-none`}
      >
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isMirrored && facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
          style={{ filter: cssFilter }}
        />

        {/* Real-time AR Filter Canvas (Cat Ears, Whiskers, Glasses, Crown) */}
        <canvas
          ref={arCanvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none object-cover transition-transform duration-300 ${
            isMirrored && facingMode === "user" ? "scale-x-[-1]" : ""
          }`}
        />

        {/* Custom Overlays (Side controls, VHS timestamp, stickers) */}
        {overlayContent}

        {/* Shutter Flash Animation */}
        {isFlashActive && (
          <div className="absolute inset-0 bg-white pointer-events-none z-40 animate-out fade-out duration-300" />
        )}

        {/* Permission State */}
        {hasPermission === false && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/95 text-white">
            <AlertCircle className="w-12 h-12 text-amber-400 mb-3" />
            <h3 className="text-base font-bold mb-1">Akses Kamera Diperlukan</h3>
            <p className="text-xs text-zinc-400 max-w-xs mb-4">
              {errorMessage || "Mohon berikan izin kamera pada browser untuk menggunakan fitur Photobooth & Video Studio."}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi / Izinkan</span>
            </button>
          </div>
        )}

        {/* Flip Camera Button */}
        {hasPermission && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              title="Ganti Kamera Depan / Belakang"
              aria-label="Ganti Kamera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

CameraViewfinder.displayName = "CameraViewfinder";

export default CameraViewfinder;
