import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PollOptionsList from "../components/poll/PollOptionsList";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import ChatParticipantsPanel from "../components/chat/ChatParticipantsPanel";
import { useSocket } from "../hooks/useSocket";
import { useParticipants } from "../hooks/useParticipants";
import type { PollHistoryItem } from "../types/poll";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function PollHistory() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { participants } = useParticipants(socket);
  const [chatOpen, setChatOpen] = useState(false);
  const [history, setHistory] = useState<PollHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(`${API_URL}/api/poll/history`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.message || `Server returned ${res.status}`
          );
        }
        const data: PollHistoryItem[] = await res.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sora p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl">
            View <strong className="font-bold">Poll History</strong>
          </h1>
          <button
            onClick={() => navigate("/teacher/results")}
            className="inline-flex items-center gap-2 text-white font-semibold text-sm transition-all duration-200 cursor-pointer hover:brightness-110 hover:shadow-lg"
            style={{
              background: "#8F64E1",
              paddingLeft: 20,
              paddingRight: 20,
              height: 42,
              borderRadius: 34,
            }}
          >
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
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Results
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && history.length === 0 && (
          <p className="text-center text-gray-500 py-16">
            No polls have been completed yet.
          </p>
        )}

        {/* Poll cards */}
        {!loading && !error && history.length > 0 && (
          <div className="space-y-8">
            {history.map((item, idx) => (
              <div key={item.poll.pollId}>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Question {idx + 1}
                </h3>
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                  <div className="text-white px-5 py-3 text-sm font-medium" style={{ background: "linear-gradient(135deg, #343434, #6E6E6E)", borderRadius: "9px 9px 0 0" }}>
                    {item.poll.question}
                  </div>
                  <PollOptionsList
                    mode="results"
                    results={item.results}
                    options={item.poll.options}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FloatingChatButton onClick={() => setChatOpen(!chatOpen)} badgeCount={participants.length} />
      <ChatParticipantsPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        isTeacher={true}
        myKey="teacher"
        myName="Teacher"
      />
    </div>
  );
}
