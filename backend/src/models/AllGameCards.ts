import mongoose from "mongoose";

// Pokemon types as defined in the TCG API
const PokemonTypes = [
  "Colorless",
  "Darkness",
  "Dragon",
  "Fairy",
  "Fighting",
  "Fire",
  "Grass",
  "Lightning",
  "Metal",
  "Psychic",
  "Water",
] as const;

// Card rarities as defined in the TCG API
const CardRarities = [
  "Common",
  "Uncommon",
  "Rare",
  "Double Rare",
  "Illustration Rare",
  "Special Illustration Rare",
] as const;

// This schema defines all necessary information for every card used in-game.
const allGameCardSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      description: "Pokemon TCG card ID",
    },
    name: {
      type: String,
      required: true,
      description: "Name of the Pokemon card",
    },
    types: {
      type: [String],
      required: true,
      enum: PokemonTypes,
      description: "Types of the Pokemon card",
    },
    rarity: {
      type: String,
      required: true,
      enum: CardRarities,
      description: "Rarity of the Pokemon card",
    },
    small: {
      type: String,
      required: true,
      description:
        "URL for the small version of the Pokemon card image used in the game",
    },
    large: {
      type: String,
      required: true,
      description:
        "URL for the large version of the Pokemon card image used in the game",
    },
  },
  {
    timestamps: true,
  }
);

export const AllGameCards = mongoose.model("AllGameCard", allGameCardSchema);
