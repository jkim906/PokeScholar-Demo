import mongoose from "mongoose";
import { CardPack } from "../models/CardPack";
import { config } from "dotenv";
import { packEeveeCards } from "./pools/packEevee";
import { packPikachuCards } from "./pools/packPikachu";
import { packSlots } from "./pools/packSlots";

// Load environment variables
config();

async function createPackEevee() {
  try {
    const packEevee = new CardPack({
      code: "eevee",
      name: "Eevee Pack",
      cost: 20,
      cards: packEeveeCards,
      slots: packSlots,
      numOfCards: 6,
      description: "A pack containing Eevee and its evolutions",
    });

    // Save to database
    await packEevee.save();
    console.log(`Saved ${packEevee.name} to database`);
  } catch (error) {
    console.error(`Error creating pack`, error);
  }
}

async function createPackPikachu() {
  try {
    const packPikachu = new CardPack({
      code: "pikachu",
      name: "Pikachu Pack",
      cost: 20,
      cards: packPikachuCards,
      slots: packSlots,
      numOfCards: 6,
      description: "A pack featuring Pikachu.",
    });

    // Save to database
    await packPikachu.save();
    console.log(`Saved ${packPikachu.name} to database`);
  } catch (error) {
    console.error(`Error creating pack`, error);
  }
}

async function populateCardPacks() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI || "");
    console.log("Connected to MongoDB");

    // Clear existing cards
    await CardPack.deleteMany({});
    console.log("Cleared existing packs");

    // Create card packs
    await createPackEevee();
    await createPackPikachu();

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error populating card packs:", error);
    process.exit(1);
  }
}

// Run the script
populateCardPacks();
