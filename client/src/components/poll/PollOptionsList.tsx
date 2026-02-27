import type { OptionResult, PollOption } from "../../types/poll";
import ResultOptionRow from "./ResultOptionRow";

/* Colored dots removed — now using numbered circles per Figma */

interface VoteOption {
  id: string;
  text: string;
}

interface PollOptionsListProps {
  mode: "vote" | "results";
  // vote mode
  voteOptions?: VoteOption[];
  selectedOption?: string;
  onSelect?: (optionId: string) => void;
  // results mode
  results?: OptionResult[];
  options?: PollOption[];
  /** Pass only on student results page to highlight correct/incorrect choices */
  studentChosenId?: string | null;
}

export default function PollOptionsList({
  mode,
  voteOptions,
  selectedOption,
  onSelect,
  results,
  options,
  studentChosenId,
}: PollOptionsListProps) {
  if (mode === "results") {
    // Build result rows using options + results data
    const optionsList = options ?? [];
    const resultRows = optionsList.map((opt, idx) => {
      const resultData = results?.find((r) => r.optionId === opt.id);
      return {
        id: opt.id,
        index: idx,
        text: opt.text,
        isCorrect: opt.isCorrect,
        percent: resultData?.percent ?? 0,
        count: resultData?.count ?? 0,
      };
    });

    // If no options passed, fall back to raw results (backward compat)
    const rows =
      resultRows.length > 0
        ? resultRows
        : (results ?? []).map((r, idx) => ({
            id: r.optionId,
            index: idx,
            text: r.text,
            isCorrect: r.isCorrect,
            percent: r.percent,
            count: r.count,
          }));

    return (
      <div className="px-5 py-4 space-y-1">
        {rows.map((r) => (
          <ResultOptionRow
            key={r.id}
            index={r.index}
            text={r.text}
            percentage={r.percent}
            isCorrect={r.isCorrect}
            optionId={r.id}
            studentChosenId={studentChosenId}
            count={r.count}
          />
        ))}
      </div>
    );
  }

  /* vote mode */
  return (
    <div className="space-y-3 p-5">
      {(voteOptions ?? []).map((opt, idx) => {
        const isSelected = selectedOption === opt.id;
        return (
          <label
            key={opt.id}
            className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? "bg-white border-[#8F64E1]"
                : "bg-[#F4F4F4] border-transparent hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="poll-option"
              value={opt.id}
              checked={isSelected}
              onChange={() => onSelect?.(opt.id)}
              className="sr-only"
            />
            {/* Numbered circle — purple when selected, gray when not */}
            <span
              className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? "bg-[#8F64E1] text-white"
                  : "bg-[#72727E] text-white"
              }`}
            >
              {idx + 1}
            </span>
            <span className="text-sm text-gray-700">{opt.text}</span>
          </label>
        );
      })}
    </div>
  );
}
