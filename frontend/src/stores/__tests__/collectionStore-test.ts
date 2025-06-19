import { act } from '@testing-library/react-native';
import { useCollectionStore } from '../collectionStore';
import * as collectionHandler from '../../api/collectionHandler';


// Mock the collectionHandler module
jest.mock('../../api/collectionHandler');

describe('collectionStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useCollectionStore.setState({
        cards: [],
        allCards: [],
        filteredTotal: 0,
        isLoading: false,
        error: null
      });
    });
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('setCards', () => {
    it('should update cards state', () => {
      const mockCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        }
      ];

      act(() => {
        useCollectionStore.getState().setCards(mockCards);
      });

      expect(useCollectionStore.getState().cards).toEqual(mockCards);
    });
  });

  describe('setAllCards', () => {
    it('should update allCards state', () => {
      const mockAllCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        },
        {
          _id: 'card2',
          name: 'Charizard',
          rarity: 'legendary',
          types: ['fire'],
          small: 'charizard-small.jpg',
          large: 'charizard-large.jpg',
          copies: 0,
          collectedAt: ''
        }
      ];
      act(() => {
        useCollectionStore.getState().setAllCards(mockAllCards);
      });

      expect(useCollectionStore.getState().allCards).toEqual(mockAllCards);
    });
  });

  describe('setFilteredTotal', () => {
    it('should update filteredTotal state', () => {
      act(() => {
        useCollectionStore.getState().setFilteredTotal(5);
      });

      expect(useCollectionStore.getState().filteredTotal).toBe(5);
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      act(() => {
        useCollectionStore.getState().setError('Test error');
      });

      expect(useCollectionStore.getState().error).toBe('Test error');
    });

    it('should clear error state', () => {
      act(() => {
        useCollectionStore.getState().setError(null);
      });

      expect(useCollectionStore.getState().error).toBe(null);
    });
  });

  describe('loadCollection', () => {
    it('should load collection successfully', async () => {
      const mockUserCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        }
      ];

      const mockAllCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        },
        {
          _id: 'card2',
          name: 'Charizard',
          rarity: 'legendary',
          types: ['fire'],
          small: 'charizard-small.jpg',
          large: 'charizard-large.jpg',
          copies: 0,
          collectedAt: ''
        }
      ];

      (collectionHandler.fetchUserCards as jest.Mock).mockResolvedValueOnce(mockUserCards);
      (collectionHandler.fetchAllCards as jest.Mock).mockResolvedValueOnce(mockAllCards);

      await act(async () => {
        await useCollectionStore.getState().loadCollection('user123');
      });

      expect(useCollectionStore.getState().cards).toEqual(mockUserCards);
      expect(useCollectionStore.getState().allCards).toEqual(mockAllCards);
      expect(useCollectionStore.getState().filteredTotal).toBe(mockAllCards.length);
      expect(useCollectionStore.getState().isLoading).toBe(false);
      expect(useCollectionStore.getState().error).toBe(null);
    });

    it('should handle load error', async () => {
      (collectionHandler.fetchUserCards as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useCollectionStore.getState().loadCollection('user123');
      });

      expect(useCollectionStore.getState().error).toBe('Failed to load collection');
      expect(useCollectionStore.getState().isLoading).toBe(false);
    });

    it('should load collection with filters', async () => {
      const mockUserCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        }
      ];

      const mockAllCards = [
        {
          _id: 'card1',
          name: 'Pikachu',
          rarity: 'rare',
          types: ['electric'],
          small: 'pikachu-small.jpg',
          large: 'pikachu-large.jpg',
          copies: 1,
          collectedAt: '2024-03-20T00:00:00.000Z'
        }
      ];

      const filters = {
        rarity: 'rare',
        type: 'electric',
        search: 'pikachu'
      };

      (collectionHandler.fetchUserCards as jest.Mock).mockResolvedValueOnce(mockUserCards);
      (collectionHandler.fetchAllCards as jest.Mock).mockResolvedValueOnce(mockAllCards);

      await act(async () => {
        await useCollectionStore.getState().loadCollection('user123', filters);
      });

      expect(collectionHandler.fetchUserCards).toHaveBeenCalledWith('user123', filters);
      expect(collectionHandler.fetchAllCards).toHaveBeenCalledWith(filters);
      expect(useCollectionStore.getState().cards).toEqual(mockUserCards);
      expect(useCollectionStore.getState().allCards).toEqual(mockAllCards);
      expect(useCollectionStore.getState().filteredTotal).toBe(mockAllCards.length);
    });
  });
}); 