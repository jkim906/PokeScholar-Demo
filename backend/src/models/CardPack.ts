import mongoose from "mongoose";

const probabilitySchema = new mongoose.Schema({
  rarity: { type: String, required: true },
  chance: { type: Number, required: true },
});

const slotSchema = new mongoose.Schema({
  slot: { type: Number, required: true },
  probabilities: { type: [probabilitySchema], required: true },
});

interface ICardPack {
  _id: string;
  name: string;
  cost: number;
  description?: string;
  code: string;
  cards: string[];
  slots: any[];
  numOfCards: number;
}
// This schema defines a card pack.
const cardPackSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    description: "Searh code of the card pack",
  },
  name: {
    type: String,
    required: true,
    description: "Name of the card pack",
  },
  cost: {
    type: Number,
    required: true,
    description: "In-game cost of the card pack",
  },
  cards: {
    type: [String],
    required: true,
    description: "List of card IDs",
  },
  slots: {
    type: [slotSchema],
    required: true,
    description: "List of slots with probabilities for each rarity",
  },
  numOfCards: {
    type: Number,
    required: true,
    description: "Number of cards per pack",
  },
  description: {
    type: String,
  },
});
const Probability = mongoose.model("Probability", probabilitySchema);
const Slot = mongoose.model("Slot", slotSchema);
export const CardPack = mongoose.model<ICardPack>("CardPack", cardPackSchema);

export { Probability, Slot, ICardPack };
