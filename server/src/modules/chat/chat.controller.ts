import { Router, Request, Response } from "express";
import { getMessages } from "./chat.service";
import { dbState } from "../../config/db";

const router = Router();

/**
 * GET /api/chat?pollId=...
 * Returns last 50 chat messages for a given pollId.
 */
router.get("/", async (req: Request, res: Response) => {
  const pollId = req.query.pollId as string | undefined;

  if (!pollId) {
    return res.status(400).json({ message: "pollId query parameter is required." });
  }

  if (!dbState.healthy) {
    return res.status(503).json({ message: "Database unavailable. Please try again." });
  }

  try {
    const messages = await getMessages(pollId, 50);
    res.status(200).json({ messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error.";
    console.error("[chat.controller] Error fetching chat messages:", msg);
    res.status(500).json({ message: msg });
  }
});

export default router;
