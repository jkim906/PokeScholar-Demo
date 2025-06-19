import { create } from 'zustand';
import { 
  fetchUserData, 
  updateUserProfile, 
  updateUserCardDisplay, 
  fetchUserCardDisplay,
  UserInfo 
} from '../api/userHandler';

/**
 * User Store
 * 
 * Manages user profile data and card display preferences.
 * This store handles all user-related state and operations.
 * 
 * State:
 * - userInfo: User profile information
 * - cardDisplay: User's selected card display
 * - isLoading: Loading state for async operations
 * - error: Error state for failed operations
 * 
 * Methods:
 * - fetchUserInfo: Fetches user profile data
 * - updateProfile: Updates user profile information
 * - updateCardDisplay: Updates user's card display
 * - fetchCardDisplay: Fetches user's card display
 * - addCoins: Adds coins to user's balance
 * - deductCoins: Deducts coins from user's balance
 */
interface UserState {
  userInfo: UserInfo | null;
  cardDisplay: (string | null)[];
  isLoading: boolean;
  error: string | null;
  fetchUserInfo: (userId: string) => Promise<void>;
  updateProfile: (userId: string, profileData: { profileImage?: string }) => Promise<void>;
  updateCardDisplay: (userId: string, cardIds: string[]) => Promise<void>;
  fetchCardDisplay: (userId: string) => Promise<void>;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  cardDisplay: [null, null, null],
  isLoading: false,
  error: null,

  fetchUserInfo: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const userInfo = await fetchUserData(userId);
      set({ userInfo, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch user info', isLoading: false });
    }
  },

  updateProfile: async (userId: string, profileData: { profileImage?: string }) => {
    set({ isLoading: true, error: null });
    try {
      await updateUserProfile(userId, profileData);
      // Refresh user info after update
      const userInfo = await fetchUserData(userId);
      set({ userInfo, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update profile', isLoading: false });
    }
  },

  updateCardDisplay: async (userId: string, cardIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await updateUserCardDisplay(userId, cardIds);
      set((state) => ({
        cardDisplay: [...cardIds, ...Array(3 - cardIds.length).fill(null)],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update card display', isLoading: false });
    }
  },

  fetchCardDisplay: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cardDisplay = await fetchUserCardDisplay(userId);
      set({ 
        cardDisplay: [...cardDisplay, ...Array(3 - cardDisplay.length).fill(null)],
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Failed to fetch card display', isLoading: false });
    }
  },

  addCoins: (amount: number) => {
    set((state) => ({
      userInfo: state.userInfo ? {
        ...state.userInfo,
        coins: state.userInfo.coins + amount
      } : null
    }));
  },

  deductCoins: (amount: number) => {
    set((state) => ({
      userInfo: state.userInfo ? {
        ...state.userInfo,
        coins: Math.max(0, state.userInfo.coins - amount)
      } : null
    }));
  },
})); 