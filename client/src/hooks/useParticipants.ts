import { useEffect, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../types/socketEvents";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export interface Participant {
  studentKey: string;
  name: string;
  lastSeenAt: number;
}

interface ParticipantsPayload {
  participants: Participant[];
}

export function useParticipants(socket: Socket | null) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  /* ── REST fetch on mount ─────────────────────────── */
  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/students/participants`);
      if (!res.ok) return;
      const data: ParticipantsPayload = await res.json();
      setParticipants(data.participants);
    } catch (err) {
      console.error("[useParticipants] Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  /* ── Socket listener for live updates ────────────── */
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (payload: ParticipantsPayload) => {
      setParticipants(payload.participants);
    };

    socket.on(SOCKET_EVENTS.PARTICIPANTS_UPDATE, handleUpdate);
    return () => {
      socket.off(SOCKET_EVENTS.PARTICIPANTS_UPDATE, handleUpdate);
    };
  }, [socket]);

  return { participants, loading, refetch: fetchParticipants };
}
