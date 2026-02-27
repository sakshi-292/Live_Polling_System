interface ResultOptionRowProps {
  index: number;
  text: string;
  percentage: number;
  isCorrect: boolean;
}

export default function ResultOptionRow({
  index,
  text,
  percentage,
  isCorrect,
}: ResultOptionRowProps) {
  return (
    <div className="flex items-center gap-3 mb-2">
      {/* Bar container — purple border for correct option */}
      <div
        className="flex-1 relative h-12 rounded-lg bg-gray-100 overflow-hidden"
        style={isCorrect ? { border: "2px solid #8F64E1" } : undefined}
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
          <span className="text-sm font-medium text-gray-800 truncate">
            {text}
          </span>
        </div>
      </div>

      {/* Percentage */}
      <span className="text-sm font-semibold text-gray-700 w-12 text-right flex-shrink-0">
        {percentage}%
      </span>
    </div>
  );
}
