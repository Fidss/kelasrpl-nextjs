// Photobooth Template Layouts & Styles
// High-resolution canvas dimensions (300 DPI ready for download & print)

export interface PhotoboothTemplate {
  id: string;
  name: string;
  subtitle: string;
  totalSlots: number;
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string; // e.g. "1 / 3" or "4 / 5"
  icon: string;
  slots: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
  }>;
  headerArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  footerArea: {
    x: number;
    y: number;
    width: number;
    height: number;
    defaultText: string;
    subText?: string;
  };
}

export const PHOTOBOOTH_TEMPLATES: PhotoboothTemplate[] = [
  {
    id: "4-cut-strip",
    name: "Korean 4-Cut Strip",
    subtitle: "Gaya Life4Cuts / Haru Film vertikal klasik",
    totalSlots: 4,
    canvasWidth: 600,
    canvasHeight: 1800,
    aspectRatio: "1 / 3",
    icon: "🎞️",
    slots: [
      { x: 36, y: 50, width: 528, height: 370, borderRadius: 16 },
      { x: 36, y: 440, width: 528, height: 370, borderRadius: 16 },
      { x: 36, y: 830, width: 528, height: 370, borderRadius: 16 },
      { x: 36, y: 1220, width: 528, height: 370, borderRadius: 16 },
    ],
    footerArea: {
      x: 36,
      y: 1610,
      width: 528,
      height: 160,
      defaultText: "10 RPL • SMK NEGERI 17 JAKARTA",
      subText: "MEMORIES NEVER FADE",
    },
  },
  {
    id: "2x2-grid",
    name: "2x2 Postcard Grid",
    subtitle: "Format kartu pos 4 kotak modern",
    totalSlots: 4,
    canvasWidth: 1200,
    canvasHeight: 1500,
    aspectRatio: "4 / 5",
    icon: "🖼️",
    slots: [
      { x: 45, y: 50, width: 535, height: 620, borderRadius: 20 },
      { x: 620, y: 50, width: 535, height: 620, borderRadius: 20 },
      { x: 45, y: 700, width: 535, height: 620, borderRadius: 20 },
      { x: 620, y: 700, width: 535, height: 620, borderRadius: 20 },
    ],
    footerArea: {
      x: 45,
      y: 1340,
      width: 1110,
      height: 120,
      defaultText: "10 REKAYASA PERANGKAT LUNAK",
      subText: "CLASS OF 2026",
    },
  },
  {
    id: "3-cut-strip",
    name: "Minimalist 3-Cut",
    subtitle: "Format 3 frame elegan dengan spasi lega",
    totalSlots: 3,
    canvasWidth: 600,
    canvasHeight: 1400,
    aspectRatio: "3 / 7",
    icon: "✨",
    slots: [
      { x: 40, y: 50, width: 520, height: 370, borderRadius: 18 },
      { x: 40, y: 445, width: 520, height: 370, borderRadius: 18 },
      { x: 40, y: 840, width: 520, height: 370, borderRadius: 18 },
    ],
    footerArea: {
      x: 40,
      y: 1235,
      width: 520,
      height: 135,
      defaultText: "10 RPL • CLASS MOMENTS",
      subText: "CODE, DREAMS & PASSION",
    },
  },
  {
    id: "polaroid",
    name: "Vintage Polaroid",
    subtitle: "Satu foto ikonik berbingkai lebar gaya instax",
    totalSlots: 1,
    canvasWidth: 900,
    canvasHeight: 1100,
    aspectRatio: "9 / 11",
    icon: "📷",
    slots: [{ x: 60, y: 60, width: 780, height: 800, borderRadius: 8 }],
    footerArea: {
      x: 60,
      y: 880,
      width: 780,
      height: 180,
      defaultText: "10 RPL 2026",
      subText: "Every bug solved is a memory made 💻",
    },
  },
];

// Preset Frame Colors & Gradients
export interface FrameTheme {
  id: string;
  name: string;
  type: "color" | "gradient" | "image";
  background: string;
  textColor: string;
  accentColor: string;
  badge?: string;
  imageUrl?: string;
}

export const PRESET_FRAME_THEMES: FrameTheme[] = [
  {
    id: "midnight",
    name: "Midnight Black",
    type: "color",
    background: "#121316",
    textColor: "#ffffff",
    accentColor: "#6366f1",
    badge: "🖤",
  },
  {
    id: "korean-pastel",
    name: "Korean Pink",
    type: "color",
    background: "#ffe4ec",
    textColor: "#831843",
    accentColor: "#f43f5e",
    badge: "🌸",
  },
  {
    id: "vintage-cream",
    name: "Vintage Cream",
    type: "color",
    background: "#fef8ee",
    textColor: "#451a03",
    accentColor: "#d97706",
    badge: "📜",
  },
  {
    id: "lavender",
    name: "Soft Lavender",
    type: "color",
    background: "#f3e8ff",
    textColor: "#581c87",
    accentColor: "#a855f7",
    badge: "💜",
  },
  {
    id: "matcha-mint",
    name: "Matcha Mint",
    type: "color",
    background: "#e6f4ea",
    textColor: "#14532d",
    accentColor: "#10b981",
    badge: "🍵",
  },
  {
    id: "pure-white",
    name: "Clean White",
    type: "color",
    background: "#ffffff",
    textColor: "#18181b",
    accentColor: "#0284c7",
    badge: "🤍",
  },
  {
    id: "holographic",
    name: "Hologram Sky",
    type: "gradient",
    background: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 50%, #fbc2eb 100%)",
    textColor: "#1e1b4b",
    accentColor: "#6366f1",
    badge: "🌈",
  },
  {
    id: "cyber-neon",
    name: "Cyber 10 RPL",
    type: "gradient",
    background: "linear-gradient(135deg, #090a0f 0%, #1e1035 50%, #032030 100%)",
    textColor: "#38bdf8",
    accentColor: "#06b6d4",
    badge: "⚡",
  },
  {
    id: "sunset-glow",
    name: "Sunset Gradient",
    type: "gradient",
    background: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #feada6 100%)",
    textColor: "#881337",
    accentColor: "#f43f5e",
    badge: "🌅",
  },
];

// Public Image API Template Presets (Using Picsum & Unsplash Public Curated Collections)
export interface PublicImageTemplate {
  id: string;
  title: string;
  category: "aesthetic" | "retro" | "cyber" | "nature" | "anime";
  thumbUrl: string;
  imageUrl: string;
  author: string;
  textColor: string;
}

export const PUBLIC_API_TEMPLATES: PublicImageTemplate[] = [
  {
    id: "pub-aesthetic-clouds",
    title: "Aesthetic Pastel Clouds",
    category: "aesthetic",
    thumbUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&q=90",
    author: "Unsplash Aesthetic",
    textColor: "#1e1b4b",
  },
  {
    id: "pub-retro-analog",
    title: "90s Retro Film Grain",
    category: "retro",
    thumbUrl: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1200&q=90",
    author: "Analog Archive",
    textColor: "#ffffff",
  },
  {
    id: "pub-cyber-grid",
    title: "Cyberpunk Matrix Grid",
    category: "cyber",
    thumbUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=90",
    author: "Dev Matrix",
    textColor: "#22c55e",
  },
  {
    id: "pub-sakura-bloom",
    title: "Japanese Sakura Petals",
    category: "nature",
    thumbUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1200&q=90",
    author: "Tokyo Blossom",
    textColor: "#831843",
  },
  {
    id: "pub-vintage-paper",
    title: "Antique Parchment Paper",
    category: "retro",
    thumbUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=1200&q=90",
    author: "Paper Studio",
    textColor: "#292524",
  },
  {
    id: "pub-neon-city",
    title: "Tokyo Neon Lights",
    category: "cyber",
    thumbUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&q=90",
    author: "Night City",
    textColor: "#38bdf8",
  },
  {
    id: "pub-picsum-gradient",
    title: "Minimalist Soft Texture",
    category: "aesthetic",
    thumbUrl: "https://picsum.photos/id/1056/300/300",
    imageUrl: "https://picsum.photos/id/1056/1200/1800",
    author: "Picsum Public",
    textColor: "#18181b",
  },
  {
    id: "pub-picsum-stars",
    title: "Cosmic Starfield Galaxy",
    category: "aesthetic",
    thumbUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=300&q=80",
    imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&q=90",
    author: "Galaxy View",
    textColor: "#ffffff",
  },
];
