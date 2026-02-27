/* ── Socket Event Constants (mirrors server) ───────── */

export const SOCKET_EVENTS = {
  // Client → Server
  STUDENT_JOIN: "student:join",
  TEACHER_JOIN: "teacher:join",
  POLL_CREATE: "poll:create",
  POLL_VOTE: "poll:vote",
  TEACHER_KICK: "teacher:kick",
  CHAT_SEND: "chat:send",
  CHAT_CLEAR: "chat:clear",
  CHAT_TYPING: "chat:typing",

  // Server → Client
  POLL_ACTIVE: "poll:active",
  POLL_UPDATE: "poll:update",
  PARTICIPANTS_UPDATE: "participants:update",
  STUDENT_KICKED: "student:kicked",
  CHAT_NEW: "chat:new",
  CHAT_HISTORY: "chat:history",
  CHAT_CLEARED: "chat:cleared",
  CHAT_TYPING_UPDATE: "chat:typing:update",
  ERROR_MESSAGE: "error:message",
} as const;
