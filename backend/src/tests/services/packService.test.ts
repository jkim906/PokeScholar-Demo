import { PackService } from '../../services/packService';
import { CardPack } from '../../models/CardPack';
import { AllGameCards } from '../../models/AllGameCards';
import { User } from '../../models/User';
import mongoose from 'mongoose';

describe('PackService', () => {
  let packService: PackService;
  let testPacks: any[];
  let testCards: any[];
  let testUser: any;

  beforeEach(async () => {
    packService = new PackService();
    
    // Create test user with mock Clerk ID
    testUser = await User.create({
      _id: 'test_clerk_id_123', // Mock Clerk ID
      username: 'testuser',
      email: 'test@example.com',
      coins: 1000
    });
    
    // Create test cards with Pokemon TCG card IDs
    const card1 = new AllGameCards({
      _id: 'base1-1',
      name: 'Fire Card',
      types: ['Fire'],
      rarity: 'Common',
      small: 'small1.jpg',
      large: 'large1.jpg'
    });
    const card2 = new AllGameCards({
      _id: 'base1-2',
      name: 'Water Card',
      types: ['Water'],
      rarity: 'Rare',
      small: 'small2.jpg',
      large: 'large2.jpg'
    });
    
    testCards = await Promise.all([card1.save(), card2.save()]);

    // Create test packs
    testPacks = await CardPack.create([
      {
        code: 'basic_pack',
        name: 'Basic Pack',
        cost: 100,
        cards: [testCards[0]._id, testCards[1]._id],
        slots: [
          {
            slot: 1,
            probabilities: [{ rarity: 'Common', chance: 100 }]
          }
        ],
        numOfCards: 1
      },
      {
        code: 'premium_pack',
        name: 'Premium Pack',
        cost: 200,
        cards: [testCards[1]._id, testCards[0]._id],
        slots: [
          {
            slot: 1,
            probabilities: [{ rarity: 'Rare', chance: 100 }]
          }
        ],
        numOfCards: 1
      }
    ]);
  });

  describe('getAllPacks', () => {
    it('should return all packs', async () => {
      const packs = await packService.getAllPacks();
      expect(packs).toHaveLength(2);
      expect(packs).toContainEqual(expect.objectContaining({ name: 'Basic Pack' }));
      expect(packs).toContainEqual(expect.objectContaining({ name: 'Premium Pack' }));
    });
  });

  describe('getPackByCode', () => {
    it('should return pack by code', async () => {
      const pack = await packService.getPackByCode('basic_pack');
      expect(pack).toBeTruthy();
      expect(pack.name).toBe('Basic Pack');
      expect(pack.cards).toHaveLength(2);
    });

    it('should throw error for non-existent pack', async () => {
      await expect(
        packService.getPackByCode('non_existent_pack')
      ).rejects.toThrow('CardPack not found');
    });
  });

  describe('openPack', () => {
    it('should return cards based on probabilities', async () => {
      const cards = await packService.openPack('basic_pack', testUser._id.toString());
      expect(cards).toHaveLength(1);
      expect(cards[0]).toHaveProperty('_id');
      expect(cards[0]).toHaveProperty('name');
    });

    it('should throw error for non-existent pack', async () => {
      await expect(
        packService.openPack('non_existent_pack', testUser._id.toString())
      ).rejects.toThrow('CardPack not found');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        packService.openPack('basic_pack', new mongoose.Types.ObjectId().toString())
      ).rejects.toThrow('User not found');
    });

    it('should throw error when user has insufficient coins', async () => {
      // Update user to have insufficient coins
      await User.findByIdAndUpdate(testUser._id, { coins: 50 });
      
      await expect(
        packService.openPack('basic_pack', testUser._id.toString())
      ).rejects.toThrow('Not enough coins to open this pack');
    });
  });
}); 