import http from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app";
import { ENV } from "./config/env";
import { connectMongo } from "./config/db";
import {
  registerPollHandlers,
  initPollSocketCallbacks,
} from "./modules/poll/poll.socket";
import { registerStudentHandlers } from "./modules/student/student.socket";
import { registerChatHandlers } from "./modules/chat/chat.socket";

const { PORT, NODE_ENV, CLIENT_URL } = ENV;

// ── HTTP server ────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.io server ───────────────────────────────────
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Register the auto-end broadcast callback once
initPollSocketCallbacks(io);

// ── Socket connection handler ──────────────────────────
io.on("connection", (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  registerPollHandlers(io, socket);
  registerStudentHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ── Graceful EADDRINUSE handling ───────────────────────
server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error(`   Run: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   Then restart the server.`);
    process.exit(1);
  }
  throw err;
});

// ── Start (attempt MongoDB first, but don't block) ─────
async function start() {
  // Attempt MongoDB — server starts regardless
  await connectMongo();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`🔌 Socket.io ready, allowing origin: ${CLIENT_URL}`);
  });
}

start();
