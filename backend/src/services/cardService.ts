import { AllGameCards } from "../models/AllGameCards";

type CardRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Double Rare"
  | "Illustration Rare"
  | "Special Illustration Rare";

interface CardData {
  _id: string;
  name: string;
  types: string[];
  rarity: CardRarity;
  small: string;
  large: string;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface CardFilters {
  name?: string;
  rarity?: CardRarity;
}

export class CardService {
  async getAllCards(filters: CardFilters = {}) {
    // Fetch all cards from the database
    const cards = await AllGameCards.find({});

    // Apply filters
    let filteredCards: CardData[] = cards.map(
      (card) => card.toObject() as CardData
    );

    if (filters.rarity) {
      filteredCards = filteredCards.filter(
        (card) => card.rarity === filters.rarity
      );
    }

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      filteredCards = filteredCards.filter((card) =>
        card.name.toLowerCase().includes(searchTerm)
      );
    }

    return filteredCards;
  }
}
