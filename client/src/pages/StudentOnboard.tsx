import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentSession } from "../hooks/useStudentSession";

export default function StudentOnboard() {
  const navigate = useNavigate();
  const { setName } = useStudentSession();
  const [inputName, setInputName] = useState("");

  const handleContinue = () => {
    if (!inputName.trim()) return;
    setName(inputName.trim());
    navigate("/student/wait");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 font-sora">
      {/* ── Badge ─────────────────────────────────────────────────── */}
      <span
        className="inline-flex items-center justify-center gap-[7px] text-white text-xs font-semibold rounded-full mb-6"
        style={{
          background: "linear-gradient(135deg, #7565D9, #4D0ACD)",
          width: 134,
          height: 31,
          borderRadius: 24,
        }}
      >
        ✦ Intervue Poll
      </span>

      {/* ── Title (Frame 2: 981×50 Hug) ──────────────────────────── */}
      <h1
        className="text-center"
        style={{ fontSize: 32, lineHeight: "50px", maxWidth: 981, marginBottom: 12 }}
      >
        Let&rsquo;s <span className="font-bold">Get Started</span>
      </h1>

      {/* ── Description (762×69, Sora 19/25, "submit your answers" SemiBold) ─ */}
      <p
        className="text-gray-500 text-center"
        style={{
          fontSize: 19,
          lineHeight: "25px",
          maxWidth: 762,
          marginBottom: 31,
        }}
      >
        If you&rsquo;re a student, you&rsquo;ll be able to{" "}
        <span className="font-semibold text-gray-700">
          submit your answers
        </span>
        , participate in live polls, and see how your responses compare with
        your classmates
      </p>

      {/* ── Name Input (Frame 427320128: 507px, gap 12px) ─────────── */}
      <div className="flex flex-col gap-[12px]" style={{ width: 507 }}>
        <label className="text-sm font-medium text-gray-700">
          Enter your Name
        </label>
        <input
          type="text"
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="Rahul Bajaj"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
        />
      </div>

      {/* ── Continue Button (Group 289665: 234×58, r34, gradient) ── */}
      <button
        onClick={handleContinue}
        disabled={!inputName.trim()}
        className="mt-8 text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
        style={{
          background: "linear-gradient(135deg, #8F64E1, #1D68BD)",
          width: 234,
          height: 58,
          borderRadius: 34,
        }}
      >
        Continue
      </button>
    </div>
  );
}
