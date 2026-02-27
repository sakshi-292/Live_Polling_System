interface FloatingChatButtonProps {
  onClick: () => void;
  /** Optional badge count (e.g. number of participants) */
  badgeCount?: number;
}

export default function FloatingChatButton({
  onClick,
  badgeCount,
}: FloatingChatButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="fixed bottom-6 right-6 rounded-full shadow-lg hover:brightness-110 transition-all flex items-center justify-center z-[60] cursor-pointer"
      style={{ width: 80, height: 76, backgroundColor: "#5A66D1" }}
      aria-label="Open chat & participants"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-8 h-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>

      {/* Badge */}
      {badgeCount != null && badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white">
          {badgeCount}
        </span>
      )}
    </button>
  );
}
