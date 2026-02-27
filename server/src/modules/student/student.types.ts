/* ── Student Types ──────────────────────────────────── */

export interface StudentJoinPayload {
  studentKey: string;
  name: string;
}

export interface ParticipantInfo {
  studentKey: string;
  name: string;
  lastSeenAt: number; // epoch ms
}

export interface KickPayload {
  studentKey: string;
}
