"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Plus,
  Send,
  Image as ImageIcon,
  Users,
  User,
  ArrowLeft,
  MoreVertical,
  MoreHorizontal,
  Check,
  CheckCheck,
  X,
  Loader2,
  Info,
  UserPlus,
  LogOut,
  Sparkles,
  Camera,
  MessageSquare,
  Smile,
  Circle,
  Paperclip,
  Trash2,
  Edit3,
} from "lucide-react";
import ProfileEditModal from "@/components/profile/ProfileEditModal";

export const DEFAULT_AVATAR_URL =
  "https://i.pinimg.com/236x/56/2e/be/562ebed9cd49b9a09baa35eddfe86b00.jpg";

interface ChatUser {
  id: number;
  name: string;
  nis: string;
  role: string;
  gender: string;
  avatar_url: string | null;
  bio?: string;
  default_avatar?: string;
}

interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_avatar?: string | null;
  sender_role?: string;
  content: string;
  media_url?: string | null;
  media_type?: string | null;
  is_me: boolean;
  is_edited?: boolean;
  status?: "sending" | "sent" | "delivered";
  created_at: string;
}

interface ConversationItem {
  id: number;
  type: "direct" | "group";
  name: string;
  avatar_url: string | null;
  description: string | null;
  created_by: number | null;
  my_role: string;
  is_admin?: boolean;
  member_count: number;
  members?: Array<{
    user_id: number;
    name: string;
    avatar_url: string | null;
    role: string;
    member_role?: string;
    nis?: string;
  }>;
  target_user?: ChatUser | null;
  unread_count: number;
  last_message?: {
    id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    media_url?: string | null;
    media_type?: string | null;
    created_at: string;
  } | null;
  last_message_at: string;
  created_at: string;
}

function formatChatTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    if (isToday) return timeStr;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Kemarin";

    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

function formatMessageHeaderDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) return "Hari Ini";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) return "Kemarin";

    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function ChatClient({ currentUser }: { currentUser: any }) {
  const searchParams = useSearchParams();
  const urlConvId = searchParams.get("id");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(() => {
    if (urlConvId) {
      const parsed = parseInt(urlConvId, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  });
  const [activeConvDetails, setActiveConvDetails] =
    useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConvList, setLoadingConvList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [switchingConvId, setSwitchingConvId] = useState<number | null>(null);

  // Lazy loading state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "group">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState<"direct" | "group">("direct");
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Create Group Form
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [groupPhotoFile, setGroupPhotoFile] = useState<File | null>(null);
  const [groupPhotoPreview, setGroupPhotoPreview] = useState<string | null>(
    null
  );
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Group Details & Info Modal
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);

  // Delete Conversation Modal
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(false);
  const [isDeletingConv, setIsDeletingConv] = useState(false);

  // Edit & Delete Message State
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<number | null>(null);
  const [deletingMsgId, setDeletingMsgId] = useState<number | null>(null);

  // Edit Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(currentUser);

  // Message Input State
  const [inputText, setInputText] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Image Zoom Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const groupPhotoInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll message container to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // Scroll handler for auto lazy loading older messages when scrolling up
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop < 60 && hasMoreMessages && !loadingOlder && activeConvId) {
      loadOlderMessages(activeConvId);
    }
  };

  // Close message popup menus on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMsgMenuId(null);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Sync profile update event
  useEffect(() => {
    const handleProfileUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setUserProfile((prev: any) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener("user-profile-updated" as any, handleProfileUpdate);
    return () => {
      window.removeEventListener(
        "user-profile-updated" as any,
        handleProfileUpdate
      );
    };
  }, []);

  // Fetch conversations list
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingConvList(true);
    try {
      const res = await fetch("/api/chat/conversations");
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Fetch conversations error:", err);
    } finally {
      if (!silent) setLoadingConvList(false);
    }
  };

  // Poll for NEW messages only (after latest ID) - lightweight
  const pollNewMessages = async (convId: number) => {
    try {
      // Get the latest real message ID from ref (exclude optimistic negative IDs)
      const currentMsgs = messagesRef.current;
      const latestId = currentMsgs.reduce(
        (max, m) => (m.id > 0 && m.id > max ? m.id : max),
        0
      );
      if (latestId === 0) return;

      const res = await fetch(
        `/api/chat/conversations/${convId}/messages?after=${latestId}`
      );
      const data = await res.json();
      if (!data.success) return;

      const newMsgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        ...m,
        is_me: m.is_me || Number(m.sender_id) === Number(currentUser.id),
        is_edited: Boolean(m.is_edited),
        status: "sent" as const,
      }));

      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const newIds = new Set(newMsgs.map((m) => m.id));
          // Seamlessly convert matching optimistic message to real message without blinking
          const updatedPrev = prev.map((m) => {
            if (m.id < 0 && m.is_me) {
              const matchingServerMsg = newMsgs.find(
                (nm) => nm.is_me && nm.content === m.content
              );
              if (matchingServerMsg) {
                newIds.delete(matchingServerMsg.id);
                return { ...matchingServerMsg, status: "sent" as const };
              }
            }
            return m;
          });

          // Append any remaining truly new messages that are not yet in state
          const existingIds = new Set(updatedPrev.map((m) => m.id));
          const trulyNew = newMsgs.filter(
            (nm) => newIds.has(nm.id) && !existingIds.has(nm.id)
          );
          return [...updatedPrev, ...trulyNew];
        });
      }

      if (data.conversation) {
        setActiveConvDetails(data.conversation);
      }
    } catch (err) {
      console.error("Poll messages error:", err);
    }
  };

  // Load OLDER messages (scroll-to-top lazy loading)
  const loadOlderMessages = async (convId: number) => {
    if (loadingOlder || !hasMoreMessages) return;
    setLoadingOlder(true);
    try {
      // Get the oldest message ID currently loaded
      const oldestId = messages.reduce(
        (min, m) => (m.id > 0 && (min === 0 || m.id < min) ? m.id : min),
        0
      );
      if (oldestId === 0) { setLoadingOlder(false); return; }

      const container = messagesContainerRef.current;
      const scrollHeightBefore = container?.scrollHeight || 0;

      const res = await fetch(
        `/api/chat/conversations/${convId}/messages?before=${oldestId}&limit=30`
      );
      const data = await res.json();
      if (!data.success) { setLoadingOlder(false); return; }

      setHasMoreMessages(data.has_more === true);

      const olderMsgs: ChatMessage[] = (data.messages || []).map((m: any) => ({
        ...m,
        is_me: m.is_me || Number(m.sender_id) === Number(currentUser.id),
        is_edited: Boolean(m.is_edited),
        status: "sent" as const,
      }));

      if (olderMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueOlder = olderMsgs.filter((m) => !existingIds.has(m.id));
          return [...uniqueOlder, ...prev];
        });

        // Preserve scroll position after prepending
        requestAnimationFrame(() => {
          if (container) {
            const scrollHeightAfter = container.scrollHeight;
            container.scrollTop += scrollHeightAfter - scrollHeightBefore;
          }
        });
      }
    } catch (err) {
      console.error("Load older messages error:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  // Helper to sync URL (pushState for opening chat, replaceState for updates)
  const syncUrlWithConvId = useCallback((convId: number | null, push = false) => {
    if (typeof window === "undefined") return;
    try {
      const url = convId ? `/chat?id=${convId}` : "/chat";
      if (push) {
        window.history.pushState({ convId }, "", url);
      } else {
        window.history.replaceState({ convId }, "", url);
      }
    } catch {}
  }, []);

  // Listen to browser popstate (phone hardware back button or browser back gesture)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const idStr = params.get("id");
      if (idStr) {
        const parsed = parseInt(idStr, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setActiveConvId(parsed);
          setActiveConvDetails(null);
          setMessages([]);
          setEditingMessage(null);
          setInputText("");
          setSelectedMedia(null);
          setMediaPreview(null);
          setActiveMsgMenuId(null);
          return;
        }
      }
      // If no id parameter, user navigated back to conversation list
      setActiveConvId(null);
      setActiveConvDetails(null);
      setMessages([]);
      setEditingMessage(null);
      setInputText("");
      setSelectedMedia(null);
      setMediaPreview(null);
      setActiveMsgMenuId(null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Switch / Select conversation
  const handleSelectConversation = (convId: number) => {
    if (convId === activeConvId) return;

    setSwitchingConvId(convId);
    setActiveConvId(convId);
    setActiveConvDetails(null);
    setMessages([]);
    setEditingMessage(null);
    setInputText("");
    setSelectedMedia(null);
    setMediaPreview(null);
    setActiveMsgMenuId(null);
    syncUrlWithConvId(convId, true);
  };

  // Back button handler for mobile in-app back arrow
  const handleBackToConversations = () => {
    setActiveConvId(null);
    setActiveConvDetails(null);
    setMessages([]);
    setEditingMessage(null);
    setInputText("");
    setSelectedMedia(null);
    setMediaPreview(null);
    setActiveMsgMenuId(null);
    syncUrlWithConvId(null, true);
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Polling for conversation updates (every 5s, only if tab is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchConversations(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load active conversation messages when activeConvId changes + Polling (every 3s)
  useEffect(() => {
    if (!activeConvId) {
      setLoadingMessages(false);
      setSwitchingConvId(null);
      return;
    }

    let isCancelled = false;
    setLoadingMessages(true);
    setHasMoreMessages(false);

    const loadInitialMessages = async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${activeConvId}/messages?limit=40`);
        const data = await res.json();
        if (!isCancelled && data.success) {
          const serverMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
            ...m,
            is_me: m.is_me || Number(m.sender_id) === Number(currentUser.id),
            is_edited: Boolean(m.is_edited),
            status: "sent" as const,
          }));

          setMessages(serverMessages);
          setHasMoreMessages(data.has_more === true);
          setActiveConvDetails(data.conversation || null);
        }
      } catch (err) {
        console.error("Initial load messages error:", err);
      } finally {
        if (!isCancelled) {
          setLoadingMessages(false);
          setSwitchingConvId(null);
          // Scroll to bottom after initial load
          requestAnimationFrame(() => {
            scrollToBottom(false);
            setTimeout(() => scrollToBottom(false), 60);
          });
        }
      }
    };

    loadInitialMessages();

    // Lightweight polling: only fetch new messages (after latest ID) when tab visible
    const interval = setInterval(() => {
      if (!isCancelled) {
        if (typeof document !== "undefined" && document.hidden) return;
        pollNewMessages(activeConvId);
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeConvId]);

  // IntersectionObserver for load-more-on-scroll-to-top
  useEffect(() => {
    if (!activeConvId || !hasMoreMessages || loadingOlder) return;

    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMoreMessages && !loadingOlder) {
          loadOlderMessages(activeConvId);
        }
      },
      {
        root: messagesContainerRef.current,
        rootMargin: "100px 0px 0px 0px",
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeConvId, hasMoreMessages, loadingOlder, messages.length]);

  // Only auto-scroll to bottom on new outgoing messages (not when loading older)
  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    const prevCount = prevMsgCountRef.current;
    prevMsgCountRef.current = messages.length;
    
    // Skip scroll if loading older messages (messages were prepended)
    if (loadingOlder) return;
    
    // Scroll to bottom if new messages were added at the end
    if (messages.length > prevCount && prevCount > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.is_me || lastMsg?.status === "sending") {
        scrollToBottom(true);
      } else {
        // For incoming messages, only scroll if already near bottom
        const container = messagesContainerRef.current;
        if (container) {
          const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
          if (isNearBottom) scrollToBottom(true);
        }
      }
    }
  }, [messages, loadingOlder]);

  // Load Contacts list when New Chat modal opens
  useEffect(() => {
    if (!isNewChatModalOpen) return;
    setContactsLoading(true);
    fetch("/api/chat/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.users)) {
          setContacts(data.users);
        }
      })
      .catch((err) => console.error("Fetch contacts error:", err))
      .finally(() => setContactsLoading(false));
  }, [isNewChatModalOpen]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "direct" && c.type === "direct") ||
        (activeTab === "group" && c.type === "group");

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.last_message?.content || "").toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [conversations, activeTab, searchQuery]);

  // Filter contacts in modal
  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nis.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  // Start Direct Chat with user
  const handleStartDirectChat = async (targetUserId: number) => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          target_user_id: targetUserId,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversation_id) {
        setIsNewChatModalOpen(false);
        handleSelectConversation(data.conversation_id);
        fetchConversations(true);
      }
    } catch (err) {
      console.error("Start direct chat error:", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  // Create Group Chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || creatingGroup) return;

    setCreatingGroup(true);
    try {
      const formData = new FormData();
      formData.append("type", "group");
      formData.append("name", groupName.trim());
      formData.append("description", groupDesc.trim());
      formData.append("member_ids", JSON.stringify(selectedMemberIds));
      if (groupPhotoFile) {
        formData.append("photo", groupPhotoFile);
      }

      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.conversation_id) {
        setIsNewChatModalOpen(false);
        setGroupName("");
        setGroupDesc("");
        setSelectedMemberIds([]);
        setGroupPhotoFile(null);
        setGroupPhotoPreview(null);
        handleSelectConversation(data.conversation_id);
        fetchConversations(true);
      }
    } catch (err) {
      console.error("Create group error:", err);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Handle Send or Edit Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId) return;

    // 1. Edit Mode
    if (editingMessage) {
      const targetMsgId = editingMessage.id;
      const updatedText = inputText.trim();
      if (!updatedText) return;

      setEditingMessage(null);
      setInputText("");

      // Optimistic update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === targetMsgId
            ? { ...m, content: updatedText, is_edited: true }
            : m
        )
      );

      try {
        const res = await fetch(
          `/api/chat/conversations/${activeConvId}/messages/${targetMsgId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedText }),
          }
        );
        const data = await res.json();
        if (!data.success) {
          pollNewMessages(activeConvId);
        } else {
          fetchConversations(true);
        }
      } catch (err) {
        console.error("Edit message error:", err);
        pollNewMessages(activeConvId);
      }
      return;
    }

    // 2. Normal Send Mode
    if (!inputText.trim() && !selectedMedia) return;

    const currentText = inputText.trim();
    const currentMedia = selectedMedia;
    const currentPreview = mediaPreview;
    const currentConvId = activeConvId;

    // Clear inputs immediately
    setInputText("");
    setSelectedMedia(null);
    setMediaPreview(null);

    // Optimistic temporary message (single checkmark ✓)
    const tempId = -Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversation_id: currentConvId,
      sender_id: Number(currentUser.id),
      sender_name: currentUser.name || "Saya",
      sender_avatar: currentUser.avatar_url || null,
      sender_role: currentUser.role || "student",
      content: currentText,
      media_url: currentPreview,
      media_type: currentMedia ? "image" : null,
      is_me: true,
      status: "sending",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const formData = new FormData();
      if (currentText) formData.append("content", currentText);
      if (currentMedia) formData.append("photo", currentMedia);

      const res = await fetch(
        `/api/chat/conversations/${currentConvId}/messages`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => {
          const hasRealId = prev.some((m) => m.id === data.message.id);
          if (hasRealId) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) =>
            m.id === tempId
              ? {
                  ...data.message,
                  is_me: true,
                  status: "sent",
                }
              : m
          );
        });
        fetchConversations(true);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        alert(data.error || "Gagal mengirim pesan.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: number) => {
    if (!activeConvId) return;
    setDeletingMsgId(null);
    setActiveMsgMenuId(null);

    // Optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== msgId));

    try {
      const res = await fetch(
        `/api/chat/conversations/${activeConvId}/messages/${msgId}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!data.success) {
        pollNewMessages(activeConvId);
      } else {
        fetchConversations(true);
      }
    } catch (err) {
      console.error("Delete message error:", err);
      pollNewMessages(activeConvId);
    }
  };

  // Delete / Leave conversation
  const handleDeleteConversation = async () => {
    if (!activeConvId || isDeletingConv) return;
    setIsDeletingConv(true);
    const targetConvId = activeConvId;

    try {
      const res = await fetch(`/api/chat/conversations/${targetConvId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteConv(false);
        setActiveConvId(null);
        setActiveConvDetails(null);
        setMessages([]);
        syncUrlWithConvId(null);
        await fetchConversations();
      } else {
        alert(data.error || "Gagal menghapus percakapan.");
      }
    } catch (err) {
      console.error("Delete conversation error:", err);
    } finally {
      setIsDeletingConv(false);
    }
  };

  // Handle Media file selection for chat
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Hanya format gambar yang didukung (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 15 MB.");
      return;
    }

    setSelectedMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  // Handle Group photo selection
  const handleGroupPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGroupPhotoFile(file);
    setGroupPhotoPreview(URL.createObjectURL(file));
  };

  // Active conversation object
  const activeConversation = useMemo(() => {
    return (
      activeConvDetails ||
      conversations.find((c) => c.id === activeConvId) ||
      null
    );
  }, [activeConvDetails, conversations, activeConvId]);

  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups: { [dateStr: string]: ChatMessage[] } = {};
    for (const msg of messages) {
      const dateKey = msg.created_at ? msg.created_at.split("T")[0] : "today";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    }
    return groups;
  }, [messages]);

  return (
    <div className="flex h-full w-full max-w-7xl mx-auto md:p-3 overflow-hidden">
      <div className="flex h-full w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 md:rounded-3xl shadow-xl overflow-hidden">
        {/* =========================================================================
            LEFT PANEL: Conversation List Sidebar
        ========================================================================= */}
        <aside
          className={`flex flex-col w-full md:w-[380px] lg:w-[420px] h-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/90 transition-all ${
            activeConvId !== null ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Top User Bar */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer group p-1 -m-1 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Klik untuk ubah foto profil"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden ring-2 ring-accent-500/20 group-hover:ring-accent-500 flex items-center justify-center">
                  <img
                    src={userProfile.avatar_url || DEFAULT_AVATAR_URL}
                    alt={userProfile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[130px] group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                  {userProfile.name}
                </span>
                <span className="text-[10px] text-zinc-400 capitalize">
                  {userProfile.role || "Siswa"}
                </span>
              </div>
            </div>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={() => {
                setNewChatTab("direct");
                setIsNewChatModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-accent-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Chat Baru</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pesan atau kontak..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Tabs Filter (Semua, Pribadi, Grup) */}
            <div className="flex items-center gap-1 mt-2.5 p-1 bg-zinc-200/60 dark:bg-zinc-800 rounded-xl">
              {(
                [
                  { id: "all", label: "Semua" },
                  { id: "direct", label: "Pribadi (DM)" },
                  { id: "group", label: "Grup" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-zinc-700 text-accent-700 dark:text-accent-300 shadow-xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {loadingConvList ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent-500" />
                <span className="text-xs">Memuat percakapan...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Belum Ada Percakapan
                </p>
                <p className="text-[11px] text-zinc-400 max-w-xs mb-4">
                  Mulai kirim DM ke teman sekelas atau buat grup belajar baru.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewChatTab("direct");
                    setIsNewChatModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-accent-600 text-white text-xs font-bold shadow-xs hover:bg-accent-700 transition"
                >
                  + Mulai Chat Pertama
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isGroup = conv.type === "group";
                const isSwitchingThis = switchingConvId === conv.id;
                const avatar = isGroup
                  ? conv.avatar_url || DEFAULT_AVATAR_URL
                  : conv.target_user?.avatar_url || DEFAULT_AVATAR_URL;

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`flex items-center gap-3 p-3.5 transition-all ${
                      loadingMessages || switchingConvId !== null
                        ? isActive
                          ? "cursor-default"
                          : "cursor-not-allowed opacity-75"
                        : "cursor-pointer"
                    } ${
                      isActive
                        ? "bg-accent-50/80 dark:bg-accent-950/40 border-l-4 border-accent-600"
                        : "hover:bg-white/80 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center">
                        <img
                          src={avatar}
                          alt={conv.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_AVATAR_URL;
                          }}
                        />
                      </div>
                      {isGroup && (
                        <div
                          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-600 text-white flex items-center justify-center text-[10px] ring-2 ring-white dark:ring-zinc-900 shadow-xs"
                          title="Grup"
                        >
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate">
                          {conv.name}
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                          {formatChatTime(
                            conv.last_message?.created_at ||
                              conv.last_message_at
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {conv.last_message ? (
                            <>
                              {isGroup && (
                                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                  {conv.last_message.sender_name.split(" ")[0]}:{" "}
                                </span>
                              )}
                              {conv.last_message.media_url && !conv.last_message.content ? (
                                <span className="italic flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3 inline" /> Foto
                                </span>
                              ) : (
                                conv.last_message.content
                              )}
                            </>
                          ) : (
                            <span className="italic text-zinc-400">
                              Belum ada pesan
                            </span>
                          )}
                        </p>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSwitchingThis && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                          )}
                          {conv.unread_count > 0 && !isSwitchingThis && (
                            <span className="px-1.5 py-0.5 min-w-[18px] text-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* =========================================================================
            RIGHT PANEL: Active Chat Conversation
        ========================================================================= */}
        <section
          className={`flex-1 flex flex-col h-full bg-zinc-100 dark:bg-zinc-950 transition-all ${
            activeConvId === null ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConvId !== null ? (
            <>
              {/* Chat Top Header */}
              <div className="h-16 px-4 sm:px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={handleBackToConversations}
                    className="md:hidden p-1.5 -ml-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Conversation Avatar & Info */}
                  {activeConversation ? (
                    <div
                      onClick={() => {
                        if (activeConversation.type === "group") {
                          setIsGroupInfoModalOpen(true);
                        }
                      }}
                      className={`flex items-center gap-3 min-w-0 ${
                        activeConversation.type === "group"
                          ? "cursor-pointer group"
                          : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-1 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center shrink-0">
                        <img
                          src={
                            (activeConversation.type === "group"
                              ? activeConversation.avatar_url
                              : activeConversation.target_user?.avatar_url) ||
                            DEFAULT_AVATAR_URL
                          }
                          alt={activeConversation.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              DEFAULT_AVATAR_URL;
                          }}
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-accent-600 transition-colors">
                          {activeConversation.name}
                        </h2>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {activeConversation.type === "group" ? (
                            `${activeConversation.member_count} anggota • Info grup`
                          ) : activeConversation.target_user ? (
                            <span className="capitalize">
                              {activeConversation.target_user.role || "Siswa"} •{" "}
                              {activeConversation.target_user.nis || "SMK 17"}
                            </span>
                          ) : (
                            "Pesan Pribadi"
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Loading Header Skeleton */
                    <div className="flex items-center gap-3 min-w-0 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="h-3.5 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                        <div className="h-2.5 w-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-md" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Header Action Menu */}
                {activeConversation && (
                  <div className="flex items-center gap-1">
                    {activeConversation.type === "group" && (
                      <button
                        type="button"
                        onClick={() => setIsGroupInfoModalOpen(true)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        title="Info Grup & Anggota"
                      >
                        <Info className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteConv(true)}
                      className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                      title={
                        activeConversation.type === "group"
                          ? "Keluar / Hapus Grup"
                          : "Hapus Chat"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Message Feed Area */}
              <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-100/70 dark:bg-zinc-950/70"
              >
                {loadingMessages ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-zinc-400 gap-3 py-16 animate-in fade-in duration-150">
                    <div className="w-14 h-14 rounded-3xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center shadow-xs">
                      <Loader2 className="w-7 h-7 animate-spin text-accent-600 dark:text-accent-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        Memuat riwayat chat...
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Menyiapkan percakapan Anda
                      </p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-center text-zinc-400 p-6 animate-in fade-in duration-150">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-accent-500 mb-3 shadow-xs">
                      <Smile className="w-7 h-7" />
                    </div>
                    <p className="font-bold text-sm text-zinc-800 dark:text-zinc-200 mb-1">
                      Mulai Percakapan!
                    </p>
                    <p className="text-xs text-zinc-400 max-w-xs">
                      Kirim pesan pertama Anda untuk menyapa teman atau membagikan materi kelas.
                    </p>
                  </div>
                ) : (
                  <>
                  {/* Sentinel for loading older messages */}
                  <div ref={loadMoreSentinelRef} className="h-1" />
                  {loadingOlder && (
                    <div className="flex items-center justify-center py-3 gap-2 animate-in fade-in duration-150">
                      <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                      <span className="text-[11px] text-zinc-500 font-medium">Memuat pesan lama...</span>
                    </div>
                  )}
                  {hasMoreMessages && !loadingOlder && (
                    <div className="flex justify-center py-2">
                      <button
                        type="button"
                        onClick={() => activeConvId && loadOlderMessages(activeConvId)}
                        className="px-3 py-1.5 rounded-full bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shadow-xs"
                      >
                        ↑ Muat pesan lebih lama
                      </button>
                    </div>
                  )}
                  {Object.entries(messageGroups).map(([dateKey, groupMsgs]) => (
                    <div key={dateKey} className="space-y-3">
                      {/* Date Separator Pill */}
                      <div className="flex justify-center my-3">
                        <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 uppercase tracking-wider">
                          {formatMessageHeaderDate(dateKey)}
                        </span>
                      </div>

                      {/* Messages within this date */}
                      {groupMsgs.map((msg) => {
                        const isMe =
                          msg.is_me ||
                          Number(msg.sender_id) === Number(currentUser.id);
                        const isGroup = activeConversation?.type === "group";
                        const canDelete =
                          isMe ||
                          activeConversation?.my_role === "admin" ||
                          Boolean(activeConversation?.is_admin);
                        const canEdit = isMe && Boolean(msg.content);

                        return (
                          <div
                            key={msg.id}
                            className={`group/msg flex items-end gap-2 relative ${
                              isMe ? "justify-end" : "justify-start"
                            }`}
                          >
                            {/* In Group, show other sender avatar on incoming */}
                            {!isMe && isGroup && (
                              <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-700 flex items-center justify-center shrink-0 mb-1">
                                <img
                                  src={
                                    msg.sender_avatar || DEFAULT_AVATAR_URL
                                  }
                                  alt={msg.sender_name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (
                                      e.currentTarget as HTMLImageElement
                                    ).src = DEFAULT_AVATAR_URL;
                                  }}
                                />
                              </div>
                            )}

                            {/* Message Action Dropdown Button (Hover on Left for outgoing, on Right for incoming) */}
                            {isMe && (canEdit || canDelete) && (
                              <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity self-center mb-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMsgMenuId(
                                      activeMsgMenuId === msg.id ? null : msg.id
                                    );
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                                  title="Opsi Pesan"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {activeMsgMenuId === msg.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                                  >
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMsgMenuId(null);
                                          setEditingMessage(msg);
                                          setInputText(msg.content);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center gap-2"
                                      >
                                        <Edit3 className="w-3 h-3 text-accent-500" />
                                        <span>Edit Pesan</span>
                                      </button>
                                    )}
                                    {canDelete && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveMsgMenuId(null);
                                          setDeletingMsgId(msg.id);
                                        }}
                                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Hapus</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all ${
                                isMe
                                  ? "bg-accent-600 text-white rounded-br-xs"
                                  : "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-bl-xs"
                              }`}
                            >
                              {/* Sender Name in Group for incoming */}
                              {!isMe && isGroup && (
                                <div className="text-[11px] font-bold text-accent-600 dark:text-accent-400 mb-1">
                                  {msg.sender_name}
                                </div>
                              )}

                              {/* Media Attachment if present */}
                              {msg.media_url && (
                                <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group relative bg-black/5">
                                  <img
                                    src={msg.media_url}
                                    alt="Foto terkirim"
                                    className="w-full max-h-72 object-cover rounded-xl transition-transform group-hover:scale-[1.02]"
                                    onClick={() =>
                                      setLightboxUrl(msg.media_url!)
                                    }
                                  />
                                </div>
                              )}

                              {/* Message Text */}
                              {msg.content && (
                                <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                  {msg.content}
                                </p>
                              )}

                              {/* Message Timestamp, Edited Tag & Checkmarks */}
                              <div
                                className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                  isMe
                                    ? "text-white/80"
                                    : "text-zinc-400 dark:text-zinc-500"
                                }`}
                              >
                                {msg.is_edited && (
                                  <span className="italic text-[9px] opacity-75 mr-0.5">
                                    (diedit)
                                  </span>
                                )}
                                <span>
                                  {formatChatTime(msg.created_at)}
                                </span>
                                {isMe && (
                                  <span
                                    className="flex items-center ml-0.5"
                                    title={
                                      msg.status === "sending"
                                        ? "Sedang dikirim ke database..."
                                        : "Tersimpan / Terkirim"
                                    }
                                  >
                                    {msg.status === "sending" ? (
                                      <Check className="w-3.5 h-3.5 inline text-white/70 animate-pulse" />
                                    ) : (
                                      <CheckCheck className="w-3.5 h-3.5 inline text-sky-200 dark:text-sky-300" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Delete button for group admin on incoming messages */}
                            {!isMe && canDelete && (
                              <div className="relative opacity-0 group-hover/msg:opacity-100 transition-opacity self-center mb-1">
                                <button
                                  type="button"
                                  onClick={() => setDeletingMsgId(msg.id)}
                                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                                  title="Hapus Pesan Anggota (Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bottom Bar */}
              <div className="p-3 sm:p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                {/* Editing Message Banner */}
                {editingMessage && (
                  <div className="mb-2 p-2 px-3 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800/60 rounded-2xl flex items-center justify-between text-xs text-accent-800 dark:text-accent-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 truncate">
                      <Edit3 className="w-3.5 h-3.5 shrink-0 text-accent-600 dark:text-accent-400" />
                      <span className="truncate">
                        Mengedit:{" "}
                        <strong className="font-semibold">
                          {editingMessage.content}
                        </strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessage(null);
                        setInputText("");
                      }}
                      className="p-1 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-900 text-accent-600 dark:text-accent-300 shrink-0 ml-2"
                      title="Batal edit"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Image Preview Pill before sending */}
                {mediaPreview && !editingMessage && (
                  <div className="mb-3 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center gap-3 border border-zinc-200 dark:border-zinc-700 max-w-md">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {selectedMedia?.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Foto siap dikirim
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMedia(null);
                        setMediaPreview(null);
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  {/* Media Attachment Trigger */}
                  {!editingMessage && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                        title="Kirim Foto"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleMediaSelect}
                      />
                    </>
                  )}

                  {/* Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={
                      editingMessage
                        ? "Edit teks pesan lalu tekan Simpan..."
                        : "Ketik pesan..."
                    }
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
                  />

                  {/* Send / Save Button */}
                  <button
                    type="submit"
                    disabled={!inputText.trim() && !selectedMedia}
                    className="p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-accent-600/20 transition-all hover:scale-105 active:scale-95"
                  >
                    {editingMessage ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Simpan</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Kirim</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No Conversation Selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="w-20 h-20 rounded-3xl bg-accent-500/10 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Kelas 10 RPL Chat Room
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
                Kirim pesan langsung ke teman atau buat grup diskusi belajar untuk proyek dan tugas sekolah.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNewChatTab("direct");
                    setIsNewChatModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-accent-600 hover:bg-accent-700 text-white text-xs font-bold shadow-md shadow-accent-600/20 transition"
                >
                  + Mulai Kirim DM
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewChatTab("group");
                    setIsNewChatModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition"
                >
                  Buat Grup Baru
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* =========================================================================
          MODAL: Konfirmasi Hapus Pesan
      ========================================================================= */}
      {deletingMsgId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Hapus Pesan?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Pesan ini akan dihapus secara permanen dari percakapan.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeletingMsgId(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(deletingMsgId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
              >
                Hapus Pesan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Konfirmasi Hapus / Keluar Percakapan
      ========================================================================= */}
      {confirmDeleteConv && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {activeConversation.type === "group"
                  ? "Keluar dari Grup?"
                  : "Hapus Percakapan Ini?"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {activeConversation.type === "group"
                  ? `Apakah Anda yakin ingin keluar dari "${activeConversation.name}"?`
                  : `Semua riwayat obrolan dengan "${activeConversation.name}" akan dihapus.`}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteConv(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeletingConv}
                onClick={handleDeleteConversation}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-600/20 flex items-center gap-1.5 transition"
              >
                {isDeletingConv ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>
                    {activeConversation.type === "group"
                      ? "Keluar / Hapus"
                      : "Hapus Chat"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Mulai Chat Baru (DM atau Buat Grup)
      ========================================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Mulai Chat Baru
                </h2>
                <p className="text-xs text-zinc-400">
                  Pilih teman untuk kirim pesan pribadi atau buat grup baru
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-800 px-5 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setNewChatTab("direct")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  newChatTab === "direct"
                    ? "border-accent-600 text-accent-600 dark:text-accent-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Pesan Pribadi (DM)</span>
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab("group")}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  newChatTab === "group"
                    ? "border-accent-600 text-accent-600 dark:text-accent-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Buat Grup Baru</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {newChatTab === "direct" ? (
                /* TAB 1: Direct Message Contact Picker */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Cari nama teman atau NIS..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
                    />
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80 overflow-y-auto">
                    {contactsLoading ? (
                      <div className="flex items-center justify-center p-8 text-zinc-400 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
                        <span className="text-xs">Memuat teman sekelas...</span>
                      </div>
                    ) : filteredContacts.length === 0 ? (
                      <p className="text-xs text-center py-6 text-zinc-400">
                        Kontak tidak ditemukan.
                      </p>
                    ) : (
                      filteredContacts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleStartDirectChat(c.id)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 cursor-pointer transition"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                            <img
                              src={c.avatar_url || DEFAULT_AVATAR_URL}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  DEFAULT_AVATAR_URL;
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {c.name}
                            </h4>
                            <span className="text-[10px] text-zinc-400 capitalize">
                              {c.role || "Siswa"} • NIS: {c.nis || "-"}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-accent-600 dark:text-accent-400">
                            Kirim DM &rarr;
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* TAB 2: Create Group Form */
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  {/* Group Photo & Name */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-2 ring-accent-500/20 flex items-center justify-center shrink-0">
                        <img
                          src={groupPhotoPreview || DEFAULT_AVATAR_URL}
                          alt="Grup"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => groupPhotoInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer"
                        title="Ganti Foto Grup"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                      <input
                        ref={groupPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGroupPhotoChange}
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Nama Grup *
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Contoh: Kelompok RPL 1 / Panitia"
                        required
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
                      />
                    </div>
                  </div>

                  {/* Group Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Deskripsi Grup (Opsional)
                    </label>
                    <input
                      type="text"
                      value={groupDesc}
                      onChange={(e) => setGroupDesc(e.target.value)}
                      placeholder="Tujuan grup ini dibuat..."
                      className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-accent-500"
                    />
                  </div>

                  {/* Select Group Members */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        Pilih Anggota ({selectedMemberIds.length} dipilih)
                      </label>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-2 bg-zinc-50/50 dark:bg-zinc-800/40">
                      {contacts.map((c) => {
                        const isSelected = selectedMemberIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedMemberIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition ${
                              isSelected
                                ? "bg-accent-100/60 dark:bg-accent-950/60"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded-md text-accent-600 focus:ring-accent-500"
                            />
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-700 shrink-0">
                              <img
                                src={c.avatar_url || DEFAULT_AVATAR_URL}
                                alt={c.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    DEFAULT_AVATAR_URL;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {c.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {c.nis}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsNewChatModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={creatingGroup || !groupName.trim()}
                      className="px-5 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-accent-600/20 flex items-center gap-1.5"
                    >
                      {creatingGroup ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Membuat Grup...</span>
                        </>
                      ) : (
                        <span>Buat Grup</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Info Grup & Anggota
      ========================================================================= */}
      {isGroupInfoModalOpen && activeConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Detail & Anggota Grup
              </h2>
              <button
                type="button"
                onClick={() => setIsGroupInfoModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Group Avatar & Title */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-accent-500/20 bg-zinc-200 dark:bg-zinc-800 mb-3 shadow-inner">
                  <img
                    src={activeConversation.avatar_url || DEFAULT_AVATAR_URL}
                    alt={activeConversation.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {activeConversation.name}
                </h3>
                {activeConversation.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    {activeConversation.description}
                  </p>
                )}
                <span className="mt-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                  {activeConversation.members?.length ||
                    activeConversation.member_count}{" "}
                  Anggota
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Daftar Anggota
                </h4>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {activeConversation.members?.map((m) => (
                    <div
                      key={m.user_id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                          <img
                            src={m.avatar_url || DEFAULT_AVATAR_URL}
                            alt={m.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                DEFAULT_AVATAR_URL;
                            }}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {m.name} {m.user_id === currentUser.id && "(Anda)"}
                          </p>
                          <p className="text-[10px] text-zinc-400 capitalize">
                            {m.role || "Siswa"}
                          </p>
                        </div>
                      </div>

                      {m.member_role === "admin" && (
                        <span className="px-2 py-0.5 rounded-md bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 text-[10px] font-bold">
                          Admin Grup
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          IMAGE LIGHTBOX MODAL
      ========================================================================= */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl}
            alt="Perbesar Foto"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* =========================================================================
          MODAL: Edit Profile & Ubah Foto
      ========================================================================= */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={userProfile}
        onProfileUpdated={(updated) => {
          setUserProfile(updated);
          fetchConversations(true);
        }}
      />
    </div>
  );
}
