import { CardPack, ICardPack } from "../models/CardPack";
import { AllGameCards } from "../models/AllGameCards";
import { randomInt } from "crypto";
import { User } from "../models/User";

export class PackService {
  async getAllPacks() {
    // do not want to return all the information about the card packs
    const cardPacks = await CardPack.find(
      {},
      "name code cost description createdAt"
    )
    .sort({ createdAt: -1 })  // Sort by createdAt in descending order (newest first)
    .lean();
    if (!cardPacks || cardPacks.length === 0) {
      throw new Error("No CardPacks found");
    }
    return cardPacks as ICardPack[];
  }

  async getPackByCode(code: string) {
    const cardPack = await CardPack.findOne({ code });
    if (!cardPack) {
      throw new Error("CardPack not found");
    }
    return cardPack;
  }

  async openPack(code: string, userId: string) {
    try {
      // Validate pack code
      if (!code || typeof code !== "string") {
        throw new Error("Invalid pack code provided");
      }

      // Get pack and validate
      const cardPack = await this.getPackByCode(code);
      if (!cardPack) {
        throw new Error("CardPack not found");
      }

      // Get user and validate
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check if user has enough coins
      if (!user.coins || user.coins < cardPack.cost) {
        throw new Error("Not enough coins to open this pack");
      }

      const cards = await AllGameCards.find({ _id: { $in: cardPack.cards } });
      if (!cards || cards.length === 0) {
        throw new Error("No cards found in pack");
      }

      const returnCards: Array<(typeof cards)[number]> = [];

      for (let i = 0; i < cardPack.slots.length; i++) {
        const slot = cardPack.slots[i];
        const selectedRarity = this.selectRarity(slot.probabilities);

        // Filter cards matching selected rarity
        const possibleCards = cards.filter((cardCode) => {
          return cardCode.rarity === selectedRarity;
        });

        if (possibleCards.length > 0) {
          // Randomly pick one from possible cards
          const selectedCard = possibleCards[randomInt(possibleCards.length)];
          returnCards.push(selectedCard);
        } else {
          // If no matching rarity cards found, get all cards of the selected rarity
          const allCardsOfRarity = cards.filter(
            (card) => card.rarity === selectedRarity
          );
          if (allCardsOfRarity.length > 0) {
            const randomCard =
              allCardsOfRarity[randomInt(allCardsOfRarity.length)];
            returnCards.push(randomCard);
          } else {
            // If still no cards found, fallback to any card of the selected rarity
            console.error(
              `No cards found for rarity ${selectedRarity} in slot ${i + 1}`
            );
            const fallbackCard = cards[randomInt(cards.length)];
            returnCards.push(fallbackCard);
          }
        }
      }

      console.log("Opened cards in order:");
      returnCards.forEach((card, index) => {
        console.log(`${index + 1}. ${card.name} (${card.rarity})`);
      });

      user.cards = user.cards || [];
      // Add new cards with collection date
      for (const card of returnCards) {
        const existingCard = user.cards.find((c) => c.cardId === card._id);
        if (existingCard) {
          // If card already exists, increment copies and update collectedAt
          existingCard.copies += 1;
          existingCard.collectedAt = new Date();
        } else {
          // If card is new, add it with 1 copy
          user.cards.push({
            cardId: card._id,
            collectedAt: new Date(),
            copies: 1,
          });
        }
      }

      // Deduct coins
      user.coins -= cardPack.cost;

      // Save user changes
      await user.save();

      return returnCards;
    } catch (error) {
      console.error("Error opening pack:", error);
      throw error; // Re-throw to be handled by the controller
    }
  }

  selectRarity(probabilities: { rarity: string; chance: number }[]) {
    const rand = Math.random() * 100; // 0 to 100
    let cumulative = 0;
    for (const prob of probabilities) {
      cumulative += prob.chance;
      if (rand < cumulative) {
        return prob.rarity;
      }
    }
    // Fallback to last rarity if something goes wrong
    return probabilities[probabilities.length - 1].rarity;
  }
}
