import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "../components/ui/Toast";
import { SOCKET_EVENTS } from "../types/socketEvents";
import type { OptionResult } from "../types/poll";

interface VoteAck {
  ok: boolean;
  results?: OptionResult[];
  message?: string;
}

export default function StudentPoll() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [chatOpen, setChatOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useSocket();
  const { activePoll, serverTime, loading } = useActivePoll(socket);
  const { participants } = useParticipants(socket);
  const { studentKey, name, hasVoted, markVoted, unmarkVoted } =
    useStudentSession();

  const { showToast } = useToast();

  // Reusable countdown timer
  const { isEnded: timerEnded, formatted: timerStr } = usePollTimer({
    startedAt: activePoll?.startedAt ?? 0,
    durationSec: activePoll?.durationSec ?? 0,
    serverTime,
  });

  // Listen for kick event
  useKickListener(socket);

  // Wire global socket error toasts
  useSocketErrors(socket);

  // Join socket as student on mount
  useEffect(() => {
    if (!socket) return;
    console.log("[StudentPoll] Emitting student:join", { studentKey, name });
    socket.emit(SOCKET_EVENTS.STUDENT_JOIN, { studentKey, name });
  }, [socket, studentKey, name]);

  // If the student already voted on this poll, redirect to results
  useEffect(() => {
    if (activePoll && hasVoted(activePoll.pollId)) {
      console.log(
        "[StudentPoll] Already voted on this poll, redirecting to results"
      );
      navigate("/student/results", { replace: true });
    }
  }, [activePoll?.pollId, hasVoted, navigate]);

  // Navigate to results when timer reaches zero
  useEffect(() => {
    if (activePoll?.status === "active" && timerEnded) {
      navigate("/student/results");
    }
  }, [timerEnded, activePoll?.status, navigate]);

  const handleSubmit = useCallback(() => {
    if (!socket || !activePoll || !selectedOption || submitted) return;
    setError(null);

    const payload = {
      pollId: activePoll.pollId,
      studentKey,
      studentName: name,
      optionId: selectedOption, // send optionId (not index)
    };

    console.log("[StudentPoll] Emitting poll:vote with ACK", payload);
    setSubmitted(true);

    // Optimistically mark as voted in sessionStorage
    markVoted(activePoll.pollId);

    // ACK callback
    socket.emit(
      SOCKET_EVENTS.POLL_VOTE,
      payload,
      (ack: VoteAck) => {
        console.log("[StudentPoll] Vote ACK received:", ack);

        if (ack.ok) {
          navigate("/student/results");
        } else {
          // Revert optimistic mark
          unmarkVoted(activePoll.pollId);
          setSubmitted(false);
          const errMsg = ack.message || "Vote failed. Please try again.";
          setError(errMsg);
          showToast(errMsg, "error");
        }
      }
    );

    // Safety timeout: navigate even if ACK doesn't arrive
    setTimeout(() => {
      setSubmitted((prev) => {
        if (prev) {
          console.log("[StudentPoll] Vote ACK timeout, navigating anyway");
          navigate("/student/results");
        }
        return prev;
      });
    }, 3000);
  }, [
    socket,
    activePoll,
    selectedOption,
    studentKey,
    name,
    navigate,
    submitted,
    markVoted,
    unmarkVoted,
  ]);

  // If poll ended (status changed to "ended"), navigate to results
  useEffect(() => {
    if (!loading && activePoll && activePoll.status === "ended") {
      console.log("[StudentPoll] Poll status=ended, navigating to /student/results");
      navigate("/student/results", { replace: true });
    }
  }, [loading, activePoll?.status, navigate]);

  // Show spinner only during initial loading
  if (loading && !activePoll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // No active poll at all — redirect to wait
  if (!activePoll || activePoll.status === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sora p-8">
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-bold">Question 1</h2>
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
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Question Card (matching Figma: border #AF8FF1, radius 9) */}
        <div
          className="overflow-hidden bg-white mb-6"
          style={{ borderRadius: 9, border: "1px solid #AF8FF1" }}
        >
          <div className="text-white px-5 py-3 text-sm font-medium" style={{ background: "linear-gradient(135deg, #343434, #6E6E6E)", borderRadius: "9px 9px 0 0" }}>
            {activePoll.question}
          </div>
          <PollOptionsList
            mode="vote"
            voteOptions={activePoll.options.map((o) => ({
              id: o.id,
              text: o.text,
            }))}
            selectedOption={selectedOption}
            onSelect={setSelectedOption}
          />
        </div>

        {/* Submit button (gradient, right-aligned, matching Figma) */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption || submitted}
            className="text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8F64E1, #1D68BD)",
              width: 200,
              height: 54,
              borderRadius: 34,
            }}
          >
            {submitted ? "Submitting…" : "Submit"}
          </button>
        </div>
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
