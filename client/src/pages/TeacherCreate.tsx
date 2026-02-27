import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import ChatParticipantsPanel from "../components/chat/ChatParticipantsPanel";
import { useSocket } from "../hooks/useSocket";
import { useActivePoll } from "../hooks/useActivePoll";
import { useParticipants } from "../hooks/useParticipants";
import { useSocketErrors } from "../hooks/useSocketErrors";
import { useToast } from "../components/ui/Toast";
import { SOCKET_EVENTS } from "../types/socketEvents";
import type { PollActivePayload } from "../types/poll";

interface OptionItem {
  id: number;
  text: string;
  isCorrect: boolean;
}

interface CreateAck {
  ok: boolean;
  payload?: PollActivePayload;
  message?: string;
}

export default function TeacherCreate() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { activePoll } = useActivePoll(socket);
  const { participants } = useParticipants(socket);
  const { showToast } = useToast();

  // Wire global socket error toasts
  useSocketErrors(socket);
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [options, setOptions] = useState<OptionItem[]>([
    { id: 1, text: "", isCorrect: false },
    { id: 2, text: "", isCorrect: false },
  ]);

  // Whether there's an active poll blocking new creation
  const hasActivePoll = activePoll?.status === "active";

  // Join as teacher on mount so we receive broadcasts
  useEffect(() => {
    if (!socket) return;
    console.log("[TeacherCreate] Emitting teacher:join");
    socket.emit(SOCKET_EVENTS.TEACHER_JOIN, {});
  }, [socket]);

  const addOption = () => {
    setOptions([...options, { id: Date.now(), text: "", isCorrect: false }]);
  };

  const updateOptionText = (id: number, text: string) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  };

  const toggleCorrect = (id: number, isCorrect: boolean) => {
    setOptions(options.map((o) => (o.id === id ? { ...o, isCorrect } : o)));
  };

  const handleAsk = () => {
    if (!socket || !question.trim() || submitting) return;
    setError(null);

    const correctIdx = options.findIndex((o) => o.isCorrect);
    const payload = {
      question: question.trim(),
      options: options.map((o) => o.text),
      correctOptionIndex: correctIdx >= 0 ? correctIdx : undefined,
      durationSec: timeLimit,
    };

    console.log("[TeacherCreate] Emitting poll:create with ACK", payload);
    setSubmitting(true);

    // ACK callback — navigate only on ok: true
    socket.emit(
      SOCKET_EVENTS.POLL_CREATE,
      payload,
      (ack: CreateAck) => {
        console.log("[TeacherCreate] ACK received:", ack);
        setSubmitting(false);

        if (ack.ok) {
          navigate("/teacher/results");
        } else {
          const errMsg = ack.message || "Failed to create poll.";
          setError(errMsg);
          showToast(errMsg, "error");
        }
      }
    );

    // Safety timeout: if ACK doesn't arrive in 5s, navigate anyway
    setTimeout(() => {
      setSubmitting((prev) => {
        if (prev) {
          console.log("[TeacherCreate] ACK timeout, navigating anyway");
          navigate("/teacher/results");
          return false;
        }
        return prev;
      });
    }, 5000);
  };

  /* ── Option-circle color matching Figma (consistent purple) ──── */
  const DOT_COLOR = "#7C3AED";

  return (
    <div className="min-h-screen bg-white font-sora">
      <div className="max-w-[900px] mx-auto px-8 pt-10 pb-6">
        {/* ── Badge ─────────────────────────────────────────────── */}
        <span
          className="inline-flex items-center justify-center gap-[7px] text-white text-xs font-semibold rounded-full mb-5"
          style={{
            background: "linear-gradient(135deg, #7565D9, #4D0ACD)",
            width: 134,
            height: 31,
            borderRadius: 24,
          }}
        >
          ✦ Intervue Poll
        </span>

        {/* ── Title + Description (Frame 2: 759×121 Hug, gap 69) ── */}
        <div style={{ maxWidth: 759, marginBottom: 24 }}>
          <h1
            className="mb-2"
            style={{ fontSize: 28, lineHeight: "36px" }}
          >
            Let&rsquo;s <span className="font-bold">Get Started</span>
          </h1>
          <p className="text-gray-500" style={{ fontSize: 15, lineHeight: "22px" }}>
            you&rsquo;ll have the ability to create and manage polls, ask
            questions, and monitor your students&rsquo; responses in real-time.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ── Question + Timer (Frame 427320128: 865×236 Hug, gap 19) ─ */}
        <div style={{ maxWidth: 865 }}>
          <div className="flex items-center justify-between mb-[19px]">
            <label className="text-sm font-semibold text-black">
              Enter your question
            </label>
            <div className="relative inline-block">
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none cursor-pointer"
              >
                <option value={30}>30 seconds</option>
                <option value={45}>45 seconds</option>
                <option value={60}>60 seconds</option>
              </select>
              {/* Purple dropdown arrow */}
              <span
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#7C3AED", fontSize: 10 }}
              >
                ▼
              </span>
            </div>
          </div>

          <div className="relative mb-8">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
              placeholder="Type your question here..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <span className="absolute bottom-2.5 right-3 text-xs text-gray-400">
              {question.length}/100
            </span>
          </div>
        </div>

        {/* ── Options + "Is it Correct?" header row ────────────── */}
        <div className="flex items-start gap-8 mb-3">
          <div style={{ width: 507 }}>
            <span
              className="font-semibold text-black"
              style={{ fontSize: 18, lineHeight: "100%" }}
            >
              Edit Options
            </span>
          </div>
          <span
            className="font-semibold text-black"
            style={{ fontSize: 18, lineHeight: "100%" }}
          >
            Is it Correct?
          </span>
        </div>

        {/* ── Option rows ──────────────────────────────────────── */}
        <div className="flex flex-col gap-[12px] mb-4">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-4">
              {/* Numbered circle */}
              <span
                className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0 font-semibold"
                style={{ background: DOT_COLOR }}
              >
                {idx + 1}
              </span>

              {/* Option input (fills 507px area minus circle) */}
              <input
                type="text"
                value={opt.text}
                onChange={(e) => updateOptionText(opt.id, e.target.value)}
                placeholder={`Option ${idx + 1}`}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                style={{ width: 460 }}
              />

              {/* Yes / No radios */}
              <div className="flex items-center gap-[17px] text-sm flex-shrink-0">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`correct-${opt.id}`}
                    checked={opt.isCorrect}
                    onChange={() => toggleCorrect(opt.id, true)}
                    className="accent-green-600"
                  />
                  <span className="text-green-600 font-medium">Yes</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`correct-${opt.id}`}
                    checked={!opt.isCorrect}
                    onChange={() => toggleCorrect(opt.id, false)}
                    className="accent-purple-600"
                  />
                  <span className={!opt.isCorrect ? "text-black font-medium" : "text-gray-500"}>No</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* ── "+ Add More option" (169×45, r11, border 1px #7451B6) ─ */}
        <button
          onClick={addOption}
          className="cursor-pointer transition-colors hover:bg-purple-50"
          style={{
            width: 169,
            height: 45,
            borderRadius: 11,
            border: "1px solid #7451B6",
            padding: 10,
            fontSize: 14,
            color: "#7451B6",
            fontWeight: 500,
            background: "transparent",
          }}
        >
          + Add More option
        </button>
      </div>

      {/* ── Separator line (Line 229: full-width, 1px #B6B6B6) ──── */}
      <div
        className="w-full mt-6"
        style={{ borderTop: "1px solid #B6B6B6" }}
      />

      {/* ── Bottom bar with "Ask Question" button ──────────────── */}
      <div className="max-w-[900px] mx-auto px-8 py-4">
        {/* Active poll warning */}
        {hasActivePoll && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            A poll is currently active. You can ask a new question once the
            current poll ends.
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleAsk}
            disabled={submitting || hasActivePoll}
            className="text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
            style={{
              background: "linear-gradient(135deg, #8F64E1, #1D68BD)",
              width: 234,
              height: 58,
              borderRadius: 34,
            }}
          >
            {submitting ? "Creating…" : "Ask Question"}
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
