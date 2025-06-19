import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useStudyTrackingStore } from '../stores/studyTrackingStore';

/**
 * useStudyTracking Hook
 * 
 * Manages study tracking data and statistics.
 * This hook provides access to study session information
 * and methods to track study progress.
 * 
 * Features:
 * - Fetches and manages weekly study statistics
 * - Tracks study session progress
 * - Provides methods for updating study data
 * - Automatically syncs with backend on mount
 */
export const useStudyTracking = () => {
  // Get user authentication state from Clerk
  const { user } = useUser();
  
  // Get study tracking store methods and state
  const {
    weeklyStats,
    isLoading,
    error,
    fetchWeeklyStats,
  } = useStudyTrackingStore();

  // Fetch study data on mount and when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchWeeklyStats(user.id);
    }
  }, [user?.id, fetchWeeklyStats]);

  return {
    weeklyStats,
    isLoading,
    error,
    fetchWeeklyStats: (userId: string) => fetchWeeklyStats(userId),
  };
}; 