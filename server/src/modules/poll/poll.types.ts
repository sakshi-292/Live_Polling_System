/* ── Poll Types ─────────────────────────────────────── */

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
  startedAt: number; // epoch ms
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

export interface PollCreatePayload {
  question: string;
  options: string[];
  correctOptionIndex?: number;
  durationSec: number;
}

export interface PollVotePayload {
  pollId: string;
  studentKey: string;
  studentName: string;
  optionId: string;
}

export interface PollHistoryItem {
  poll: ActivePoll;
  results: OptionResult[];
}
