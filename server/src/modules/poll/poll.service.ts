import mongoose from "mongoose";
import { nanoid } from "nanoid";
import PollModel, { type IPollOption } from "./poll.model";
import VoteModel from "../vote/vote.model";
import { dbState } from "../../config/db";
import { getActiveStudentKeys } from "../student/student.service";
import type {
  PollActivePayload,
  PollCreatePayload,
  PollUpdatePayload,
  PollHistoryItem,
  OptionResult,
} from "./poll.types";

/* ── Timer for auto-ending active poll ────────────── */

let activePollTimer: ReturnType<typeof setTimeout> | null = null;
let onPollEnd: ((pollId: string) => void | Promise<void>) | null = null;

export function setOnPollEnd(cb: (pollId: string) => void | Promise<void>) {
  onPollEnd = cb;
}

/* ── Helpers ──────────────────────────────────────── */

function assertDbHealthy(): void {
  if (!dbState.healthy) {
    throw new Error("Database unavailable. Please try again.");
  }
}

async function computeResults(
  pollId: string,
  options: IPollOption[]
): Promise<OptionResult[]> {
  const voteCounts = await VoteModel.aggregate<{ _id: string; count: number }>([
    { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
    { $group: { _id: "$optionId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  let totalVotes = 0;

  for (const vc of voteCounts) {
    countMap.set(vc._id, vc.count);
    totalVotes += vc.count;
  }

  return options.map((opt) => {
    const count = countMap.get(opt.id) ?? 0;
    return {
      optionId: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
      count,
      percent: totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0,
    };
  });
}

/**
 * Check if all eligible students have voted on this poll.
 * If yes, end the poll early.
 * Returns true if poll was ended early.
 */
async function checkEarlyEnd(pollId: string): Promise<boolean> {
  const poll = await PollModel.findById(pollId);
  if (!poll || poll.status !== "active") return false;

  const eligible = poll.eligibleStudentKeys;
  if (!eligible || eligible.length === 0) return false;

  // Count distinct studentKeys who voted
  const answeredKeys = await VoteModel.distinct("studentKey", {
    pollId: new mongoose.Types.ObjectId(pollId),
  });

  if (answeredKeys.length >= eligible.length) {
    console.log(
      `[PollService] All ${eligible.length} eligible students answered → ending poll early`
    );
    await endPoll(pollId);
    if (onPollEnd) await onPollEnd(pollId);
    return true;
  }

  return false;
}

/* ── Public API ───────────────────────────────────── */

/**
 * Returns the current active poll state (or the most recently ended poll).
 * Also auto-ends expired polls.
 * This ensures results pages still have data after a poll ends.
 */
export async function getActivePollState(): Promise<PollActivePayload> {
  assertDbHealthy();

  // 1) Try to find an active poll
  let poll = await PollModel.findOne({ status: "active" }).sort({
    startedAt: -1,
  });

  if (poll) {
    // Check expiry — enforce even without timer (handles server restarts)
    const elapsedSec = Math.floor(
      (Date.now() - poll.startedAt.getTime()) / 1000
    );

    if (elapsedSec >= poll.durationSec) {
      await endPoll(poll._id.toString());
      poll.status = "ended";
    }
  }

  // 2) If no active poll, find the most recently ended poll for context
  //    (so results pages don't lose data when the timer expires)
  if (!poll) {
    poll = await PollModel.findOne({ status: "ended" }).sort({
      endedAt: -1,
    });
  }

  // 3) Still nothing? Return null
  if (!poll) {
    return { activePoll: null, serverTime: Date.now(), results: [] };
  }

  const results = await computeResults(poll._id.toString(), poll.options);

  return {
    activePoll: {
      pollId: poll._id.toString(),
      question: poll.question,
      options: poll.options.map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect,
      })),
      durationSec: poll.durationSec,
      startedAt: poll.startedAt.getTime(),
      status: poll.status,
    },
    serverTime: Date.now(),
    results,
  };
}

/**
 * Create a new poll. Rejects if an active one already exists.
 * Snapshots eligible student keys at creation time.
 */
export async function createPoll(
  payload: PollCreatePayload
): Promise<
  { ok: true; data: PollActivePayload } | { ok: false; message: string }
> {
  assertDbHealthy();

  // Check for existing active poll
  const existing = await PollModel.findOne({ status: "active" });
  if (existing) {
    const elapsedSec = Math.floor(
      (Date.now() - existing.startedAt.getTime()) / 1000
    );
    if (elapsedSec < existing.durationSec) {
      return { ok: false, message: "An active poll is already running." };
    }
    // It's expired — end it
    await endPoll(existing._id.toString());
  }

  // Build options (filter empties, generate nanoid, mark correct)
  const options: IPollOption[] = payload.options
    .filter((text) => text.trim() !== "")
    .map((text, i) => ({
      id: nanoid(10),
      text: text.trim(),
      isCorrect: payload.correctOptionIndex === i,
    }));

  if (options.length < 2) {
    return { ok: false, message: "At least 2 non-empty options required." };
  }

  // Snapshot current active students as eligible for this poll
  let eligibleStudentKeys: string[] = [];
  try {
    eligibleStudentKeys = await getActiveStudentKeys();
  } catch {
    // If student service fails, create poll without eligibility (no early end)
    console.warn("[PollService] Could not fetch active students for eligibility snapshot");
  }

  const poll = await PollModel.create({
    question: payload.question,
    options,
    durationSec: payload.durationSec,
    startedAt: new Date(),
    status: "active",
    eligibleStudentKeys,
  });

  console.log(
    `[PollService] Poll created with ${eligibleStudentKeys.length} eligible students`
  );

  // Clear any previous timer
  if (activePollTimer) {
    clearTimeout(activePollTimer);
    activePollTimer = null;
  }

  // Schedule auto-end
  const pollId = poll._id.toString();
  activePollTimer = setTimeout(async () => {
    try {
      await endPoll(pollId);
      if (onPollEnd) await onPollEnd(pollId);
    } catch (err) {
      console.error("[PollService] Error in auto-end timer:", err);
    }
  }, payload.durationSec * 1000);

  const state = await getActivePollState();
  return { ok: true, data: state };
}

/**
 * Record a student's vote.
 * Unique index on (pollId, studentKey) enforces one vote per student.
 * After recording, checks if all eligible students have answered → early end.
 */
export async function vote(payload: {
  pollId: string;
  studentKey: string;
  studentName: string;
  optionId: string;
}): Promise<
  { ok: true; data: PollUpdatePayload; earlyEnded: boolean } | { ok: false; message: string }
> {
  assertDbHealthy();

  const poll = await PollModel.findById(payload.pollId);
  if (!poll) {
    return { ok: false, message: "Poll not found." };
  }

  if (poll.status !== "active") {
    return { ok: false, message: "This poll has already ended." };
  }

  // Check expiry
  const elapsedSec = Math.floor(
    (Date.now() - poll.startedAt.getTime()) / 1000
  );
  if (elapsedSec >= poll.durationSec) {
    await endPoll(poll._id.toString());
    return { ok: false, message: "This poll has ended." };
  }

  // Validate optionId
  const optionExists = poll.options.some((o) => o.id === payload.optionId);
  if (!optionExists) {
    return { ok: false, message: "Invalid option." };
  }

  // Insert vote — unique index catches duplicates
  try {
    await VoteModel.create({
      pollId: poll._id,
      studentKey: payload.studentKey,
      studentName: payload.studentName,
      optionId: payload.optionId,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return {
        ok: false,
        message: "You already voted for this question.",
      };
    }
    throw err; // re-throw unexpected errors
  }

  const results = await computeResults(poll._id.toString(), poll.options);

  // Check if all eligible students have voted → early end
  const earlyEnded = await checkEarlyEnd(poll._id.toString());

  return {
    ok: true,
    data: { pollId: poll._id.toString(), results },
    earlyEnded,
  };
}

/**
 * Add a student to the active poll's eligibleStudentKeys if not already present.
 * Called when a student joins mid-poll so the early-end check waits for them.
 */
export async function addEligibleStudent(studentKey: string): Promise<void> {
  try {
    const result = await PollModel.findOneAndUpdate(
      { status: "active", eligibleStudentKeys: { $ne: studentKey } },
      { $addToSet: { eligibleStudentKeys: studentKey } }
    );
    if (result) {
      console.log(
        `[PollService] Added ${studentKey} to eligibleStudentKeys (now ${result.eligibleStudentKeys.length + 1})`
      );
    }
  } catch (err) {
    console.warn("[PollService] Failed to add eligible student:", err);
  }
}

/**
 * Mark a poll as ended (idempotent).
 */
export async function endPoll(pollId: string): Promise<void> {
  await PollModel.updateOne(
    { _id: pollId, status: "active" },
    { $set: { status: "ended", endedAt: new Date() } }
  );

  if (activePollTimer) {
    clearTimeout(activePollTimer);
    activePollTimer = null;
  }
}

/**
 * Return list of ended polls with aggregated results.
 */
export async function getHistory(): Promise<PollHistoryItem[]> {
  assertDbHealthy();

  const polls = await PollModel.find({ status: "ended" })
    .sort({ startedAt: -1 })
    .limit(50)
    .lean();

  const history: PollHistoryItem[] = await Promise.all(
    polls.map(async (poll) => {
      const results = await computeResults(
        poll._id.toString(),
        poll.options
      );
      return {
        poll: {
          pollId: poll._id.toString(),
          question: poll.question,
          options: poll.options.map((o) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          })),
          durationSec: poll.durationSec,
          startedAt: poll.startedAt.getTime(),
          status: "ended" as const,
        },
        results,
      };
    })
  );

  return history;
}
