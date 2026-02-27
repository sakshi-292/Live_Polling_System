interface ResultOptionRowProps {
  index: number;
  text: string;
  percentage: number;
  isCorrect: boolean;
  /** The optionId of this row (needed for student chosen comparison) */
  optionId?: string;
  /** The optionId the student chose — pass only on student results page */
  studentChosenId?: string | null;
  /** Number of votes for this option */
  count?: number;
}

export default function ResultOptionRow({
  index,
  text,
  percentage,
  isCorrect,
  optionId,
  studentChosenId,
  count,
}: ResultOptionRowProps) {
  // Determine border color based on student's choice (student view only)
  const isStudentView = studentChosenId !== undefined && studentChosenId !== null;
  const isChosen = isStudentView && optionId === studentChosenId;

  let borderStyle: React.CSSProperties | undefined;
  if (isStudentView) {
    if (isCorrect) {
      // Correct option → green border + light green background
      borderStyle = { border: "2px solid #22C55E", backgroundColor: "#F0FDF4" };
    } else if (isChosen) {
      // Student chose this but it's wrong → red border + light red background
      borderStyle = { border: "2px solid #EF4444", backgroundColor: "#FEF2F2" };
    }
  } else {
    // Teacher view — purple border for correct
    if (isCorrect) {
      borderStyle = { border: "2px solid #8F64E1" };
    }
  }

  // Shake animation: chosen option shakes (whether correct or incorrect)
  const shouldShake = isChosen;

  return (
    <div
      className="flex items-center gap-3 mb-2"
      style={shouldShake ? { animation: "shakeOnce 0.5s ease-in-out 0.3s" } : undefined}
    >
      {/* Bar container */}
      <div
        className="flex-1 relative h-12 rounded-lg bg-gray-100 overflow-hidden"
        style={borderStyle}
      >
        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out"
          style={{ backgroundColor: "#5767D0", width: `${percentage}%` }}
        />

        {/* Content overlay */}
        <div className="relative flex items-center h-full px-3 gap-2.5">
          {/* Numbered badge — always white circle with dark text */}
          <span className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 bg-white border border-gray-300 text-gray-800">
            {index + 1}
          </span>
          {/* Option text */}
          <span className="text-sm font-medium text-gray-800 truncate flex-1">
            {text}
          </span>
          {/* Vote count — right side, light grey */}
          {count !== undefined && (
            <span className="text-xs font-medium flex-shrink-0" style={{ color: "#9CA3AF" }}>
              {count} {count === 1 ? "vote" : "votes"}
            </span>
          )}
        </div>
      </div>

      {/* Percentage */}
      <span className="text-sm font-semibold text-gray-700 w-12 text-right flex-shrink-0">
        {percentage}%
      </span>
    </div>
  );
}
