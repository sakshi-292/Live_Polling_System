import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../shared/socketEvents";
import { sendMessage, clearRateLimit, clearMessages } from "./chat.service";
import type { ChatSendPayload, ChatSendAck } from "./chat.types";

/* ── Per-socket event handlers ────────────────────── */

export function registerChatHandlers(io: Server, socket: Socket) {
  /* ── chat:send ──────────────────────────────────── */
  socket.on(
    SOCKET_EVENTS.CHAT_SEND,
    async (payload: ChatSendPayload, ack?: (response: ChatSendAck) => void) => {
      try {
        const msg = await sendMessage(payload, socket.id);

        // Broadcast to ALL connected clients
        io.emit(SOCKET_EVENTS.CHAT_NEW, msg);

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Chat send failed.";
        console.error(`[chat.socket] chat:send error from ${socket.id}:`, message);

        // If kicked, also emit kicked event
        if (message.includes("removed by the teacher")) {
          socket.emit(SOCKET_EVENTS.STUDENT_KICKED, { reason: message });
        }

        socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message });
        if (typeof ack === "function") {
          ack({ ok: false, message });
        }
      }
    }
  );

  /* ── chat:clear (teacher only) ───────────────────── */
  socket.on(
    SOCKET_EVENTS.CHAT_CLEAR,
    async (payload: { pollId?: string }, ack?: (response: { ok: boolean; message?: string }) => void) => {
      try {
        console.log(`[chat.socket] chat:clear from ${socket.id}, pollId=${payload.pollId}`);
        await clearMessages(payload.pollId);

        // Broadcast to all clients that chat was cleared
        io.emit(SOCKET_EVENTS.CHAT_CLEARED, { pollId: payload.pollId });

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to clear chat.";
        console.error(`[chat.socket] chat:clear error:`, message);
        if (typeof ack === "function") {
          ack({ ok: false, message });
        }
      }
    }
  );

  /* ── cleanup on disconnect ─────────────────────── */
  socket.on("disconnect", () => {
    clearRateLimit(socket.id);
  });
}
