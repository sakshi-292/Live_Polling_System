import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PollOptionsList from "../components/poll/PollOptionsList";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import ChatParticipantsPanel from "../components/chat/ChatParticipantsPanel";
import { useSocket } from "../hooks/useSocket";
import { useActivePoll } from "../hooks/useActivePoll";
import { useParticipants } from "../hooks/useParticipants";
import { useStudentSession } from "../hooks/useStudentSession";
import { useKickListener } from "../hooks/useKickListener";
import { useSocketErrors } from "../hooks/useSocketErrors";
import { usePollTimer } from "../hooks/usePollTimer";
import { SOCKET_EVENTS } from "../types/socketEvents";

export default function StudentResults() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { socket } = useSocket();
  const { activePoll, results, serverTime, loading } = useActivePoll(socket);
  const { participants } = useParticipants(socket);
  const { studentKey, name, hasVoted } = useStudentSession();

  // Reusable countdown timer
  const { formatted: timerStr } = usePollTimer({
    startedAt: activePoll?.startedAt ?? 0,
    durationSec: activePoll?.durationSec ?? 0,
    serverTime,
  });

  // Listen for kick event
  useKickListener(socket);

  useSocketErrors(socket);

  // Track the poll ID we arrived here for
  const arrivedForPollRef = useRef<string | null>(null);

  // On first activePoll load, capture what we arrived for (once)
  useEffect(() => {
    if (activePoll && !arrivedForPollRef.current) {
      arrivedForPollRef.current = activePoll.pollId;
      console.log(
        "[StudentResults] Captured arrivedForPollId:",
        activePoll.pollId
      );
    }
  }, [activePoll?.pollId]);

  // Re-join as student
  useEffect(() => {
    if (!socket) return;
    console.log("[StudentResults] Emitting student:join", { studentKey, name });
    socket.emit(SOCKET_EVENTS.STUDENT_JOIN, { studentKey, name });
  }, [socket, studentKey, name]);

  // If a genuinely NEW active poll appears (different pollId that we haven't voted on),
  // navigate to /student/poll so the student can answer it.
  useEffect(() => {
    if (!activePoll || activePoll.status !== "active") return;

    if (
      arrivedForPollRef.current &&
      activePoll.pollId !== arrivedForPollRef.current &&
      !hasVoted(activePoll.pollId)
    ) {
      console.log(
        "[StudentResults] New poll detected:",
        activePoll.pollId,
        "navigating to /student/poll"
      );
      navigate("/student/poll");
    }
  }, [activePoll?.pollId, activePoll?.status, hasVoted, navigate]);

  // Only show spinner during initial fetch
  if (loading && !activePoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // No poll data at all
  if (!activePoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">No poll data available.</p>
      </div>
    );
  }

  const isEnded = activePoll.status === "ended";

  return (
    <div className="min-h-screen bg-white font-sora p-8">
      <div style={{ maxWidth: 727, margin: "0 auto" }}>
        {/* Header — flow:horizontal, hug(241×29), gap:35 */}
        <div className="flex items-center mb-4" style={{ gap: 35 }}>
          <h2 className="text-lg font-bold text-black">Question 1</h2>
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

        {/* Question Card — 727px, hug, r9, 1px #AF8FF1, gap 14 */}
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

        {/* Wait text — width:737, height:30 */}
        <p
          className="text-center text-black font-sora font-semibold"
          style={{ fontSize: 24, width: 737, maxWidth: "100%", marginTop: 24, lineHeight: "30px" }}
        >
          Wait for the teacher to ask a new question..
        </p>
      </div>

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
