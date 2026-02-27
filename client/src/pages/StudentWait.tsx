import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import ChatParticipantsPanel from "../components/chat/ChatParticipantsPanel";
import { useSocket } from "../hooks/useSocket";
import { useActivePoll } from "../hooks/useActivePoll";
import { useParticipants } from "../hooks/useParticipants";
import { useStudentSession } from "../hooks/useStudentSession";
import { useKickListener } from "../hooks/useKickListener";
import { useSocketErrors } from "../hooks/useSocketErrors";
import { SOCKET_EVENTS } from "../types/socketEvents";

export default function StudentWait() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { socket } = useSocket();
  const { activePoll } = useActivePoll(socket);
  const { participants } = useParticipants(socket);
  const { studentKey, name } = useStudentSession();

  // Listen for kick event
  useKickListener(socket);

  // Wire global socket error toasts
  useSocketErrors(socket);

  // Join as student when socket connects
  useEffect(() => {
    if (!socket) return;
    console.log("[StudentWait] Emitting student:join", { studentKey, name });
    socket.emit(SOCKET_EVENTS.STUDENT_JOIN, { studentKey, name });
  }, [socket, studentKey, name]);

  // Auto-navigate when active poll detected
  useEffect(() => {
    console.log("[StudentWait] activePoll changed →", activePoll?.pollId ?? "null", "status=", activePoll?.status ?? "n/a");
    if (activePoll && activePoll.status === "active") {
      console.log("[StudentWait] Active poll found! Navigating to /student/poll");
      navigate("/student/poll");
    }
  }, [activePoll, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 font-sora">
      {/* ── Badge ─────────────────────────────────────────────────── */}
      <span
        className="inline-flex items-center justify-center gap-[7px] text-white text-xs font-semibold rounded-full mb-8"
        style={{
          background: "linear-gradient(135deg, #7565D9, #4D0ACD)",
          width: 134,
          height: 31,
          borderRadius: 24,
        }}
      >
        ✦ Intervue Poll
      </span>

      {/* ── Spinner (Ellipse 1022: 57×58, #500ECE) ────────────────── */}
      <div
        className="rounded-full animate-spin mb-6"
        style={{
          width: 57,
          height: 58,
          border: "4px solid #E8D5F5",
          borderTopColor: "#500ECE",
          borderRadius: "50%",
        }}
      />

      {/* ── Text (Sora SemiBold 33px, #000) ───────────────────────── */}
      <p
        className="text-center font-semibold text-black"
        style={{
          fontSize: 33,
          lineHeight: "100%",
          maxWidth: 737,
        }}
      >
        Wait for the teacher to ask questions..
      </p>

      <FloatingChatButton onClick={() => setChatOpen(!chatOpen)} badgeCount={participants.length} />
      <ChatParticipantsPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isTeacher={false}
        myKey={studentKey}
        myName={name}
        pollId={activePoll?.pollId}
      />
    </div>
  );
}
