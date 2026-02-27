import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../shared/socketEvents";
import {
  upsertStudent,
  setConnected,
  setDisconnected,
  listActiveStudents,
} from "./student.service";
import { getActivePollState, addEligibleStudent } from "../poll/poll.service";
import { getMessages } from "../chat/chat.service";
import type { StudentJoinPayload } from "./student.types";

export function registerStudentHandlers(io: Server, socket: Socket) {
  /* ── student:join ─────────────────────────────────── */
  socket.on(
    SOCKET_EVENTS.STUDENT_JOIN,
    async (payload: StudentJoinPayload) => {
      console.log(
        `[student.socket] student:join from ${socket.id}`,
        JSON.stringify(payload)
      );

      try {
        const { isKicked } = await upsertStudent(
          payload.studentKey,
          payload.name
        );

        if (isKicked) {
          console.log(
            `[student.socket] Student ${payload.studentKey} is KICKED — emitting student:kicked and disconnecting`
          );
          socket.emit(SOCKET_EVENTS.STUDENT_KICKED, {
            reason: "You have been removed by the teacher.",
          });
          setTimeout(() => socket.disconnect(true), 200);
          return;
        }

        // Store socket mapping
        setConnected(payload.studentKey, socket.id);
        socket.join("students");

        // Send active poll state to this student
        const pollPayload = await getActivePollState();
        console.log(
          `[student.socket] Sending poll:active to student ${socket.id}, hasActivePoll=${!!pollPayload.activePoll}`
        );
        socket.emit(SOCKET_EVENTS.POLL_ACTIVE, pollPayload);

        // If there's an active poll, add this student to eligible list
        // so the early-end check waits for them too
        if (pollPayload.activePoll?.status === "active") {
          await addEligibleStudent(payload.studentKey);
        }

        // Send chat history for the current/latest poll
        if (pollPayload.activePoll) {
          try {
            const messages = await getMessages(pollPayload.activePoll.pollId, 50);
            socket.emit(SOCKET_EVENTS.CHAT_HISTORY, { messages });
          } catch {
            // Chat history is non-critical — ignore failures
          }
        }

        // Broadcast updated participants to ALL clients (teachers + students)
        const participants = await listActiveStudents();
        io.emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, { participants });
      } catch (err) {
        console.error("[student.socket] Error on student:join:", err);
        socket.emit(SOCKET_EVENTS.ERROR_MESSAGE, {
          message: "Failed to join session.",
        });
      }
    }
  );

  /* ── disconnect ───────────────────────────────────── */
  socket.on("disconnect", async () => {
    console.log(`[student.socket] disconnect ${socket.id}`);
    const studentKey = setDisconnected(socket.id);

    if (studentKey) {
      // Broadcast updated participants to ALL clients (teachers + students)
      try {
        const participants = await listActiveStudents();
        io.emit(SOCKET_EVENTS.PARTICIPANTS_UPDATE, { participants });
      } catch {
        // DB might be down; silently ignore
      }
    }
  });
}
