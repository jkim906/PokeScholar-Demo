import request from 'supertest';
import express from 'express';
import { CardService } from '../../services/cardService';
import { AllGameCards } from '../../models/AllGameCards';
import cardRoutes from '../../routes/api/card';

describe('Card Routes', () => {
  let app: express.Application;
  let cardService: CardService;
  let testCards: any[];

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    cardService = new CardService();

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

    // Import and use routes
    app.use('/api/card', cardRoutes);
  });

  describe('GET /', () => {
    it('should return all cards when no filters are provided', async () => {
      const response = await request(app)
        .get('/api/card');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body).toContainEqual(expect.objectContaining({ name: 'Fire Card' }));
      expect(response.body).toContainEqual(expect.objectContaining({ name: 'Water Card' }));
    });

    it('should filter cards by name', async () => {
      const response = await request(app)
        .get('/api/card')
        .query({ name: 'Fire' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Fire Card');
    });

    it('should filter cards by rarity', async () => {
      const response = await request(app)
        .get('/api/card')
        .query({ rarity: 'Rare' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Water Card');
    });

    it('should return empty array when no cards match filters', async () => {
      const response = await request(app)
        .get('/api/card')
        .query({ name: 'NonExistentCard' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  
}); 