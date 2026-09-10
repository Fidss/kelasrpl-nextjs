"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Plus,
  ArrowLeft,
  Loader2,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  User as UserIcon,
  Sun,
  Moon,
} from "lucide-react";
import MarkdownMessage from "@/components/chatbot/MarkdownMessage";
import LanguageSelector from "@/components/layout/LanguageSelector";
import { useLanguage } from "@/context/LanguageContext";

interface ChatSessionItem {
  id: number;
  title: string;
  updated_at: string;
}

interface MessageItem {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPage() {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  // Set initial sidebar open based on screen width
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    window.addEventListener("theme-changed", checkDark);
    return () => window.removeEventListener("theme-changed", checkDark);
  }, []);

  const toggleTheme = () => {
    if (typeof (window as unknown as { toggleTheme?: () => void }).toggleTheme === "function") {
      (window as unknown as { toggleTheme: () => void }).toggleTheme();
      setIsDark(document.documentElement.classList.contains("dark"));
    } else {
      const nextDark = !isDark;
      setIsDark(nextDark);
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      window.dispatchEvent(
        new CustomEvent("theme-changed", { detail: { isDark: nextDark } })
      );
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/chatbot/sessions");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch {}
  };

  const selectSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setStreamingContent("");
    // Close sidebar on mobile after selecting a session
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    try {
      const res = await fetch(`/api/chatbot/messages?session_id=${sessionId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {}
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setStreamingContent("");
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: MessageItem = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          session_id: currentSessionId,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Gagal memulai percakapan AI");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAssistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          // Check for meta event
          if (trimmed.startsWith("data: ") && trimmed.includes("session_id")) {
            try {
              const meta = JSON.parse(trimmed.slice(6));
              if (meta.session_id) {
                setCurrentSessionId(meta.session_id);
              }
            } catch {}
          }

          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") break;

            try {
              const json = JSON.parse(dataStr);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                fullAssistantText += delta;
                setStreamingContent(fullAssistantText);
              }
            } catch {}
          }
        }
      }

      if (fullAssistantText.trim()) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullAssistantText },
        ]);
        setStreamingContent("");
      }
      loadSessions();
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Maaf, terjadi gangguan saat menghubungkan ke AI. Silakan coba lagi." },
      ]);
    }

    setLoading(false);
  };

  const suggestions = [
    "Jelaskan logika percabangan IF-ELSE di JavaScript",
    "Bantu aku selesaikan soal persamaan kuadrat MTK",
    "Bagaimana cara kerja REST API dan JSON?",
    "Buatkan contoh struktur database relasional siswa",
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden relative">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop: inline collapsible, Mobile: absolute slide-over drawer) */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-72 translate-x-0 shadow-2xl lg:shadow-none"
            : "-translate-x-full lg:translate-x-0 lg:w-0"
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={handleNewChat}
            className="p-1.5 px-2.5 rounded-lg bg-accent-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-accent-700 shadow-xs active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Baru</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-2 py-1 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Riwayat Obrolan
          </p>
          {sessions.length === 0 ? (
            <p className="px-2 py-4 text-xs text-zinc-500 text-center">Belum ada riwayat sesi.</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all truncate ${
                  currentSessionId === s.id
                    ? "bg-accent-50 dark:bg-accent-950/40 text-accent-700 dark:text-accent-300 font-bold"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{s.title}</span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 sm:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
              title="Toggle Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 sm:w-8 h-8 rounded-xl bg-accent-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-bold text-xs sm:text-base text-zinc-900 dark:text-zinc-100 truncate">
                    Elostra AI
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                    Online
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-zinc-500 truncate hidden xs:block">Asisten Belajar Siswa 10 RPL</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSelector />
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center justify-center border border-zinc-200/80 dark:border-zinc-700/60"
              title={t("nav.theme_toggle")}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-700" />}
            </button>
            <Link
              href="/dashboard"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium px-2 py-1 hidden sm:inline-block"
              data-i18n="chat.back_dashboard"
            >
              {t("chat.back_dashboard")}
            </Link>
          </div>
        </header>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {messages.length === 0 && !streamingContent ? (
            <div className="max-w-xl mx-auto py-6 sm:py-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-100 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-3 sm:mb-4 shadow-xs">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1 sm:mb-2">
                Halo, saya Elostra! 👋
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 sm:mb-8 leading-relaxed px-2">
                Asisten AI cerdas untuk membantu belajarmu di 10 RPL. Tanyakan apa saja seputar coding, algoritma, matematika, sains, hingga materi KBM lainnya!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full text-left">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-accent-500 hover:shadow-xs transition-all text-left"
                  >
                    💡 {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 sm:gap-3 max-w-3xl ${
                    m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      m.role === "user"
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        : "bg-accent-600 text-white"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </div>

                  <div
                    className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl text-xs sm:text-sm break-words max-w-[85%] sm:max-w-none ${
                      m.role === "user"
                        ? "bg-accent-600 text-white rounded-tr-xs"
                        : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs shadow-xs"
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-line">{m.content}</p>
                    ) : (
                      <MarkdownMessage content={m.content} />
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Bubble */}
              {streamingContent && (
                <div className="flex gap-2 sm:gap-3 max-w-3xl mr-auto">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-xs shadow-xs text-xs sm:text-sm break-words max-w-[85%] sm:max-w-none">
                    <MarkdownMessage content={streamingContent} />
                  </div>
                </div>
              )}

              {loading && !streamingContent && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                  <span>Elostra sedang berpikir...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="max-w-3xl mx-auto flex gap-2 items-end">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Tanyakan sesuatu ke Elostra..."
              className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5 sm:p-3 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-accent-500 resize-none max-h-32"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-2.5 sm:p-3 rounded-2xl bg-accent-600 hover:bg-accent-700 text-white transition disabled:opacity-40 shrink-0 shadow-md shadow-accent-600/20 active:scale-95"
              aria-label="Kirim Pesan"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

