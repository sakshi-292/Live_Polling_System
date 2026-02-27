import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../shared/socketEvents";
import {
  createPoll,
  vote,
  getActivePollState,
  setOnPollEnd,
} from "./poll.service";
import {
  kickStudent,
  getSocketId,
  listActiveStudents,
  isKicked,
} from "../student/student.service";
import { getMessages } from "../chat/chat.service";
import type {
  PollCreatePayload,
  PollVotePayload,
  PollActivePayload,
  OptionResult,
} from "./poll.types";
import type { KickPayload } from "../student/student.types";

/* ── ACK response shapes ──────────────────────────── */

interface CreateAck {
  ok: boolean;
  payload?: PollActivePayload;
  message?: string;
}

interface VoteAck {
  ok: boolean;
  results?: OptionResult[];
  message?: string;
}

/* ── Per-socket event handlers ────────────────────── */

export function registerPollHandlers(io: Server, socket: Socket) {
  /* ── teacher:join ─────────────────────────────────── */
  socket.on(SOCKET_EVENTS.TEACHER_JOIN, async () => {
    console.log(`[poll.socket] teacher:join from ${socket.id}`);
    socket.join("teachers");

    try {
      const payload = await getActivePollState();
      console.log(
        `[poll.socket] Sending poll:active to teacher ${socket.id}, hasActivePoll=${!!payload.activePoll}`
      );
      socket.emit(SOCKET_EVENTS.POLL_ACTIVE, payload);

      // Also send current participants list
      const participants = await listActiveStudents();
      socket.emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, { participants });

      // Send chat history for the current/latest poll
      if (payload.activePoll) {
        try {
          const messages = await getMessages(payload.activePoll.pollId, 50);
          socket.emit(SOCKET_EVENTS.CHAT_HISTORY, { messages });
        } catch {
          // Chat history is non-critical
        }
      }
    } catch (err) {
      console.error("[poll.socket] Error on teacher:join:", err);
      socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
        message: "Failed to fetch active poll.",
      });
    }
  });

  /* ── poll:create (teacher only) ─────────────────── */
  socket.on(
    SOCKET_EVENTS.POLL_CREATE,
    async (payload: PollCreatePayload, ack?: (response: CreateAck) => void) => {
      console.log(
        `[poll.socket] poll:create from ${socket.id}`,
        JSON.stringify(payload)
      );

      try {
        const result = await createPoll(payload);

        if (!result.ok) {
          console.log(`[poll.socket] poll:create FAILED: ${result.message}`);
          socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
            message: result.message,
          });
          if (typeof ack === "function") {
            ack({ ok: false, message: result.message });
          }
          return;
        }

        console.log(
          `[poll.socket] poll:create SUCCESS, pollId=${result.data.activePoll?.pollId}`
        );

        // Broadcast to ALL connected clients
        io.emit(SOCKET_EVENTS.POLL_ACTIVE, result.data);

        // ACK back to the teacher
        if (typeof ack === "function") {
          ack({ ok: true, payload: result.data });
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to create poll.";
        console.error("[poll.socket] poll:create error:", err);
        socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message: msg });
        if (typeof ack === "function") ack({ ok: false, message: msg });
      }
    }
  );

  /* ── poll:vote (student) ────────────────────────── */
  socket.on(
    SOCKET_EVENTS.POLL_VOTE,
    async (payload: PollVotePayload, ack?: (response: VoteAck) => void) => {
      console.log(
        `[poll.socket] poll:vote from ${socket.id}`,
        JSON.stringify(payload)
      );

      try {
        // Check if student is kicked before allowing vote
        const kicked = await isKicked(payload.studentKey);
        if (kicked) {
          const kickMsg = "You have been removed by the teacher.";
          socket.emit(SOCKET_EVENTS.STUDENT_KICKED, { reason: kickMsg });
          if (typeof ack === "function") ack({ ok: false, message: kickMsg });
          setTimeout(() => socket.disconnect(true), 200);
          return;
        }

        const result = await vote({
          pollId: payload.pollId,
          studentKey: payload.studentKey,
          studentName: payload.studentName,
          optionId: payload.optionId,
        });

        if (!result.ok) {
          console.log(`[poll.socket] poll:vote FAILED: ${result.message}`);
          socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
            message: result.message,
          });
          if (typeof ack === "function") {
            ack({ ok: false, message: result.message });
          }
          return;
        }

        console.log(
          `[poll.socket] poll:vote SUCCESS, broadcasting poll:update`
        );
        // Broadcast updated results to everyone
        io.emit(SOCKET_EVENTS.POLL_UPDATE, result.data);

        // ACK back to the voter
        if (typeof ack === "function") {
          ack({ ok: true, results: result.data.results });
        }

        // If poll ended early (all eligible voted), broadcast poll:active
        if (result.earlyEnded) {
          console.log(`[poll.socket] Poll ended early — broadcasting poll:active`);
          const endedState = await getActivePollState();
          io.emit(SOCKET_EVENTS.POLL_ACTIVE, endedState);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Vote failed.";
        console.error("[poll.socket] poll:vote error:", err);
        socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message: msg });
        if (typeof ack === "function") ack({ ok: false, message: msg });
      }
    }
  );

  /* ── teacher:kick ────────────────────────────────── */
  socket.on(SOCKET_EVENTS.TEACHER_KICK, async (payload: KickPayload) => {
    console.log(
      `[poll.socket] teacher:kick from ${socket.id}`,
      JSON.stringify(payload)
    );

    try {
      // Find the student's socket id before kicking
      const studentSocketId = getSocketId(payload.studentKey);

      // Kick in DB
      await kickStudent(payload.studentKey);

      // Emit kicked event to the student's socket and disconnect it
      if (studentSocketId) {
        const studentSocket = io.sockets.sockets.get(studentSocketId);
        if (studentSocket) {
          studentSocket.emit(SOCKET_EVENTS.STUDENT_KICKED, {
            reason: "You have been removed by the teacher.",
          });
          // Give the client a moment to receive the event before disconnecting
          setTimeout(() => studentSocket.disconnect(true), 200);
        }
      }

      // Broadcast updated participants list to ALL clients (teachers + students)
      const participants = await listActiveStudents();
      io.emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, { participants });

      console.log(`[poll.socket] Student ${payload.studentKey} kicked successfully`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to kick student.";
      console.error("[poll.socket] teacher:kick error:", err);
      socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, { message: msg });
    }
  });
}

/**
 * One-time setup: register the auto-end callback so
 * when a poll timer expires the service can broadcast.
 */
export function initPollSocketCallbacks(io: Server) {
  setOnPollEnd(async (pollId: string) => {
    try {
      const payload = await getActivePollState();
      console.log(
        `[poll.socket] Poll ${pollId} auto-ended, broadcasting poll:active (status=${payload.activePoll?.status ?? "ended"})`
      );
      io.emit(SOCKET_EVENTS.POLL_ACTIVE, payload);
    } catch (err) {
      console.error("[poll.socket] Error broadcasting poll end:", err);
    }
  });
}
