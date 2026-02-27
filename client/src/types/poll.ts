/* ── Shared Poll Types (mirrors server) ────────────── */

export interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export type PollStatus = "active" | "ended";

export interface ActivePoll {
  pollId: string;
  question: string;
  options: PollOption[];
  durationSec: number;
  startedAt: number;
  status: PollStatus;
}

export interface OptionResult {
  optionId: string;
  text: string;
  isCorrect: boolean;
  count: number;
  percent: number;
}

export interface PollActivePayload {
  activePoll: ActivePoll | null;
  serverTime: number;
  results: OptionResult[];
}

export interface PollUpdatePayload {
  pollId: string;
  results: OptionResult[];
}

export interface PollHistoryItem {
  poll: ActivePoll;
  results: OptionResult[];
}
