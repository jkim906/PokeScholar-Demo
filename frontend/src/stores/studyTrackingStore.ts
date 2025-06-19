import { create } from 'zustand';
import { fetchStudyStats, StudyStats } from '../api/sessionHandler';

/**
 * Study Tracking Store
 * 
 * Manages study tracking data and statistics.
 * This store handles all study-related state and operations.
 * 
 * State:
 * - weeklyStats: Weekly study statistics
 * - isLoading: Loading state for async operations
 * - error: Error state for failed operations
 * 
 * Methods:
 * - fetchWeeklyStats: Fetches weekly study statistics
 */
interface StudyTrackingState {
  weeklyStats: StudyStats | null;
  isLoading: boolean;
  error: string | null;
  fetchWeeklyStats: (userId: string) => Promise<void>;
}

/**
 * useStudyTrackingStore is a Zustand store that manages the state of study tracking data
 * and statistics. It provides methods for fetching and updating study statistics.
 */
export const useStudyTrackingStore = create<StudyTrackingState>((set) => ({
  weeklyStats: null,
  isLoading: false,
  error: null,

  fetchWeeklyStats: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await fetchStudyStats(userId);
      set({ weeklyStats: stats, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch study stats', isLoading: false });
    }
  },
})); 