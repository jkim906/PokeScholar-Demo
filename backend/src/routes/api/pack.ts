import express, { Router, Request, Response } from "express";
import { PackService } from "../../services/packService";

// This is the api route for handling CardPack requests.
const router = Router();
const packService = new PackService();

router.use(express.json());

// Custom error type for pack-related errors
interface PackError extends Error {
  message: string;
}

// GET /api/pack - all card packs
router.get("/", async (req: Request, res: Response): Promise<any> => {
  console.log("Received request to fetch all CardPacks");
  try {
    const cardPacks = await packService.getAllPacks();
    console.log(`Successfully found ${cardPacks.length} CardPacks`);
    res.json(cardPacks);
  } catch (error) {
    console.error("Error fetching CardPacks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/pack/:code - a specific card pack that matches the code
router.get("/:code", async (req: Request, res: Response): Promise<any> => {
  const { code } = req.params;
  console.log(`Received request to fetch CardPack with code: ${code}`);

  try {
    const cardPack = await packService.getPackByCode(code);
    console.log(`Successfully found CardPack with code: ${code}`);
    res.json(cardPack);
  } catch (error) {
    console.error(`Error fetching CardPack with code "${code}":`, error);
    res.status(404).json({ error: "CardPack not found" });
  }
});

// POST /api/pack/open/:code/:userId - open a specific card pack by a particular user
router.post(
  "/open/:code/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { code } = req.params;
    const { userId } = req.params;
    console.log(`Received request to open CardPack with code: ${code}`);

    try {
      const openedCards = await packService.openPack(code, userId);
      console.log(`Successfully opened CardPack with code: ${code}`);
      // Return the opened cards
      res.status(200).json(openedCards);
    } catch (error) {
      console.error(`Error opening CardPack with code "${code}":`, error);
      const packError = error as PackError;
      if (packError.message === "Not enough coins to open this pack") {
        res.status(403).json({ error: packError.message });
      } else if (
        packError.message === "CardPack not found" ||
        packError.message === "User not found"
      ) {
        res.status(404).json({ error: packError.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export default router;
