import axios from 'axios';
import { fetchAllPacks, buyPack } from '../packHandler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Pack Handler', () => {
  const mockPack = {
    name: 'Test Pack',
    cost: 100,
    code: 'TEST123',
    description: 'A test pack',
    cards: ['card1', 'card2', 'card3']
  };

  const mockCards = [
    {
      name: 'Test Card 1',
      rarity: 'rare',
      small: 'small1.jpg',
      large: 'large1.jpg'
    },
    {
      name: 'Test Card 2',
      rarity: 'common',
      small: 'small2.jpg',
      large: 'large2.jpg'
    }
  ];

  const mockPacks = [mockPack];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllPacks', () => {
    it('should fetch all packs successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [mockPack], status: 200 });

      const result = await fetchAllPacks();
      expect(result).toEqual([mockPack]);
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3000/api/pack');
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404 });

      await expect(fetchAllPacks()).rejects.toThrow('Failed to fetch packs');
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchAllPacks()).rejects.toThrow('Failed to fetch packs');
    });
  });

  describe('buyPack', () => {
    it('should buy pack successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockCards, status: 200 });

      const result = await buyPack('TEST123', 'user123');
      expect(result).toEqual(mockCards);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/pack/open/TEST123/user123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 404 });

      await expect(buyPack('TEST123', 'user123')).rejects.toThrow('Failed to buy pack');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(buyPack('TEST123', 'user123')).rejects.toThrow('Failed to buy pack');
    });
  });
}); 