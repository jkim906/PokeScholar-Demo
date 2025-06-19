import express, { Router, Request, Response } from "express";
import { config } from "dotenv";
import { SessionService } from "../../services/sessionService";

// Load environment variables
config();

// This is the API route for handling User requests
const router = Router();
const sessionService = new SessionService();

router.use(express.json());

// Start a new session
router.post("/start", async (req: Request, res: Response): Promise<any> => {
  const userId = req.body.userId;
  const durarion = req.body.duration;
  console.log("req.body", req.body, "userId", userId, "duration", durarion);
  console.log(`Received request to start a new session for user: ${userId}`);
  try {
    const session = await sessionService.startSession(userId, durarion);
    console.log(`Successfully started a new session for user: ${userId}`);
    res.status(200).json(session);
  } catch (error: any) {
    console.error(`Error starting session for user ${userId}:`, error);
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
// Complete a session
router.post(
  "/complete/:sessionId",
  async (req: Request, res: Response): Promise<any> => {
    const { sessionId } = req.params;
    console.log(`Received request to complete session: ${sessionId}`);
    try {
      const { session, user } = await sessionService.completeSession(sessionId);
      console.log(`Successfully completed session: ${sessionId}`);
      // Return the session and user data
      // TO be confirmed what to return for frontend use
      res.status(200).json({ session: session, userLevelInfo: user });
    } catch (error: any) {
      console.error(`Error completing session ${sessionId}:`, error);
      res.status(500).json({ error: error.message });
    }
  }
);
// cancel a session
router.post(
  "/cancel/:sessionId",
  async (req: Request, res: Response): Promise<any> => {
    const { sessionId } = req.params;
    console.log(`Received request to cancel session: ${sessionId}`);
    try {
      await sessionService.failSession(sessionId);
      console.log(`Successfully canceled session: ${sessionId}`);
      res.status(200).json({
        message: "Session canceled successfully",
        sessionId: sessionId,
      });
    } catch (error: any) {
      console.error(`Error canceling session ${sessionId}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/getStudyStats/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.params.userId;
    console.log(`Received request to get study stats for user: ${userId}`);
    try {
      const studyStats = await sessionService.getWeeklyStats(userId);
      console.log(`Successfully get study stats for user: ${userId}`);
      res.status(200).json(studyStats);
    } catch (error: any) {
      console.error(`Error get study stats for user ${userId}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
