import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PollOptionsList from "../components/poll/PollOptionsList";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import ChatParticipantsPanel from "../components/chat/ChatParticipantsPanel";
import { useSocket } from "../hooks/useSocket";
import { useActivePoll } from "../hooks/useActivePoll";
import { useParticipants } from "../hooks/useParticipants";
import { useSocketErrors } from "../hooks/useSocketErrors";
import { usePollTimer } from "../hooks/usePollTimer";
import { SOCKET_EVENTS } from "../types/socketEvents";

export default function TeacherResults() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { socket } = useSocket();
  const { activePoll, results, loading, serverTime } = useActivePoll(socket);
  const { participants } = useParticipants(socket);

  // Reusable countdown timer
  const { formatted: timerStr } = usePollTimer({
    startedAt: activePoll?.startedAt ?? 0,
    durationSec: activePoll?.durationSec ?? 0,
    serverTime,
  });

  useSocketErrors(socket);

  // Join as teacher (idempotent — socket is singleton so won't duplicate)
  useEffect(() => {
    if (!socket) return;
    console.log("[TeacherResults] Emitting teacher:join");
    socket.emit(SOCKET_EVENTS.TEACHER_JOIN, {});
  }, [socket]);

  useEffect(() => {
    console.log(
      "[TeacherResults] activePoll =",
      activePoll?.pollId ?? "null",
      "status =",
      activePoll?.status ?? "n/a"
    );
  }, [activePoll]);

  // Show spinner only while initial data is loading
  if (loading && !activePoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sora">
        <div className="text-center">
          <div
            className="rounded-full animate-spin mx-auto mb-4"
            style={{
              width: 57,
              height: 58,
              border: "4px solid #E8D5F5",
              borderTopColor: "#500ECE",
            }}
          />
          <p className="text-gray-500">Loading poll…</p>
        </div>
      </div>
    );
  }

  // No poll data at all (no active or ended polls in DB)
  if (!activePoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sora">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No poll data available.</p>
          <button
            onClick={() => navigate("/teacher/create")}
            className="text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8F64E1, #1D68BD)",
              width: 306,
              height: 58,
              borderRadius: 34,
            }}
          >
            + Create a new question
          </button>
        </div>
      </div>
    );
  }

  const isEnded = activePoll.status === "ended";

  return (
    <div className="min-h-screen bg-white font-sora p-8">
      <div style={{ maxWidth: 727, margin: "0 auto" }}>
        {/* ── Top bar ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-black">Question</h2>
            {isEnded ? (
              <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                Poll ended
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {timerStr}
              </span>
            )}
          </div>

          {/* ── "View Poll history" (Group 289666: 267×53, r34, solid #8F64E1) ─ */}
          <button
            onClick={() => navigate("/history")}
            className="inline-flex items-center justify-center gap-2 text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg"
            style={{
              background: "#8F64E1",
              width: 267,
              height: 53,
              borderRadius: 34,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            </svg>
            View Poll history
          </button>
        </div>

        {/* ── Question Card (Frame 427320129: 727px, hug, r9, 1px #AF8FF1, gap 14) ── */}
        <div
          className="overflow-hidden bg-white"
          style={{
            width: "100%",
            borderRadius: 9,
            border: "1px solid #AF8FF1",
          }}
        >
          <div className="text-white px-5 py-3 text-sm font-medium" style={{ background: "linear-gradient(135deg, #343434, #6E6E6E)", borderRadius: "9px 9px 0 0" }}>
            {activePoll.question}
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
            <PollOptionsList
              mode="results"
              results={results}
              options={activePoll.options}
            />
          </div>
        </div>

        {/* ── "+ Ask a new question" (Group 289665: 306×58, r34, gradient, right-aligned with card) ── */}
        <div className="flex justify-end" style={{ marginTop: 24 }}>
          <button
            onClick={() => navigate("/teacher/create")}
            className="text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8F64E1, #1D68BD)",
              width: 306,
              height: 58,
              borderRadius: 34,
            }}
          >
            + Ask a new question
          </button>
        </div>
      </div>

      {/* ── Chat (unchanged) ───────────────────────────────────── */}
      <FloatingChatButton
        onClick={() => setChatOpen(!chatOpen)}
        badgeCount={participants.length}
      />
      <ChatParticipantsPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isTeacher={true}
        myKey="teacher"
        myName="Teacher"
        pollId={activePoll?.pollId}
      />
    </div>
  );
}
