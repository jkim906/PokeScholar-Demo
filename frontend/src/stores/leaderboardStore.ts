import { create } from 'zustand';
import { fetchUserLeaderboard, LeaderboardItem } from '../api/userHandler';

/**
 * Leaderboard Store
 * 
 * Manages leaderboard data and display preferences.
 * This store handles all leaderboard-related state and operations.
 * 
 * State:
 * - leaderboardData: Array of leaderboard entries
 * - isLoading: Loading state for async operations
 * - error: Error state for failed operations
 * - leaderboardType: Current leaderboard type ('session' or 'coin')
 * 
 * Methods:
 * - fetchLeaderboard: Fetches leaderboard data
 * - setLeaderboardType: Updates the leaderboard type
 */
interface LeaderboardState {
  leaderboardData: LeaderboardItem[];
  isLoading: boolean;
  error: string | null;
  leaderboardType: 'session' | 'coin';
  fetchLeaderboard: (userId: string) => Promise<void>;
  setLeaderboardType: (type: 'session' | 'coin') => void;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  // Initial state
  leaderboardData: [],
  isLoading: false,
  error: null,
  leaderboardType: 'session',

  /**
   * Fetches leaderboard data for the current user
   * @param userId - The ID of the current user
   */
  fetchLeaderboard: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUserLeaderboard(userId, 'session');
      set({ leaderboardData: data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch leaderboard data', isLoading: false });
    }
  },

  /**
   * Updates the leaderboard type
   * @param type - The new leaderboard type ('session' or 'point')
   */
  setLeaderboardType: (type: 'session' | 'coin') => {
    set({ leaderboardType: type });
  },
})); 