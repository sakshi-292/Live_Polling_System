import StudentModel from "./student.model";
import { dbState } from "../../config/db";
import type { ParticipantInfo } from "./student.types";

/* ── In-memory socket mapping ─────────────────────── */
// studentKey -> socketId (for currently connected sockets)
const connectedSockets = new Map<string, string>();

/* ── Helpers ──────────────────────────────────────── */

function assertDbHealthy(): void {
  if (!dbState.healthy) {
    throw new Error("Database unavailable. Please try again.");
  }
}

/* ── Public API ───────────────────────────────────── */

/**
 * Create or update student. If student was kicked, preserve kicked status.
 * Returns { isKicked: boolean } so caller can act accordingly.
 *
 * Uses atomic findOneAndUpdate + upsert to avoid E11000 duplicate key
 * errors when student:join fires twice concurrently (React strict mode,
 * page navigations, socket reconnects).
 */
export async function upsertStudent(
  studentKey: string,
  name: string
): Promise<{ isKicked: boolean }> {
  assertDbHealthy();

  const student = await StudentModel.findOneAndUpdate(
    { studentKey },
    {
      $set: { name, lastSeenAt: new Date() },
      $setOnInsert: { status: "active" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return { isKicked: student.status === "kicked" };
}

/**
 * Store the socket id for a connected student.
 */
export function setConnected(studentKey: string, socketId: string): void {
  connectedSockets.set(studentKey, socketId);
}

/**
 * Remove the socket mapping for a student (on disconnect).
 * Returns the studentKey that was disconnected, or null if not found.
 */
export function setDisconnected(socketId: string): string | null {
  for (const [key, sid] of connectedSockets) {
    if (sid === socketId) {
      connectedSockets.delete(key);
      return key;
    }
  }
  return null;
}

/**
 * Get the socket id for a connected student.
 */
export function getSocketId(studentKey: string): string | undefined {
  return connectedSockets.get(studentKey);
}

/**
 * Kick a student — set status to "kicked" in DB.
 */
export async function kickStudent(studentKey: string): Promise<void> {
  assertDbHealthy();

  await StudentModel.updateOne(
    { studentKey },
    { $set: { status: "kicked", kickedAt: new Date() } }
  );

  // Remove from connected sockets
  connectedSockets.delete(studentKey);
}

/**
 * Check if a student is kicked.
 */
export async function isKicked(studentKey: string): Promise<boolean> {
  assertDbHealthy();

  const student = await StudentModel.findOne({ studentKey });
  return student?.status === "kicked";
}

/**
 * Return all active (non-kicked) students, sorted by lastSeenAt desc.
 */
export async function listActiveStudents(): Promise<ParticipantInfo[]> {
  assertDbHealthy();

  const students = await StudentModel.find({ status: "active" })
    .sort({ lastSeenAt: -1 })
    .lean();

  return students.map((s) => ({
    studentKey: s.studentKey,
    name: s.name,
    lastSeenAt: s.lastSeenAt.getTime(),
  }));
}

/**
 * Return all active student keys (for poll eligibility snapshot).
 */
export async function getActiveStudentKeys(): Promise<string[]> {
  assertDbHealthy();

  const students = await StudentModel.find({ status: "active" })
    .select("studentKey")
    .lean();

  return students.map((s) => s.studentKey);
}
