import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useCollectionStore } from '../stores/collectionStore';

/**
 * useCollection Hook
 * 
 * Manages the user's Pokemon card collection.
 * This hook provides access to collection data and methods
 * to load and filter the collection.
 * 
 * Features:
 * - Fetches and manages user's card collection
 * - Handles collection filtering
 * - Provides methods for loading collection data
 * - Automatically syncs with backend on mount
 * - Clears state on user sign out
 */
export const useCollection = () => {
  // Get user authentication state from Clerk
  const { user } = useUser();
  
  // Get collection store methods and state
  const {
    cards,
    allCards,
    filteredTotal,
    isLoading,
    error,
    loadCollection,
    setCards,
    setAllCards,
    setFilteredTotal,
    setError,
  } = useCollectionStore();

  // Load collection on mount and clear state on sign out
  useEffect(() => {
    if (user?.id) {
      loadCollection(user.id);
    } else {
      // Clear the state when user signs out
      setCards([]);
      setAllCards([]);
      setFilteredTotal(0);
      setError(null);
    }
  }, [user?.id, loadCollection, setCards, setAllCards, setFilteredTotal, setError]);

  return {
    cards,
    allCards,
    filteredTotal,
    isLoading,
    error,
    setCards,
    setAllCards,
    setFilteredTotal,
    // Wrap loadCollection to ensure user ID is available
    loadCollection: (filters?: { rarity?: string; type?: string }) => 
      user?.id ? loadCollection(user.id, filters) : Promise.reject('No user ID'),
  };
}; 