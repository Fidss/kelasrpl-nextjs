"use client";

import React, { useState, useEffect } from "react";
import {
  PHOTOBOOTH_TEMPLATES,
  PRESET_FRAME_THEMES,
  PhotoboothTemplate,
  FrameTheme,
  PublicImageTemplate,
} from "@/lib/photobooth-templates";
import {
  X,
  Sparkles,
  Layout,
  Palette,
  Globe,
  Search,
  Check,
  RefreshCw,
} from "lucide-react";

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: PhotoboothTemplate;
  onSelectTemplate: (template: PhotoboothTemplate) => void;
  currentTheme: FrameTheme;
  onSelectTheme: (theme: FrameTheme) => void;
}

export default function TemplatePickerModal({
  isOpen,
  onClose,
  currentTemplate,
  onSelectTemplate,
  currentTheme,
  onSelectTheme,
}: TemplatePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"layout" | "colors" | "public-api">("layout");

  // Public Image API state
  const [publicTemplates, setPublicTemplates] = useState<PublicImageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  // Fetch public image templates from our API
  const fetchPublicTemplates = async (query = "", category = "all") => {
    setIsLoadingPublic(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category !== "all") params.set("category", category);

      const res = await fetch(`/api/studio/public-templates?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPublicTemplates(data.data);
      }
    } catch (err) {
      console.error("Error loading public templates:", err);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "public-api" && publicTemplates.length === 0) {
      fetchPublicTemplates();
    }
  }, [isOpen, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPublicTemplates(searchQuery, selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    fetchPublicTemplates(searchQuery, cat);
  };

  const applyPublicTemplate = (item: PublicImageTemplate) => {
    // Proxied image URL to ensure CORS compliance with Canvas 2D
    const proxiedUrl = `/api/studio/proxy-image?url=${encodeURIComponent(item.imageUrl)}`;
    const theme: FrameTheme = {
      id: item.id,
      name: item.title,
      type: "image",
      background: "#18181b",
      textColor: item.textColor || "#ffffff",
      accentColor: "#6366f1",
      badge: "🌐",
      imageUrl: proxiedUrl,
    };
    onSelectTheme(theme);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-600/10 dark:bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Pilih Template & Desain Bingkai
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Format layout, warna aesthetic, atau pilihan latar gambar keren
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-5 bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setActiveTab("layout")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "layout"
                ? "border-accent-600 text-accent-600 dark:text-accent-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>Format Layout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("colors")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "colors"
                ? "border-accent-600 text-accent-600 dark:text-accent-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Warna & Gradien</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("public-api")}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "public-api"
                ? "border-accent-600 text-accent-600 dark:text-accent-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Template Gambar</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[58vh]">
          {/* TAB 1: Layout Selection */}
          {activeTab === "layout" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PHOTOBOOTH_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === currentTemplate.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => onSelectTemplate(tmpl)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? "border-accent-600 bg-accent-50/40 dark:bg-accent-950/20 shadow-sm ring-2 ring-accent-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{tmpl.icon}</div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {tmpl.subtitle}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/50 flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                      <span>{tmpl.totalSlots} Pose Foto</span>
                      <span>Rasio {tmpl.aspectRatio}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: Frame Colors & Gradients */}
          {activeTab === "colors" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_FRAME_THEMES.map((th) => {
                const isSelected = currentTheme.id === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(th);
                    }}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden ${
                      isSelected
                        ? "border-accent-600 shadow-md ring-2 ring-accent-500/20 scale-[1.02]"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-800/50"
                    }`}
                  >
                    <div
                      className="w-full h-12 rounded-xl mb-2 border border-black/10 dark:border-white/10 shadow-inner flex items-center justify-center text-lg"
                      style={{ background: th.background }}
                    >
                      {th.badge}
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {th.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 capitalize">
                      {th.type}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 3: Public Image API Templates */}
          {activeTab === "public-api" && (
            <div className="space-y-4">
              {/* Search & Category Filter */}
              <div className="space-y-2">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari tema (cth: anime, neon, pastel, retro, stars)..."
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Cari</span>
                  </button>
                </form>

                {/* Categories */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {["all", "aesthetic", "retro", "cyber", "nature"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                      }`}
                    >
                      {cat === "all" ? "Semua" : cat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Public Image Templates */}
              {isLoadingPublic ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-accent-500" />
                  <span className="text-xs">Memuat template gambar...</span>
                </div>
              ) : publicTemplates.length === 0 ? (
                <div className="text-center py-10 text-xs text-zinc-400">
                  Tidak ada template gambar yang cocok. Coba kata kunci lain.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {publicTemplates.map((item) => {
                    const isSelected = currentTheme.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => applyPublicTemplate(item)}
                        className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer aspect-4/5 flex flex-col justify-end p-2.5 ${
                          isSelected
                            ? "border-accent-600 ring-2 ring-accent-500/30 scale-102 shadow-lg"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-accent-400 hover:scale-101"
                        }`}
                      >
                        {/* Background Thumbnail */}
                        <img
                          src={item.thumbUrl}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Title & Author */}
                        <div className="relative z-10 text-left">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-accent-300">
                            {item.category}
                          </span>
                          <h4 className="text-xs font-bold text-white leading-tight line-clamp-1">
                            {item.title}
                          </h4>
                          <p className="text-[9px] text-zinc-300 mt-0.5">
                            {item.author}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/60">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[60%]">
            Aktif: <strong className="text-zinc-800 dark:text-zinc-200">{currentTemplate.name}</strong> •{" "}
            <span>{currentTheme.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Terapkan & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
