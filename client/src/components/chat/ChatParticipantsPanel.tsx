import { useState, useRef, useEffect } from "react";
import Tabs from "../ui/Tabs";
import { useSocket } from "../../hooks/useSocket";
import { useParticipants } from "../../hooks/useParticipants";
import { useChat } from "../../hooks/useChat";
import { useToast } from "../ui/Toast";
import { SOCKET_EVENTS } from "../../types/socketEvents";

interface ChatParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacher: boolean;
  /** The current user's key (studentKey or "teacher") */
  myKey: string;
  /** The current user's display name */
  myName: string;
  /** Current poll ID for linking messages */
  pollId?: string;
}

export default function ChatParticipantsPanel({
  isOpen,
  onClose,
  isTeacher,
  myKey,
  myName,
  pollId,
}: ChatParticipantsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { socket } = useSocket();
  const { participants } = useParticipants(socket);
  const { messages, sendMessage, clearChat } = useChat(socket, myKey, myName, pollId);
  const { showToast } = useToast();
  const [kickingKey, setKickingKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && activeTab === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen, activeTab]);

  if (!isOpen) return null;

  const handleKick = (studentKey: string) => {
    if (!socket || kickingKey) return;

    setKickingKey(studentKey);
    socket.emit(SOCKET_EVENTS.TEACHER_KICK, { studentKey });
    setTimeout(() => setKickingKey(null), 2000);
  };

  const handleSendChat = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.length > 300) {
      showToast("Message must be 300 characters or fewer.", "warning");
      return;
    }

    sendMessage(trimmed);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 z-[65] bg-black/20 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Panel */}
      <div
        className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[70] overflow-hidden flex flex-col"
        style={{ maxHeight: "min(480px, calc(100vh - 140px))" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">
            {isTeacher ? "Classroom" : "Session"}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Close panel"
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
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 pt-1 flex-shrink-0">
          <Tabs
            tabs={[
              "Chat",
              `Participants${participants.length > 0 ? ` (${participants.length})` : ""}`,
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {activeTab === 0 ? (
          /* ── Chat Tab ─────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.fromKey === myKey;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg text-sm text-white ${
                          isSelf
                            ? "rounded-br-none"
                            : "rounded-bl-none"
                        } ${msg._status === "failed" ? "opacity-50" : ""}`}
                        style={{ backgroundColor: isSelf ? "#8F64E1" : "#3A3A3B" }}
                      >
                        {!isSelf && (
                          <p className="text-xs font-medium text-gray-300 mb-0.5">
                            {msg.fromName}
                          </p>
                        )}
                        {msg.text}
                        {msg._status === "failed" && (
                          <p className="text-[10px] mt-0.5 opacity-70">
                            Failed to send
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="flex-shrink-0 border-t border-gray-100 px-3 py-2 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                maxLength={300}
                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {/* Clear Chat — teacher only, inside input bar */}
              {isTeacher && messages.length > 0 && (
                <button
                  onClick={() => clearChat()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  style={{ backgroundColor: "#3A3A3B" }}
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSendChat}
                disabled={!inputText.trim()}
                className="w-8 h-8 flex items-center justify-center text-white rounded-lg transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
                style={{ backgroundColor: "#8F64E1" }}
                aria-label="Send"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          /* ── Participants Tab ─────────────── */
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {participants.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No students connected yet.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Name</th>
                    {isTeacher && (
                      <th className="pb-2 font-medium text-right" />
                    )}
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr
                      key={p.studentKey}
                      className="border-b border-gray-50"
                    >
                      <td className="py-2.5 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                          {p.name}
                        </div>
                      </td>
                      {isTeacher && (
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleKick(p.studentKey)}
                            disabled={kickingKey === p.studentKey}
                            className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {kickingKey === p.studentKey
                              ? "Kicking…"
                              : "Kick out"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </>
  );
}
