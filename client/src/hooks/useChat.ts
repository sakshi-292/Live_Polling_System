import { useEffect, useState, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../types/socketEvents";

/* ── Types ─────────────────────────────────────────── */

export interface ChatMessage {
  id: string;
  fromKey: string;
  fromName: string;
  text: string;
  ts: number;
  pollId?: string;
  /** Client-only: "sending" | "sent" | "failed" */
  _status?: "sending" | "sent" | "failed";
}

interface ChatSendAck {
  ok: boolean;
  message?: string;
}

interface ChatHistoryPayload {
  messages: ChatMessage[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

/* ── Hook ──────────────────────────────────────────── */

export function useChat(
  socket: Socket | null,
  myKey: string,
  myName: string,
  pollId: string | undefined
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedPollIdRef = useRef<string | null>(null);

  /* ── REST fetch for history on poll change ────────── */
  const fetchHistory = useCallback(
    async (pId: string) => {
      if (fetchedPollIdRef.current === pId) return; // already fetched
      fetchedPollIdRef.current = pId;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/chat?pollId=${encodeURIComponent(pId)}`);
        if (res.ok) {
          const data: { messages: ChatMessage[] } = await res.json();
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("[useChat] Error fetching chat history:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Fetch when pollId changes
  useEffect(() => {
    if (pollId) {
      fetchHistory(pollId);
    }
  }, [pollId, fetchHistory]);

  /* ── Socket listeners ────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const handleChatNew = (msg: ChatMessage) => {
      setMessages((prev) => {
        // Deduplicate — if we sent this optimistically, replace it
        const existing = prev.find(
          (m) => m.id === msg.id || (m._status === "sending" && m.fromKey === msg.fromKey && m.text === msg.text)
        );
        if (existing) {
          return prev.map((m) =>
            m === existing ? { ...msg, _status: "sent" as const } : m
          );
        }
        return [...prev, { ...msg, _status: "sent" }];
      });
    };

    const handleChatHistory = (payload: ChatHistoryPayload) => {
      setMessages(payload.messages.map((m) => ({ ...m, _status: "sent" })));
    };

    const handleChatCleared = () => {
      setMessages([]);
    };

    socket.on(SOCKET_EVENTS.CHAT_NEW, handleChatNew);
    socket.on(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
    socket.on(SOCKET_EVENTS.CHAT_CLEARED, handleChatCleared);

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_NEW, handleChatNew);
      socket.off(SOCKET_EVENTS.CHAT_HISTORY, handleChatHistory);
      socket.off(SOCKET_EVENTS.CHAT_CLEARED, handleChatCleared);
    };
  }, [socket]);

  /* ── Send message ────────────────────────────────── */
  const sendMessage = useCallback(
    (text: string) => {
      if (!socket || !text.trim()) return;

      const trimmed = text.trim();
      const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Optimistic message
      const optimistic: ChatMessage = {
        id: tempId,
        fromKey: myKey,
        fromName: myName,
        text: trimmed,
        ts: Date.now(),
        pollId,
        _status: "sending",
      };

      setMessages((prev) => [...prev, optimistic]);

      socket.emit(
        SOCKET_EVENTS.CHAT_SEND,
        {
          studentKey: myKey,
          name: myName,
          text: trimmed,
          pollId,
        },
        (ack: ChatSendAck) => {
          if (!ack.ok) {
            // Mark as failed
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, _status: "failed" as const } : m
              )
            );
          }
          // On success the chat:new broadcast will reconcile
        }
      );
    },
    [socket, myKey, myName, pollId]
  );

  /* ── Clear chat (teacher only) ──────────────────── */
  const clearChat = useCallback(() => {
    if (!socket) return;
    socket.emit(SOCKET_EVENTS.CHAT_CLEAR, { pollId });
  }, [socket, pollId]);

  /* ── Typing indicator ─────────────────────────── */
  const [typingUsers, setTypingUsers] = useState<{ name: string; key: string }[]>([]);
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTypingEmitRef = useRef<number>(0);

  // Listen for typing updates from other users
  useEffect(() => {
    if (!socket) return;

    const handleTypingUpdate = (payload: { name: string; key: string }) => {
      // Add or refresh this user in the typing list
      setTypingUsers((prev) => {
        const exists = prev.find((u) => u.key === payload.key);
        if (!exists) return [...prev, payload];
        return prev;
      });

      // Clear previous timer for this user
      if (typingTimersRef.current[payload.key]) {
        clearTimeout(typingTimersRef.current[payload.key]);
      }

      // Remove after 1.2s of no new typing events
      typingTimersRef.current[payload.key] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.key !== payload.key));
        delete typingTimersRef.current[payload.key];
      }, 1200);
    };

    socket.on(SOCKET_EVENTS.CHAT_TYPING_UPDATE, handleTypingUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.CHAT_TYPING_UPDATE, handleTypingUpdate);
      // Cleanup all timers
      Object.values(typingTimersRef.current).forEach(clearTimeout);
      typingTimersRef.current = {};
    };
  }, [socket]);

  // Emit typing event (throttled — max once per 800ms)
  const emitTyping = useCallback(() => {
    if (!socket) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 800) return;
    lastTypingEmitRef.current = now;
    socket.emit(SOCKET_EVENTS.CHAT_TYPING, { name: myName, key: myKey });
  }, [socket, myName, myKey]);

  // Stop typing — remove self from others' lists immediately when sending
  const stopTyping = useCallback(() => {
    lastTypingEmitRef.current = 0; // reset throttle so next keystroke works
  }, []);

  return { messages, loading, sendMessage, clearChat, typingUsers, emitTyping, stopTyping };
}
