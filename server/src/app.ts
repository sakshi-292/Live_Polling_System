import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors";
import healthRoute from "./routes/health.route";
import pollController from "./modules/poll/poll.controller";
import studentController from "./modules/student/student.controller";
import chatController from "./modules/chat/chat.controller";

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use("/health", healthRoute);
app.use("/api/poll", pollController);
app.use("/api/students", studentController);
app.use("/api/chat", chatController);

export default app;
