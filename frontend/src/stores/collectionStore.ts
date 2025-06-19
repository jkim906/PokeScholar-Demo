import { create } from 'zustand';
import { Card } from '../types/Card';
import { fetchUserCards, fetchAllCards, CardFilters } from '../api/collectionHandler';

/**
 * Collection Store
 * 
 * Manages the user's Pokemon card collection and related data.
 * This store handles all collection-related state and operations.
 * 
 * State:
 * - cards: User's personal collection of cards
 * - allCards: All available cards in the game
 * - filteredTotal: Total number of cards after filtering
 * - isLoading: Loading state for async operations
 * - error: Error state for failed operations
 * 
 * Methods:
 * - setCards: Updates user's card collection
 * - setAllCards: Updates all available cards
 * - setFilteredTotal: Updates filtered card count
 * - setError: Updates error state
 * - loadCollection: Loads user's collection with optional filters
 */
interface CollectionState {
  // User's personal collection of cards
  cards: Card[];
  // All available cards in the game
  allCards: Card[];
  // Total number of cards after filtering
  filteredTotal: number;
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  // State setters
  setCards: (cards: Card[]) => void;
  setAllCards: (cards: Card[]) => void;
  setFilteredTotal: (total: number) => void;
  setError: (error: string | null) => void;
  // Function to load the user's collection with optional filters
  loadCollection: (userId: string, filters?: CardFilters) => Promise<void>;
}

/**
 * useCollectionStore is a Zustand store
 * It manages the state of the user's Pokemon card collection
 */
export const useCollectionStore = create<CollectionState>()((set) => ({
  // Initial state
  cards: [],
  allCards: [],
  filteredTotal: 0,
  isLoading: false,
  error: null,

  // State setters
  setCards: (cards) => set({ cards }),
  setAllCards: (cards) => set({ allCards: cards }),
  setFilteredTotal: (total) => set({ filteredTotal: total }),
  setError: (error) => set({ error }),

  /**
   * Loads the user's card collection with optional filters
   * @param userId - The ID of the current user
   * @param filters - Optional filters to apply to the collection
   */
  loadCollection: async (userId: string, filters?: CardFilters) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch both user's cards and all available cards in parallel
      const [userCardsData, allCardsData] = await Promise.all([
        fetchUserCards(userId, filters),
        fetchAllCards(filters)
      ]);

      set({
        cards: userCardsData,
        allCards: allCardsData,
        filteredTotal: allCardsData.length,
        isLoading: false
      });
    } catch (error) {
      set({
        error: 'Failed to load collection',
        isLoading: false
      });
    }
  },
})); 