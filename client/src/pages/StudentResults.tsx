import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { playCelebrationSound, playSadSound, playTimesUpSound } from "../utils/celebrationSound";
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
  const { studentKey, name, hasVoted, getChosenOption } = useStudentSession();

  // Reusable countdown timer
  const { formatted: timerStr, timerColor } = usePollTimer({
    startedAt: activePoll?.startedAt ?? 0,
    durationSec: activePoll?.durationSec ?? 0,
    serverTime,
  });

  // Listen for kick event
  useKickListener(socket);

  useSocketErrors(socket);

  // Track the poll ID we arrived here for
  const arrivedForPollRef = useRef<string | null>(null);
  const feedbackFiredRef = useRef<string | null>(null);
  const [showSadEmoji, setShowSadEmoji] = useState(false);
  const [showHourglass, setShowHourglass] = useState(false);
  // "correct" | "incorrect" | null — drives the badge near the header
  const [answerFeedback, setAnswerFeedback] = useState<"correct" | "incorrect" | null>(null);

  // 🎉 / 😢 Fire confetti or sad emoji based on correctness
  useEffect(() => {
    if (!activePoll) return;
    const chosenId = getChosenOption(activePoll.pollId);
    if (!chosenId) return;
    // Only fire once per poll
    if (feedbackFiredRef.current === activePoll.pollId) return;

    const chosenOption = activePoll.options.find((o) => o.id === chosenId);
    feedbackFiredRef.current = activePoll.pollId;

    if (chosenOption?.isCorrect) {
      // ✅ Correct — confetti + sound + badge
      setAnswerFeedback("correct");
      playCelebrationSound();
      confetti({ particleCount: 80, spread: 70, origin: { x: 0.15, y: 0.6 } });
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { x: 0.85, y: 0.6 } });
      }, 150);
      setTimeout(() => {
        confetti({ particleCount: 120, spread: 100, origin: { x: 0.5, y: 0.5 } });
      }, 300);
    } else {
      // ❌ Incorrect — show sad emoji + sad sound + badge
      setAnswerFeedback("incorrect");
      playSadSound();
      setShowSadEmoji(true);
      setTimeout(() => setShowSadEmoji(false), 3000);
    }
  }, [activePoll?.pollId, activePoll?.options, getChosenOption]);

  // ⏳ Show hourglass animation when student missed the poll
  const missedFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activePoll || activePoll.status !== "ended") return;
    const chosenId = getChosenOption(activePoll.pollId);
    if (chosenId) return; // student answered, not missed
    if (missedFiredRef.current === activePoll.pollId) return;
    missedFiredRef.current = activePoll.pollId;
    playTimesUpSound();
    setShowHourglass(true);
    setTimeout(() => setShowHourglass(false), 3500);
  }, [activePoll?.pollId, activePoll?.status, getChosenOption]);

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
  const chosenOptionId = getChosenOption(activePoll.pollId);
  const didMiss = isEnded && !chosenOptionId;

  return (
    <div className="min-h-screen bg-white font-sora p-8">
      <div style={{ maxWidth: 727, margin: "0 auto" }}>
        {/* Header — flow:horizontal, hug(241×29), gap:35 */}
        <div className="flex items-center flex-wrap mb-4" style={{ gap: 15, rowGap: 10 }}>
          <h2 className="text-lg font-bold text-black">Question 1</h2>
          {isEnded ? (
            didMiss ? (
              /* Student missed — show "Missed" in red */
              <span className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-1 rounded-full" style={{ background: "#EF4444" }}>
                ⏰ Missed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-gray-500 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
                Poll ended
              </span>
            )
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: timerColor }}>
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

          {/* ✅ / ❌ / ⏰ Answer feedback badge */}
          {answerFeedback === "correct" && (
            <span
              className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-1.5 rounded-full"
              style={{ background: "#22C55E", animation: "badgePopIn 0.5s ease-out forwards" }}
            >
              Well done! 🎉
            </span>
          )}
          {answerFeedback === "incorrect" && (
            <span
              className="inline-flex items-center gap-1.5 text-gray-900 text-sm font-semibold px-4 py-1.5 rounded-full"
              style={{ background: "#FACC15", animation: "badgePopIn 0.5s ease-out forwards" }}
            >
              😢 Better luck next time!
            </span>
          )}
          {didMiss && (
            <span
              className="inline-flex items-center gap-1.5 text-black text-sm font-semibold px-4 py-1.5 rounded-full"
              style={{ background: "#FACC15", animation: "badgePopIn 0.5s ease-out forwards" }}
            >
              ⏰ Time's up! You didn't submit an answer.
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
              studentChosenId={didMiss ? "__missed__" : chosenOptionId}
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

      {/* 😢 Sad emoji overlay — glides up smoothly when answer is incorrect */}
      {showSadEmoji && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div
            style={{
              fontSize: 120,
              animation: "sadGlideUp 0.8s ease-out forwards, sadFadeOut 0.6s ease-in 2.4s forwards",
            }}
          >
            😢
          </div>
        </div>
      )}

      {/* ⏳ Hourglass overlay — bounce-in when student missed the poll */}
      {showHourglass && (
        <div
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 9999 }}
        >
          <div
            style={{
              fontSize: 120,
              animation: "hourglassBounceIn 0.9s ease-out forwards, hourglassFadeOut 0.6s ease-in 2.8s forwards",
            }}
          >
            ⏳
          </div>
        </div>
      )}

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
