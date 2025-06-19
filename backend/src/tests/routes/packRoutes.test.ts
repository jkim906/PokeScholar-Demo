import request from 'supertest';
import express from 'express';
import { PackService } from '../../services/packService';
import { CardPack } from '../../models/CardPack';
import { AllGameCards } from '../../models/AllGameCards';
import { User } from '../../models/User';
import packRoutes from '../../routes/api/pack';

describe('Pack Routes', () => {
  let app: express.Application;
  let packService: PackService;
  let testPacks: any[];
  let testCards: any[];
  let testUser: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    packService = new PackService();

    // Create test user
    testUser = await User.create({
      _id: 'test_clerk_id_123',
      username: 'testuser',
      email: 'test@example.com',
      coins: 1000
    });

    // Create test cards
    testCards = await AllGameCards.create([
      {
        _id: 'base1-1',
        name: 'Fire Card',
        types: ['Fire'],
        rarity: 'Common',
        small: 'small1.jpg',
        large: 'large1.jpg'
      },
      {
        _id: 'base1-2',
        name: 'Water Card',
        types: ['Water'],
        rarity: 'Rare',
        small: 'small2.jpg',
        large: 'large2.jpg'
      }
    ]);

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

    // Import and use routes
    app.use('/api/pack', packRoutes);
  });

  describe('GET /', () => {
    it('should return all packs', async () => {
      const response = await request(app)
        .get('/api/pack');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name', 'Basic Pack');
      expect(response.body[1]).toHaveProperty('name', 'Premium Pack');
    });
  });

  describe('GET /:code', () => {
    it('should return pack by code', async () => {
      const response = await request(app)
        .get('/api/pack/basic_pack');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Basic Pack');
      expect(response.body).toHaveProperty('cost', 100);
    });

    it('should return 404 for non-existent pack', async () => {
      const response = await request(app)
        .get('/api/pack/nonexistent_pack');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'CardPack not found');
    });
  });

  describe('POST /open/:code/:userId', () => {
    it('should open a pack successfully', async () => {
      const response = await request(app)
        .post(`/api/pack/open/basic_pack/${testUser._id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should return 404 for non-existent pack', async () => {
      const response = await request(app)
        .post(`/api/pack/open/nonexistent_pack/${testUser._id}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'CardPack not found');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/pack/open/basic_pack/nonexistent_user');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should return 403 when user has insufficient coins', async () => {
      // Update user to have insufficient coins
      await User.findByIdAndUpdate(testUser._id, { coins: 50 });

      const response = await request(app)
        .post(`/api/pack/open/basic_pack/${testUser._id}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Not enough coins to open this pack');
    });
  });
}); 