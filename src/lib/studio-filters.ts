// Visual & AR filters for Photobooth & TikTok Video Studio
// Compatible with CSS `filter`, HTML5 Canvas 2D, and Google MediaPipe AR face tracking

export interface StudioFilter {
  id: string;
  name: string;
  cssFilter: string;
  badge: string;
  description: string;
  category: "ar-face" | "beauty" | "retro" | "color" | "aesthetic";
  isAr?: boolean;
}

export const STUDIO_FILTERS: StudioFilter[] = [
  {
    id: "normal",
    name: "Original",
    cssFilter: "none",
    badge: "✨",
    description: "Warna alami kamera tanpa filter",
    category: "color",
  },
  {
    id: "beauty-whitening",
    name: "Beauty Putih Glowing",
    cssFilter: "brightness(1.18) contrast(0.92) saturate(1.22)",
    badge: "🤍",
    description: "Memutihkan kulit wajah, menghaluskan pori-pori, dan rona glowing merona ala idol",
    category: "beauty",
  },
  {
    id: "cute-cat",
    name: "Kucing Imut",
    cssFilter: "brightness(1.08) saturate(1.15)",
    badge: "🐱",
    description: "Filter AR: Telinga kucing berbulu, hidung pink, kumis, dan blush pipi merona",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "cute-bunny",
    name: "Kelinci Gemas",
    cssFilter: "brightness(1.1) saturate(1.18)",
    badge: "🐰",
    description: "Filter AR: Telinga kelinci panjang goyang, hidung imut, dan rona merah pipi",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "thug-glasses",
    name: "Kacamata Hitam Cool",
    cssFilter: "contrast(1.15) saturate(1.1)",
    badge: "🕶️",
    description: "Filter AR: Kacamata hitam keren yang otomatis menempel dan berotasi di mata",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "golden-crown",
    name: "Mahkota Emas Angel",
    cssFilter: "brightness(1.08) contrast(1.05)",
    badge: "👑",
    description: "Filter AR: Mahkota emas berkilau dan aura keemasan melayang di atas kepala",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "devil-horns",
    name: "Tanduk Neon Devil",
    cssFilter: "contrast(1.25) saturate(1.25)",
    badge: "😈",
    description: "Filter AR: Tanduk iblis merah neon menyala di dahi dengan aura misterius",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "sakura-blossom",
    name: "Bunga Sakura Anime",
    cssFilter: "brightness(1.12) saturate(1.2) sepia(0.08)",
    badge: "🌸",
    description: "Filter AR: Mahkota bunga sakura di kepala dengan kelopak bunga berjatuhan",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "heart-eyes",
    name: "Love & Heart Eyes",
    cssFilter: "brightness(1.1) saturate(1.3)",
    badge: "💖",
    description: "Filter AR: Hati berdenyut cinta di kedua pipi dan mata penuh kasih",
    category: "ar-face",
    isAr: true,
  },
  {
    id: "soft-glow",
    name: "Korean Pastel Glow",
    cssFilter: "brightness(1.12) contrast(0.95) saturate(1.18)",
    badge: "🎀",
    description: "Wajah lebih cerah, halus, dan bersinar lembut ala Korean Photobooth",
    category: "beauty",
  },
  {
    id: "vintage-90s",
    name: "Vintage Film 90s",
    cssFilter: "sepia(0.32) contrast(1.15) saturate(0.85) brightness(1.02)",
    badge: "🎞️",
    description: "Sentuhan roll film analog 90-an dengan nuansa hangat",
    category: "retro",
  },
  {
    id: "retro-vhs",
    name: "Retro VHS Camcorder",
    cssFilter: "contrast(1.2) saturate(1.3) brightness(0.95)",
    badge: "📼",
    description: "Efek kamera video analog era 90-an dengan timestamp REC",
    category: "retro",
  },
  {
    id: "cyberpunk",
    name: "Cyber Neon RPL",
    cssFilter: "contrast(1.35) saturate(1.6) hue-rotate(190deg)",
    badge: "⚡",
    description: "Warna neon futuristik bernuansa cyberpunk khas anak IT / RPL",
    category: "retro",
  },
  {
    id: "warm-sunset",
    name: "Golden Hour Senja",
    cssFilter: "sepia(0.28) saturate(1.4) brightness(1.05) contrast(1.05)",
    badge: "🌅",
    description: "Sinar keemasan senja hangat yang menawan",
    category: "aesthetic",
  },
  {
    id: "bw-noir",
    name: "Noir Classic",
    cssFilter: "grayscale(1) contrast(1.4) brightness(0.95)",
    badge: "🖤",
    description: "Hitam putih artistik kontras tinggi gaya editorial",
    category: "color",
  },
];

export function getFilterById(id: string): StudioFilter {
  return STUDIO_FILTERS.find((f) => f.id === id) || STUDIO_FILTERS[0];
}
