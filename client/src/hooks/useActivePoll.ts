import { useEffect, useState, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../types/socketEvents";
import type {
  ActivePoll,
  OptionResult,
  PollActivePayload,
  PollUpdatePayload,
} from "../types/poll";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function useActivePoll(socket: Socket | null) {
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [results, setResults] = useState<OptionResult[]>([]);
  const [serverTime, setServerTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);

  /* ── REST fetch on mount for recovery ─────────────── */
  const fetchActive = useCallback(async () => {
    try {
      console.log("[useActivePoll] Fetching GET /api/poll/active");
      const res = await fetch(`${API_URL}/api/poll/active`);
      const data: PollActivePayload = await res.json();
      console.log(
        "[useActivePoll] REST response → hasActivePoll=",
        !!data.activePoll,
        "pollId=",
        data.activePoll?.pollId ?? "none",
        "status=",
        data.activePoll?.status ?? "n/a"
      );
      setActivePoll(data.activePoll);
      setResults(data.results);
      setServerTime(data.serverTime);
    } catch (err) {
      console.error("[useActivePoll] Failed to fetch active poll:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  /* ── Socket listeners ────────────────────────────── */
  useEffect(() => {
    if (!socket) return;

    const handlePollActive = (payload: PollActivePayload) => {
      console.log(
        "[useActivePoll] Received poll:active →",
        "hasActivePoll=",
        !!payload.activePoll,
        "pollId=",
        payload.activePoll?.pollId ?? "none",
        "status=",
        payload.activePoll?.status ?? "n/a"
      );

      // Always update — server now returns ended poll with results
      setActivePoll(payload.activePoll);
      setResults(payload.results);
      setServerTime(payload.serverTime);
    };

    const handlePollUpdate = (payload: PollUpdatePayload) => {
      console.log(
        "[useActivePoll] Received poll:update → pollId=",
        payload.pollId
      );
      setResults(payload.results);
    };

    socket.on(SOCKET_EVENTS.POLL_ACTIVE, handlePollActive);
    socket.on(SOCKET_EVENTS.POLL_UPDATE, handlePollUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.POLL_ACTIVE, handlePollActive);
      socket.off(SOCKET_EVENTS.POLL_UPDATE, handlePollUpdate);
    };
  }, [socket]);

  return { activePoll, results, serverTime, loading, refetch: fetchActive };
}
