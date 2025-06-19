import { renderHook, act } from '@testing-library/react-native';
import { useCollection } from '../useCollection';
import { useUser } from '@clerk/clerk-react';
import { useCollectionStore } from '../../stores/collectionStore';

// Mock the dependencies
jest.mock('@clerk/clerk-react');
jest.mock('../../stores/collectionStore');

describe('useCollection', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  const mockCards = [
    { id: 'card1', name: 'Card 1' },
    { id: 'card2', name: 'Card 2' },
  ];

  const mockAllCards = [
    { id: 'card1', name: 'Card 1' },
    { id: 'card2', name: 'Card 2' },
    { id: 'card3', name: 'Card 3' },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useUser hook
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });

    // Mock useCollectionStore
    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: [],
      allCards: [],
      filteredTotal: 0,
      isLoading: false,
      error: null,
      loadCollection: jest.fn(),
      setCards: jest.fn(),
      setAllCards: jest.fn(),
      setFilteredTotal: jest.fn(),
      setError: jest.fn(),
    });
  });

  it('should load collection when user is available', () => {
    const mockLoadCollection = jest.fn();

    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: [],
      allCards: [],
      filteredTotal: 0,
      isLoading: false,
      error: null,
      loadCollection: mockLoadCollection,
      setCards: jest.fn(),
      setAllCards: jest.fn(),
      setFilteredTotal: jest.fn(),
      setError: jest.fn(),
    });

    renderHook(() => useCollection());

    expect(mockLoadCollection).toHaveBeenCalledWith(mockUser.id);
  });

  it('should clear state when user is not available', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });

    const mockSetCards = jest.fn();
    const mockSetAllCards = jest.fn();
    const mockSetFilteredTotal = jest.fn();
    const mockSetError = jest.fn();

    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: [],
      allCards: [],
      filteredTotal: 0,
      isLoading: false,
      error: null,
      loadCollection: jest.fn(),
      setCards: mockSetCards,
      setAllCards: mockSetAllCards,
      setFilteredTotal: mockSetFilteredTotal,
      setError: mockSetError,
    });

    renderHook(() => useCollection());

    expect(mockSetCards).toHaveBeenCalledWith([]);
    expect(mockSetAllCards).toHaveBeenCalledWith([]);
    expect(mockSetFilteredTotal).toHaveBeenCalledWith(0);
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it('should return the correct data from the store', () => {
    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: mockCards,
      allCards: mockAllCards,
      filteredTotal: 3,
      isLoading: true,
      error: 'Test error',
      loadCollection: jest.fn(),
      setCards: jest.fn(),
      setAllCards: jest.fn(),
      setFilteredTotal: jest.fn(),
      setError: jest.fn(),
    });

    const { result } = renderHook(() => useCollection());

    expect(result.current.cards).toEqual(mockCards);
    expect(result.current.allCards).toEqual(mockAllCards);
    expect(result.current.filteredTotal).toBe(3);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
  });

  it('should handle collection loading with filters', async () => {
    const mockLoadCollection = jest.fn();

    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: mockCards,
      allCards: mockAllCards,
      filteredTotal: 3,
      isLoading: false,
      error: null,
      loadCollection: mockLoadCollection,
      setCards: jest.fn(),
      setAllCards: jest.fn(),
      setFilteredTotal: jest.fn(),
      setError: jest.fn(),
    });

    const { result } = renderHook(() => useCollection());

    await act(async () => {
      await result.current.loadCollection({ rarity: 'rare', type: 'fire' });
    });

    expect(mockLoadCollection).toHaveBeenCalledWith(mockUser.id, { rarity: 'rare', type: 'fire' });
  });
}); 