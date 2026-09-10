// Studio Presets: Built-in royalty-free BGM tracks for TikTok-style videos & Photobooth stickers

export interface BgmTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  durationSec: number;
  url: string;
  coverArt: string;
  badge: string;
}

// Curated royalty-free / open web audio tracks that can be used directly for videos
export const STUDIO_BGM_TRACKS: BgmTrack[] = [
  {
    id: "bgm-lofi-koding",
    title: "Midnight Lo-Fi Coding",
    artist: "RPL Chill Beats",
    genre: "Lo-Fi",
    durationSec: 60,
    // Free royalty-free audio loop sample
    url: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg", // Fallback or synthesizer
    coverArt: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=150&q=80",
    badge: "☕",
  },
  {
    id: "bgm-cyber-synth",
    title: "Synthwave Neon 1984",
    artist: "Cyber District",
    genre: "Synthwave",
    durationSec: 45,
    url: "https://actions.google.com/sounds/v1/science_fiction/alien_beacon.ogg",
    coverArt: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&q=80",
    badge: "⚡",
  },
  {
    id: "bgm-anime-sparkle",
    title: "School Life Sparkle",
    artist: "Anime Acoustic",
    genre: "Acoustic",
    durationSec: 50,
    url: "https://actions.google.com/sounds/v1/leisure/ukelele_strum.ogg",
    coverArt: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&q=80",
    badge: "✨",
  },
];

export interface StudioSticker {
  id: string;
  name: string;
  type: "emoji" | "badge" | "rpl";
  content: string; // Emoji character or text
  color?: string;
}

export const STUDIO_STICKERS: StudioSticker[] = [
  // Class & Tech Badges
  { id: "st-rpl-badge", name: "10 RPL Official", type: "rpl", content: "⚡ 10 RPL" },
  { id: "st-smk17", name: "SMKN 17", type: "rpl", content: "🏫 SMKN 17 JKT" },
  { id: "st-bugfree", name: "Bug Free Zone", type: "rpl", content: "🐛 Bug Free Zone" },
  { id: "st-code", name: "Eat Sleep Code", type: "rpl", content: "💻 Code & Chill" },
  { id: "st-class26", name: "Class of 26", type: "rpl", content: "🎓 Class of 2026" },
  { id: "st-git", name: "Git Push", type: "rpl", content: "🚀 git push --force" },

  // Expressive Emojis & Sparkles
  { id: "st-sparkle", name: "Sparkles", type: "emoji", content: "✨" },
  { id: "st-fire", name: "Fire", type: "emoji", content: "🔥" },
  { id: "st-sunglasses", name: "Cool", type: "emoji", content: "😎" },
  { id: "st-pinkheart", name: "Love", type: "emoji", content: "💖" },
  { id: "st-star", name: "Star", type: "emoji", content: "⭐" },
  { id: "st-crown", name: "Crown", type: "emoji", content: "👑" },
  { id: "st-cat", name: "Cute Cat", type: "emoji", content: "🐱" },
  { id: "st-ribbon", name: "Ribbon", type: "emoji", content: "🎀" },
  { id: "st-camera", name: "Camera", type: "emoji", content: "📸" },
  { id: "st-100", name: "100", type: "emoji", content: "💯" },
  { id: "st-peace", name: "Peace", type: "emoji", content: "✌️" },
  { id: "st-party", name: "Party", type: "emoji", content: "🎉" },
];
