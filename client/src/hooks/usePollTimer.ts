import { useState, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  usePollTimer – reusable countdown hook for server-synced polls    */
/* ------------------------------------------------------------------ */

interface UsePollTimerOptions {
  /** Poll start time (epoch ms, ISO string, or Date) */
  startedAt: number | string | Date;
  /** Total poll duration in whole seconds */
  durationSec: number;
  /** Server-issued timestamp used to compute clock offset */
  serverTime: number;
  /** Tick interval in ms (default 250 for smooth updates) */
  tickMs?: number;
}

interface UsePollTimerReturn {
  /** Whole seconds remaining (≥ 0) */
  remainingSec: number;
  /** True once the countdown has reached zero */
  isEnded: boolean;
  /** Percentage of duration elapsed, clamped 0-100 */
  percentElapsed: number;
  /** "mm:ss" formatted string with leading zeros */
  formatted: string;
}

export function usePollTimer({
  startedAt,
  durationSec,
  serverTime,
  tickMs = 250,
}: UsePollTimerOptions): UsePollTimerReturn {
  const [remainingSec, setRemainingSec] = useState<number>(0);

  // Stable offset: how far server clock is ahead of client clock.
  // Captured once per serverTime change so ticks stay drift-free.
  const serverOffsetRef = useRef<number>(0);

  // ── Guard against stale `isEnded` before first tick ────────────────
  // When inputs change, `remainingSec` may be stale (from a previous
  // render) while the tick effect hasn't re-computed yet. Without this
  // guard, `isEnded` could be transiently `true` and trigger premature
  // navigation. We mark `readyRef = false` whenever inputs change
  // (synchronously during render) and only set it back to `true` once
  // the tick callback has actually computed the correct remaining time.
  const readyRef = useRef(false);
  const prevKeyRef = useRef("");
  const inputKey = `${startedAt}|${durationSec}|${serverTime}`;
  if (inputKey !== prevKeyRef.current) {
    prevKeyRef.current = inputKey;
    readyRef.current = false;
  }

  useEffect(() => {
    if (serverTime > 0) {
      serverOffsetRef.current = serverTime - Date.now();
    }
  }, [serverTime]);

  // Tick interval — resets when any input changes
  useEffect(() => {
    if (!startedAt || !durationSec || !serverTime) {
      setRemainingSec(0);
      return;
    }

    const startMs =
      typeof startedAt === "number"
        ? startedAt
        : new Date(startedAt).getTime();

    const tick = () => {
      const nowServer = Date.now() + serverOffsetRef.current;
      const elapsedSec = Math.floor((nowServer - startMs) / 1000);
      const remaining = Math.max(durationSec - elapsedSec, 0);
      setRemainingSec(remaining);
      readyRef.current = true;
    };

    tick(); // compute immediately on mount / dep change
    const id = setInterval(tick, tickMs);
    return () => clearInterval(id);
  }, [startedAt, durationSec, serverTime, tickMs]);

  /* ── derived values (computed every render, no extra state) ─────── */

  // isEnded is only true when the tick has actually confirmed remaining=0
  const isEnded = readyRef.current && remainingSec === 0 && durationSec > 0;

  const elapsedSec = durationSec - remainingSec;
  const percentElapsed =
    durationSec > 0
      ? Math.min(100, Math.max(0, (elapsedSec / durationSec) * 100))
      : 0;

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return { remainingSec, isEnded, percentElapsed, formatted };
}
