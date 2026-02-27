import { Router, Request, Response } from "express";
import { dbState } from "../../config/db";
import { getActivePollState, getHistory, clearHistory } from "./poll.service";

const router = Router();

/**
 * GET /api/poll/active
 * Returns the current active poll (or null) with results & server time.
 */
router.get("/active", async (_req: Request, res: Response) => {
  if (!dbState.healthy) {
    res.status(503).json({ message: "Database unavailable. Please try again." });
    return;
  }

  try {
    const payload = await getActivePollState();
    console.log(
      `[poll.controller] GET /api/poll/active → hasActivePoll=${!!payload.activePoll}, pollId=${payload.activePoll?.pollId ?? "none"}`
    );
    res.status(200).json(payload);
  } catch (err) {
    console.error("[poll.controller] Error in GET /active:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * GET /api/poll/history
 * Returns ended polls with aggregated results.
 */
router.get("/history", async (_req: Request, res: Response) => {
  if (!dbState.healthy) {
    res.status(503).json({ message: "Database unavailable. Please try again." });
    return;
  }

  try {
    const history = await getHistory();
    console.log(`[poll.controller] GET /api/poll/history → ${history.length} polls`);
    res.status(200).json(history);
  } catch (err) {
    console.error("[poll.controller] Error in GET /history:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

/**
 * DELETE /api/poll/history
 * Clears all ended polls and their votes.
 */
router.delete("/history", async (_req: Request, res: Response) => {
  if (!dbState.healthy) {
    res.status(503).json({ message: "Database unavailable. Please try again." });
    return;
  }

  try {
    const count = await clearHistory();
    console.log(`[poll.controller] DELETE /api/poll/history → cleared ${count} polls`);
    res.status(200).json({ message: `Cleared ${count} polls.`, count });
  } catch (err) {
    console.error("[poll.controller] Error in DELETE /history:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
