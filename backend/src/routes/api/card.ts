import express, { Router, Request, Response } from "express";
import { config } from "dotenv";
import { CardService } from "../../services/cardService";

// Load environment variables
config();

// This is the API route for handling AllGameCards requests.
const router = Router();
const cardService = new CardService();

router.use(express.json());

// GET /api/card - get all cards with optional filters
router.get("/", async (req: Request, res: Response): Promise<any> => {
  const { name, rarity } = req.query;

  console.log("Received request to fetch cards with filters:", {
    name,
    rarity,
  });

  try {
    const cards = await cardService.getAllCards({
      name: name as string,
      rarity: rarity as
        | "Common"
        | "Uncommon"
        | "Rare"
        | "Double Rare"
        | "Illustration Rare"
        | "Special Illustration Rare"
        | undefined,
    });
    console.log(`Successfully found ${cards.length} cards`);
    res.status(200).json(cards);
  } catch (error: any) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
