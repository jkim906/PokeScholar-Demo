import axios from 'axios';
import { fetchUserCards, fetchAllCards } from '../collectionHandler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('collectionHandler', () => {
  const mockCards = [
    {
      _id: 'card1',
      name: 'Test Card 1',
      rarity: 'rare',
      types: ['fire'],
      small: 'small1.jpg',
      large: 'large1.jpg',
      copies: 1,
      collectedAt: '2024-03-20T00:00:00.000Z'
    },
    {
      _id: 'card2',
      name: 'Test Card 2',
      rarity: 'common',
      types: ['water'],
      small: 'small2.jpg',
      large: 'large2.jpg',
      copies: 2,
      collectedAt: '2024-03-20T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserCards', () => {
    it('should fetch user cards successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockCards });

      const result = await fetchUserCards('user123');
      expect(result).toEqual(mockCards);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/cards/user123',
        { params: {} }
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      });

      await expect(fetchUserCards('user123')).rejects.toThrow('An unexpected error occurred while fetching user cards');
    });

    it('should apply filters correctly', async () => {
      const filters = { rarity: 'rare', type: 'fire' };
      mockedAxios.get.mockResolvedValueOnce({ data: mockCards });

      await fetchUserCards('user123', filters);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/cards/user123',
        { params: filters }
      );
    });
  });

  describe('fetchAllCards', () => {
    it('should fetch all cards successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockCards });

      const result = await fetchAllCards();
      expect(result).toEqual(mockCards);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/card',
        { params: {} }
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Server error' }
        }
      });

      await expect(fetchAllCards()).rejects.toThrow('An unexpected error occurred while fetching all cards');
    });

    it('should apply filters correctly', async () => {
      const filters = { rarity: 'rare', type: 'fire' };
      mockedAxios.get.mockResolvedValueOnce({ data: mockCards });

      await fetchAllCards(filters);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/card',
        { params: filters }
      );
    });
  });
}); 