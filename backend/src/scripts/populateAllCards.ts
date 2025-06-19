import mongoose from "mongoose";
import { AllGameCards } from "../models/AllGameCards";
import { config } from "dotenv";
import { PokemonTCG } from "pokemon-tcg-sdk-typescript";
import { packEeveeCards } from "./pools/packEevee";
import { packPikachuCards } from "./pools/packPikachu";

// Load environment variables
config();

// Function to fetch and save a card
async function fetchAndSaveCard(cardId: string) {
  try {
    // Fetch the card using the SDK
    const card = await PokemonTCG.findCardByID(cardId);

    if (!card.types || !Array.isArray(card.types) || card.types.length === 0) {
      throw new Error(`Card ${cardId} has no valid types`);
    }

    // Create a new GamePokemonCard
    const gameCard = new AllGameCards({
      _id: cardId,
      name: card.name,
      types: card.types,
      rarity: card.rarity,
      small: card.images.small,
      large: card.images.large,
    });

    // Save to database
    await gameCard.save();
    console.log(`Saved ${card.name} to database`);
  } catch (error) {
    console.error(`Error fetching/saving card ${cardId}:`, error);
  }
}

async function populatePackEeveeCards() {
  try {
    console.log("Fetching Pack Eevee cards...");
    for (const cardId of packEeveeCards) {
      await fetchAndSaveCard(cardId);
    }
  } catch (error) {
    console.error("Error populating Pack Eevee pool:", error);
  }
}

async function populatePackPikachuCards() {
  try {
    console.log("Fetching Pack Pikachu cards...");
    for (const cardId of packPikachuCards) {
      await fetchAndSaveCard(cardId);
    }
  } catch (error) {
    console.error("Error populating Pack Pikachu pool:", error);
  }
}

async function populateAllGameCards() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URI || "");
    console.log("Connected to MongoDB");

    // Clear existing cards
    await AllGameCards.deleteMany({});
    console.log("Cleared existing cards");

    // Populate all game cards
    await populatePackEeveeCards();
    await populatePackPikachuCards();

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error populating all game cards:", error);
    process.exit(1);
  }
}

// Run the script
populateAllGameCards();
