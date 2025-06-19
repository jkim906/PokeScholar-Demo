import { CardService } from '../../services/cardService';
import { AllGameCards } from '../../models/AllGameCards';
import mongoose from 'mongoose';

describe('CardService', () => {
  let cardService: CardService;
  let testCards: any[];

  beforeEach(async () => {
    cardService = new CardService();
    
    // Create test cards
    testCards = await AllGameCards.create([
      {
        _id: 'test_card_1',
        name: 'Fire Card',
        types: ['Fire'],
        rarity: 'Common',
        small: 'small1.jpg',
        large: 'large1.jpg'
      },
      {
        _id: 'test_card_2',
        name: 'Water Card',
        types: ['Water'],
        rarity: 'Rare',
        small: 'small2.jpg',
        large: 'large2.jpg'
      },
      {
        _id: 'test_card_3',
        name: 'Grass Card',
        types: ['Grass'],
        rarity: 'Uncommon',
        small: 'small3.jpg',
        large: 'large3.jpg'
      }
    ]);
  });

  describe('getAllCards', () => {
    it('should return all cards when no filters are provided', async () => {
      const cards = await cardService.getAllCards({});
      expect(cards).toHaveLength(3);
    });

    it('should filter cards by name', async () => {
      const cards = await cardService.getAllCards({ name: 'Fire' });
      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Fire Card');
    });

    it('should filter cards by rarity', async () => {
      const cards = await cardService.getAllCards({ rarity: 'Rare' });
      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Water Card');
    });

    it('should filter cards by both name and rarity', async () => {
      const cards = await cardService.getAllCards({ 
        name: 'Card',
        rarity: 'Common'
      });
      expect(cards).toHaveLength(1);
      expect(cards[0].name).toBe('Fire Card');
    });

    it('should return empty array when no cards match filters', async () => {
      const cards = await cardService.getAllCards({ 
        name: 'Nonexistent',
        rarity: 'Common'
      });
      expect(cards).toHaveLength(0);
    });
  });

}); 