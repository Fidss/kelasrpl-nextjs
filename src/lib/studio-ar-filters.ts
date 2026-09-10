// AR Face Tracking Engine using Google MediaPipe Face Landmarker
// Runs 100% client-side in the browser via WebAssembly & GPU
// Powers interactive TikTok-style filters: Cat, Bunny, Beauty Whitening, Crown, Sunglasses, Devil Horns, Sakura, etc.

export interface ArFilterDefinition {
  id: string;
  name: string;
  badge: string;
  category: "ar-face" | "beauty" | "retro" | "aesthetic";
  description: string;
  cssFilter?: string;
}

export const EXTENDED_STUDIO_FILTERS: ArFilterDefinition[] = [
  {
    id: "normal",
    name: "Original",
    badge: "✨",
    category: "aesthetic",
    description: "Tanpa filter, warna alami kamera",
    cssFilter: "none",
  },
  {
    id: "beauty-whitening",
    name: "Beauty Putih Glowing",
    badge: "🤍",
    category: "beauty",
    description: "Memutihkan kulit wajah, menghaluskan pori-pori, dan rona glowing ala idol",
    cssFilter: "brightness(1.18) contrast(0.92) saturate(1.22)",
  },
  {
    id: "cute-cat",
    name: "Kucing Imut",
    badge: "🐱",
    category: "ar-face",
    description: "Telinga kucing berbulu, hidung pink, kumis, dan blush pipi merona",
    cssFilter: "brightness(1.08) saturate(1.15)",
  },
  {
    id: "cute-bunny",
    name: "Kelinci Gemas",
    badge: "🐰",
    category: "ar-face",
    description: "Telinga kelinci panjang goyang, hidung imut, dan rona merah pipi",
    cssFilter: "brightness(1.1) saturate(1.18)",
  },
  {
    id: "thug-glasses",
    name: "Kacamata Hitam Cool",
    badge: "🕶️",
    category: "ar-face",
    description: "Kacamata hitam keren yang otomatis menempel dan berotasi di mata",
    cssFilter: "contrast(1.15) saturate(1.1)",
  },
  {
    id: "golden-crown",
    name: "Mahkota Emas Angel",
    badge: "👑",
    category: "ar-face",
    description: "Mahkota putri/pangeran emas bercahaya dan taburan kilau bintang",
    cssFilter: "brightness(1.08) contrast(1.05)",
  },
  {
    id: "devil-horns",
    name: "Tanduk Neon Devil",
    badge: "😈",
    category: "ar-face",
    description: "Tanduk iblis neon merah menyala di dahi dengan aura gelap misterius",
    cssFilter: "contrast(1.25) saturate(1.25)",
  },
  {
    id: "sakura-blossom",
    name: "Bunga Sakura Anime",
    badge: "🌸",
    category: "ar-face",
    description: "Mahkota bunga sakura di kepala dengan kelopak bunga berjatuhan",
    cssFilter: "brightness(1.12) saturate(1.2) sepia(0.08)",
  },
  {
    id: "heart-eyes",
    name: "Love & Heart Eyes",
    badge: "💖",
    category: "ar-face",
    description: "Hati berdenyut cinta di kedua pipi dan mata bercahaya kasih",
    cssFilter: "brightness(1.1) saturate(1.3)",
  },
  {
    id: "soft-glow",
    name: "Korean Pastel Glow",
    badge: "🎀",
    category: "beauty",
    description: "Pewarnaan pastel manis dan lembut khas filter TikTok Korea",
    cssFilter: "brightness(1.12) contrast(0.95) saturate(1.18)",
  },
  {
    id: "retro-vhs",
    name: "Retro 90s Camcorder",
    badge: "📼",
    category: "retro",
    description: "Efek kamera video analog 90-an lengkap dengan timestamp REC",
    cssFilter: "contrast(1.2) saturate(1.3) brightness(0.95)",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon Matrix",
    badge: "⚡",
    category: "retro",
    description: "Nuansa futuristik neon biru-cyan khas programmer anak RPL",
    cssFilter: "contrast(1.35) saturate(1.6) hue-rotate(190deg)",
  },
  {
    id: "warm-sunset",
    name: "Golden Hour Senja",
    badge: "🌅",
    category: "aesthetic",
    description: "Sinar matahari terbenam hangat yang menawan",
    cssFilter: "sepia(0.28) saturate(1.4) brightness(1.05) contrast(1.05)",
  },
  {
    id: "bw-noir",
    name: "Noir Editorial",
    badge: "🖤",
    category: "aesthetic",
    description: "Hitam putih artistik kontras tinggi gaya majalah fashion",
    cssFilter: "grayscale(1) contrast(1.4) brightness(0.95)",
  },
];

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

// Filter benign Emscripten / TFLite C++ INFO logs from triggering Next.js dev overlay
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = function (...args: any[]) {
    const first = typeof args[0] === "string" ? args[0] : "";
    if (
      first.includes("INFO: Created TensorFlow Lite") ||
      first.includes("XNNPACK delegate") ||
      first.includes("Created TensorFlow Lite")
    ) {
      console.info(...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

let faceLandmarkerInstance: any = null;
let isLoadingLandmarker = false;

/**
 * Initialize Google MediaPipe FaceLandmarker dynamically (Client-Side only)
 */
export async function getFaceLandmarker(): Promise<any> {
  if (typeof window === "undefined") return null;
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (isLoadingLandmarker) {
    // Wait for in-flight initialization
    while (isLoadingLandmarker) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return faceLandmarkerInstance;
  }

  isLoadingLandmarker = true;
  try {
    const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
    );

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      runningMode: "VIDEO",
      numFaces: 1,
    });
    return faceLandmarkerInstance;
  } catch (err) {
    console.warn("MediaPipe FaceLandmarker GPU failed, attempting CPU fallback:", err);
    try {
      const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      );
      faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "CPU",
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1,
      });
      return faceLandmarkerInstance;
    } catch (cpuErr) {
      console.error("Failed to load FaceLandmarker on CPU:", cpuErr);
      return null;
    }
  } finally {
    isLoadingLandmarker = false;
  }
}

/**
 * Render AR Filter overlays onto the canvas context based on face landmarks
 */
export function drawArFilter(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  filterId: string,
  width: number,
  height: number,
  timeMs: number
) {
  if (!landmarks || landmarks.length < 400) return;

  // Key Face Landmarks:
  // 10: Top of forehead center
  // 4: Tip of nose
  // 1: Center of nose
  // 234: Left cheek outer
  // 454: Right cheek outer
  // 109: Left forehead upper
  // 338: Right forehead upper
  // 33: Left eye inner corner
  // 263: Right eye inner corner
  // 13: Upper lip center
  // 14: Lower lip center

  const p10 = { x: landmarks[10].x * width, y: landmarks[10].y * height };
  const p4 = { x: landmarks[4].x * width, y: landmarks[4].y * height };
  const p109 = { x: landmarks[109].x * width, y: landmarks[109].y * height };
  const p338 = { x: landmarks[338].x * width, y: landmarks[338].y * height };
  const p234 = { x: landmarks[234].x * width, y: landmarks[234].y * height };
  const p454 = { x: landmarks[454].x * width, y: landmarks[454].y * height };
  const p33 = { x: landmarks[33].x * width, y: landmarks[33].y * height };
  const p263 = { x: landmarks[263].x * width, y: landmarks[263].y * height };

  // Face Width & Head Angle
  const faceWidth = Math.hypot(p454.x - p234.x, p454.y - p234.y);
  const headAngle = Math.atan2(p263.y - p33.y, p263.x - p33.x);

  ctx.save();

  // 1. 🐱 FILTER KUCING IMUT (Cat Ears, Nose, Whiskers, Blush)
  if (filterId === "cute-cat") {
    // A. Soft Pink Cheeks (Blush)
    const cheekRadius = faceWidth * 0.14;
    const blushLeftGrad = ctx.createRadialGradient(
      p234.x + faceWidth * 0.15,
      p4.y + 10,
      0,
      p234.x + faceWidth * 0.15,
      p4.y + 10,
      cheekRadius
    );
    blushLeftGrad.addColorStop(0, "rgba(255, 105, 180, 0.45)");
    blushLeftGrad.addColorStop(1, "rgba(255, 105, 180, 0)");
    ctx.fillStyle = blushLeftGrad;
    ctx.beginPath();
    ctx.arc(p234.x + faceWidth * 0.15, p4.y + 10, cheekRadius, 0, Math.PI * 2);
    ctx.fill();

    const blushRightGrad = ctx.createRadialGradient(
      p454.x - faceWidth * 0.15,
      p4.y + 10,
      0,
      p454.x - faceWidth * 0.15,
      p4.y + 10,
      cheekRadius
    );
    blushRightGrad.addColorStop(0, "rgba(255, 105, 180, 0.45)");
    blushRightGrad.addColorStop(1, "rgba(255, 105, 180, 0)");
    ctx.fillStyle = blushRightGrad;
    ctx.beginPath();
    ctx.arc(p454.x - faceWidth * 0.15, p4.y + 10, cheekRadius, 0, Math.PI * 2);
    ctx.fill();

    // B. Cat Ears
    const earSize = faceWidth * 0.42;
    // Left Ear
    ctx.save();
    ctx.translate(p109.x, p109.y - earSize * 0.2);
    ctx.rotate(headAngle - 0.2);
    // Outer Ear
    ctx.beginPath();
    ctx.moveTo(-earSize * 0.45, 0);
    ctx.lineTo(-earSize * 0.35, -earSize);
    ctx.lineTo(earSize * 0.15, -earSize * 0.1);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = "#fbcfe8";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner Pink Ear
    ctx.beginPath();
    ctx.moveTo(-earSize * 0.35, -earSize * 0.15);
    ctx.lineTo(-earSize * 0.3, -earSize * 0.85);
    ctx.lineTo(earSize * 0.05, -earSize * 0.2);
    ctx.closePath();
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(p338.x, p338.y - earSize * 0.2);
    ctx.rotate(headAngle + 0.2);
    // Outer Ear
    ctx.beginPath();
    ctx.moveTo(-earSize * 0.15, -earSize * 0.1);
    ctx.lineTo(earSize * 0.35, -earSize);
    ctx.lineTo(earSize * 0.45, 0);
    ctx.closePath();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = "#fbcfe8";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner Pink Ear
    ctx.beginPath();
    ctx.moveTo(-earSize * 0.05, -earSize * 0.2);
    ctx.lineTo(earSize * 0.3, -earSize * 0.85);
    ctx.lineTo(earSize * 0.35, -earSize * 0.15);
    ctx.closePath();
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.restore();

    // C. Cute Pink Cat Nose
    const noseW = faceWidth * 0.09;
    ctx.save();
    ctx.translate(p4.x, p4.y);
    ctx.rotate(headAngle);
    ctx.beginPath();
    ctx.moveTo(-noseW / 2, -noseW / 3);
    ctx.lineTo(noseW / 2, -noseW / 3);
    ctx.lineTo(0, noseW / 2);
    ctx.closePath();
    ctx.fillStyle = "#ec4899";
    ctx.shadowColor = "#f472b6";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();

    // D. Cat Whiskers
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const whiskerLen = faceWidth * 0.35;
    // Left Whiskers
    ctx.beginPath();
    ctx.moveTo(p4.x - faceWidth * 0.22, p4.y - 4);
    ctx.lineTo(p4.x - faceWidth * 0.22 - whiskerLen, p4.y - 18);
    ctx.moveTo(p4.x - faceWidth * 0.24, p4.y + 6);
    ctx.lineTo(p4.x - faceWidth * 0.24 - whiskerLen, p4.y + 6);
    ctx.moveTo(p4.x - faceWidth * 0.22, p4.y + 16);
    ctx.lineTo(p4.x - faceWidth * 0.22 - whiskerLen, p4.y + 28);
    // Right Whiskers
    ctx.moveTo(p4.x + faceWidth * 0.22, p4.y - 4);
    ctx.lineTo(p4.x + faceWidth * 0.22 + whiskerLen, p4.y - 18);
    ctx.moveTo(p4.x + faceWidth * 0.24, p4.y + 6);
    ctx.lineTo(p4.x + faceWidth * 0.24 + whiskerLen, p4.y + 6);
    ctx.moveTo(p4.x + faceWidth * 0.22, p4.y + 16);
    ctx.lineTo(p4.x + faceWidth * 0.22 + whiskerLen, p4.y + 28);
    ctx.stroke();
  }

  // 2. 🐰 FILTER KELINCI GEMAS (Bunny Ears & Nose)
  else if (filterId === "cute-bunny") {
    const earW = faceWidth * 0.22;
    const earH = faceWidth * 0.75;

    // Wobble animation
    const earWobble = Math.sin(timeMs / 250) * 0.08;

    // Left Bunny Ear
    ctx.save();
    ctx.translate(p109.x, p109.y - 15);
    ctx.rotate(headAngle - 0.15 + earWobble);
    ctx.beginPath();
    ctx.ellipse(-earW * 0.4, -earH * 0.6, earW * 0.5, earH * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.fill();
    ctx.strokeStyle = "#fed7aa";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner Pink
    ctx.beginPath();
    ctx.ellipse(-earW * 0.4, -earH * 0.6, earW * 0.25, earH * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.restore();

    // Right Bunny Ear
    ctx.save();
    ctx.translate(p338.x, p338.y - 15);
    ctx.rotate(headAngle + 0.15 - earWobble);
    ctx.beginPath();
    ctx.ellipse(earW * 0.4, -earH * 0.6, earW * 0.5, earH * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.fill();
    ctx.strokeStyle = "#fed7aa";
    ctx.lineWidth = 3;
    ctx.stroke();
    // Inner Pink
    ctx.beginPath();
    ctx.ellipse(earW * 0.4, -earH * 0.6, earW * 0.25, earH * 0.45, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f472b6";
    ctx.fill();
    ctx.restore();

    // Cute Little Bunny Nose & Whiskers
    ctx.save();
    ctx.translate(p4.x, p4.y);
    ctx.beginPath();
    ctx.arc(0, 0, faceWidth * 0.045, 0, Math.PI * 2);
    ctx.fillStyle = "#fb7185";
    ctx.fill();
    ctx.restore();
  }

  // 3. 🕶️ FILTER KACAMATA HITAM COOL / THUG LIFE
  else if (filterId === "thug-glasses") {
    const glassesW = faceWidth * 0.88;
    const glassesH = faceWidth * 0.3;
    const centerX = (p33.x + p263.x) / 2;
    const centerY = (p33.y + p263.y) / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(headAngle);

    // Frame
    ctx.fillStyle = "#09090b";
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12;

    // Left Lens
    ctx.beginPath();
    ctx.roundRect(-glassesW * 0.48, -glassesH * 0.4, glassesW * 0.42, glassesH * 0.8, 10);
    ctx.fill();
    ctx.stroke();

    // Right Lens
    ctx.beginPath();
    ctx.roundRect(glassesW * 0.06, -glassesH * 0.4, glassesW * 0.42, glassesH * 0.8, 10);
    ctx.fill();
    ctx.stroke();

    // Center Bridge
    ctx.beginPath();
    ctx.moveTo(-glassesW * 0.06, -glassesH * 0.1);
    ctx.lineTo(glassesW * 0.06, -glassesH * 0.1);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#09090b";
    ctx.stroke();

    // Lens Glare Highlights
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-glassesW * 0.42, -glassesH * 0.25);
    ctx.lineTo(-glassesW * 0.18, glassesH * 0.25);
    ctx.moveTo(glassesW * 0.12, -glassesH * 0.25);
    ctx.lineTo(glassesW * 0.36, glassesH * 0.25);
    ctx.stroke();

    ctx.restore();
  }

  // 4. 👑 FILTER MAHKOTA EMAS ANGEL
  else if (filterId === "golden-crown") {
    const crownW = faceWidth * 0.7;
    const crownH = faceWidth * 0.38;

    // Subtle floating hover
    const floatY = Math.sin(timeMs / 300) * 8;

    ctx.save();
    ctx.translate(p10.x, p10.y - crownH * 0.7 + floatY);
    ctx.rotate(headAngle);

    // Golden Halo / Aura
    const haloGrad = ctx.createRadialGradient(0, -crownH * 0.2, 5, 0, -crownH * 0.2, crownW * 0.65);
    haloGrad.addColorStop(0, "rgba(251, 191, 36, 0.45)");
    haloGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, -crownH * 0.2, crownW * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Golden Crown Body
    ctx.beginPath();
    ctx.moveTo(-crownW / 2, crownH * 0.3);
    ctx.lineTo(-crownW * 0.45, -crownH * 0.45); // Left peak
    ctx.lineTo(-crownW * 0.2, -crownH * 0.1);
    ctx.lineTo(0, -crownH * 0.75); // Center peak
    ctx.lineTo(crownW * 0.2, -crownH * 0.1);
    ctx.lineTo(crownW * 0.45, -crownH * 0.45); // Right peak
    ctx.lineTo(crownW / 2, crownH * 0.3);
    ctx.closePath();

    const goldGrad = ctx.createLinearGradient(0, -crownH, 0, crownH);
    goldGrad.addColorStop(0, "#fde047");
    goldGrad.addColorStop(0.5, "#f59e0b");
    goldGrad.addColorStop(1, "#b45309");
    ctx.fillStyle = goldGrad;
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.strokeStyle = "#fffbeb";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ruby Jewels on peaks
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(0, -crownH * 0.75, 5, 0, Math.PI * 2);
    ctx.arc(-crownW * 0.45, -crownH * 0.45, 4, 0, Math.PI * 2);
    ctx.arc(crownW * 0.45, -crownH * 0.45, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. 😈 FILTER TANDUK NEON DEVIL
  else if (filterId === "devil-horns") {
    const hornH = faceWidth * 0.35;

    ctx.save();
    // Left Horn
    ctx.save();
    ctx.translate(p109.x - faceWidth * 0.08, p109.y - 10);
    ctx.rotate(headAngle - 0.25);
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.quadraticCurveTo(-25, -hornH * 0.7, -10, -hornH);
    ctx.quadraticCurveTo(5, -hornH * 0.6, 12, 0);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#dc2626";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Right Horn
    ctx.save();
    ctx.translate(p338.x + faceWidth * 0.08, p338.y - 10);
    ctx.rotate(headAngle + 0.25);
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-5, -hornH * 0.6, 10, -hornH);
    ctx.quadraticCurveTo(25, -hornH * 0.7, 15, 0);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.shadowColor = "#dc2626";
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // 6. 🌸 FILTER BUNGA SAKURA
  else if (filterId === "sakura-blossom") {
    const crownRadius = faceWidth * 0.48;
    ctx.save();
    ctx.translate(p10.x, p10.y);
    ctx.rotate(headAngle);

    // Draw 5 Sakura blossoms across forehead
    const blossomOffsets = [-crownRadius * 0.7, -crownRadius * 0.35, 0, crownRadius * 0.35, crownRadius * 0.7];
    blossomOffsets.forEach((offsetX, idx) => {
      ctx.save();
      ctx.translate(offsetX, -Math.abs(offsetX * 0.3) - 15);
      const scale = idx === 2 ? 1.2 : 0.95;
      ctx.scale(scale, scale);

      // 5 Petals
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.beginPath();
        ctx.ellipse(0, -14, 7, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#fbcfe8";
        ctx.fill();
        ctx.restore();
      }
      // Center
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#f43f5e";
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  // 7. 💖 FILTER HEART EYES & BLUSH
  else if (filterId === "heart-eyes") {
    const heartSize = faceWidth * 0.12;
    const pulse = 1 + Math.sin(timeMs / 180) * 0.12;

    const drawHeart = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.moveTo(0, heartSize * 0.3);
      ctx.bezierCurveTo(-heartSize * 0.6, -heartSize * 0.3, -heartSize * 0.6, -heartSize * 0.7, 0, -heartSize * 0.4);
      ctx.bezierCurveTo(heartSize * 0.6, -heartSize * 0.7, heartSize * 0.6, -heartSize * 0.3, 0, heartSize * 0.3);
      ctx.fillStyle = "#ec4899";
      ctx.shadowColor = "#f472b6";
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    };

    drawHeart(p234.x + faceWidth * 0.15, p4.y + 8);
    drawHeart(p454.x - faceWidth * 0.15, p4.y + 8);
  }

  ctx.restore();
}
