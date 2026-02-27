/* ── Chat Types ────────────────────────────────────── */

/** Client → Server payload for chat:send */
export interface ChatSendPayload {
  studentKey: string;
  name: string;
  text: string;
  pollId?: string;
}

/** Server → Client payload for chat:new */
export interface ChatMessage {
  id: string;
  fromKey: string;
  fromName: string;
  text: string;
  ts: number; // epoch ms
  pollId?: string;
}

/** Server → Client payload for chat:history */
export interface ChatHistoryPayload {
  messages: ChatMessage[];
}

/** ACK for chat:send */
export interface ChatSendAck {
  ok: boolean;
  message?: string;
}
