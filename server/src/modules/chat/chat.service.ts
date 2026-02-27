import { nanoid } from "nanoid";
import ChatMessageModel from "./chat.model";
import { dbState } from "../../config/db";
import { isKicked } from "../student/student.service";
import type { ChatMessage, ChatSendPayload } from "./chat.types";

/* ── In-memory fallback for messages without pollId ── */
const inMemoryMessages: ChatMessage[] = [];
const MAX_IN_MEMORY = 100;

/* ── Rate limiting ───────────────────────────────────  */
// socketId -> timestamps of recent messages
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 5_000; // 5 seconds
const RATE_LIMIT_MAX = 5; // max 5 messages per window

/* ── Helpers ──────────────────────────────────────── */

function assertDbHealthy(): void {
  if (!dbState.healthy) {
    throw new Error("Database unavailable. Please try again.");
  }
}

/**
 * Returns true if the socket has exceeded the rate limit.
 */
export function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(socketId) ?? [];

  // Remove old entries outside the window
  const recent = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(socketId, recent);
    return true;
  }

  recent.push(now);
  rateLimitMap.set(socketId, recent);
  return false;
}

/**
 * Clear rate limit state when a socket disconnects.
 */
export function clearRateLimit(socketId: string): void {
  rateLimitMap.delete(socketId);
}

/* ── Public API ───────────────────────────────────── */

/**
 * Validate and save a chat message.
 * Returns the ChatMessage to broadcast, or throws on error.
 */
export async function sendMessage(
  payload: ChatSendPayload,
  socketId: string
): Promise<ChatMessage> {
  // 1) Validate text
  const text = payload.text?.trim() ?? "";
  if (text.length === 0 || text.length > 300) {
    throw new Error("Message must be between 1 and 300 characters.");
  }

  // 2) Rate limit
  if (isRateLimited(socketId)) {
    throw new Error("You're sending messages too fast. Please slow down.");
  }

  // 3) Check if student is kicked
  try {
    const kicked = await isKicked(payload.studentKey);
    if (kicked) {
      throw new Error("You have been removed by the teacher.");
    }
  } catch (err) {
    // If DB is down, the isKicked check will throw "Database unavailable"
    throw err;
  }

  // 4) Build message object
  const msg: ChatMessage = {
    id: nanoid(12),
    fromKey: payload.studentKey,
    fromName: payload.name,
    text,
    ts: Date.now(),
    pollId: payload.pollId,
  };

  // 5) Persist
  if (payload.pollId && dbState.healthy) {
    try {
      await ChatMessageModel.create({
        pollId: payload.pollId,
        fromKey: msg.fromKey,
        fromName: msg.fromName,
        text: msg.text,
        ts: new Date(msg.ts),
      });
    } catch (err) {
      console.error("[ChatService] Error persisting chat message:", err);
      // Continue — message will still be broadcast
    }
  } else {
    // In-memory fallback
    inMemoryMessages.push(msg);
    if (inMemoryMessages.length > MAX_IN_MEMORY) {
      inMemoryMessages.shift();
    }
  }

  return msg;
}

/**
 * Clear all chat messages for a given pollId (or all in-memory messages).
 * Only teachers should be allowed to call this.
 */
export async function clearMessages(pollId?: string): Promise<void> {
  // Clear from DB if pollId provided and DB is healthy
  if (pollId && dbState.healthy) {
    try {
      await ChatMessageModel.deleteMany({ pollId });
      console.log(`[ChatService] Cleared DB messages for pollId=${pollId}`);
    } catch (err) {
      console.error("[ChatService] Error clearing messages from DB:", err);
    }
  }

  // Also clear in-memory messages
  if (pollId) {
    // Remove only messages matching this pollId
    for (let i = inMemoryMessages.length - 1; i >= 0; i--) {
      if (inMemoryMessages[i].pollId === pollId) {
        inMemoryMessages.splice(i, 1);
      }
    }
  } else {
    inMemoryMessages.length = 0;
  }
}

/**
 * Get last N chat messages for a poll.
 * Falls back to in-memory if no pollId or DB is unavailable.
 */
export async function getMessages(
  pollId?: string,
  limit: number = 50
): Promise<ChatMessage[]> {
  // If pollId is provided and DB is healthy, query Mongo
  if (pollId && dbState.healthy) {
    try {
      const docs = await ChatMessageModel.find({ pollId })
        .sort({ ts: -1 })
        .limit(limit)
        .lean();

      // Return in chronological order (oldest first)
      return docs.reverse().map((d) => ({
        id: d._id.toString(),
        fromKey: d.fromKey,
        fromName: d.fromName,
        text: d.text,
        ts: d.ts.getTime(),
        pollId: d.pollId,
      }));
    } catch (err) {
      console.error("[ChatService] Error fetching messages from DB:", err);
    }
  }

  // Fallback: return in-memory messages
  const filtered = pollId
    ? inMemoryMessages.filter((m) => m.pollId === pollId)
    : inMemoryMessages;

  return filtered.slice(-limit);
}
