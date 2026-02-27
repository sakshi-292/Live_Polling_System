import { Router, Request, Response } from "express";
import { listActiveStudents } from "./student.service";
import { dbState } from "../../config/db";

const router = Router();

/**
 * GET /api/students/participants
 * Returns list of active (non-kicked) students.
 */
router.get("/participants", async (_req: Request, res: Response) => {
  if (!dbState.healthy) {
    return res
      .status(503)
      .json({ message: "Database unavailable. Please try again." });
  }

  try {
    const participants = await listActiveStudents();
    res.status(200).json({ participants });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error.";
    console.error("[student.controller] Error fetching participants:", msg);
    res.status(500).json({ message: msg });
  }
});

export default router;
