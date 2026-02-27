import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";

export default function Home() {
  const navigate = useNavigate();
  const { setRole } = useRole();
  const [selected, setSelected] = useState<"student" | "teacher" | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    setRole(selected);
    navigate(selected === "teacher" ? "/teacher/create" : "/student/onboard");
  };

  /* ── Helpers for Figma-accurate card styles ────────────────────── */
  const cardClasses =
    "w-[387px] min-h-[143px] text-left rounded-[10px] transition-all duration-200 cursor-pointer";

  const cardStyle = (isSelected: boolean): React.CSSProperties =>
    isSelected
      ? {
          /* Gradient border trick: white inside, gradient as border */
          background:
            "linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, #7765DA, #1D68BD) border-box",
          border: "3px solid transparent",
        }
      : {
          border: "1px solid #D9D9D9",
          background: "#fff",
        };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
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

      {/* ── Title ─────────────────────────────────────────────────── */}
      <h1 className="text-2xl text-center mb-2">
        Welcome to the{" "}
        <span className="font-bold">Live Polling System</span>
      </h1>
      <p className="text-gray-500 text-sm text-center max-w-md mb-10">
        Please select the role that best describes you to begin using the live
        polling system
      </p>

      {/* ── Role Cards ────────────────────────────────────────────── */}
      <div className="flex gap-5 mb-8">
        {/* Student */}
        <button
          onClick={() => setSelected("student")}
          className={cardClasses}
          style={cardStyle(selected === "student")}
        >
          <div className="pt-[15px] pr-[17px] pb-[15px] pl-[25px]">
            <h3 className="font-semibold text-base mb-[17px]">I'm a Student</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Participate in live polls, submit your answers in real-time, and instantly view class results.
            </p>
          </div>
        </button>

        {/* Teacher */}
        <button
          onClick={() => setSelected("teacher")}
          className={cardClasses}
          style={cardStyle(selected === "teacher")}
        >
          <div className="pt-[15px] pr-[17px] pb-[15px] pl-[25px]">
            <h3 className="font-semibold text-base mb-[17px]">I'm a Teacher</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Submit answers and view live poll results in real-time.
            </p>
          </div>
        </button>
      </div>

      {/* ── Continue Button ───────────────────────────────────────── */}
      <button
        onClick={handleContinue}
        disabled={!selected}
        className="text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
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
