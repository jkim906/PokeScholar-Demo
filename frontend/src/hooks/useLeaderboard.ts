import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useLeaderboardStore } from '../stores/leaderboardStore';

/**
 * useLeaderboard Hook
 * 
 * Manages leaderboard data and display preferences.
 * This hook provides access to leaderboard information and methods
 * to toggle between different leaderboard types.
 * 
 * Features:
 * - Fetches and manages leaderboard data
 * - Handles leaderboard type switching (session/coin based)
 * - Provides methods for updating leaderboard display
 * - Automatically syncs with backend on mount and type change
 */
export const useLeaderboard = () => {
  // Get user authentication state from Clerk
  const { user } = useUser();
  
  // Get leaderboard store methods and state
  const {
    leaderboardData,
    isLoading,
    error,
    leaderboardType,
    fetchLeaderboard,
    setLeaderboardType,
  } = useLeaderboardStore();

  // Fetch leaderboard data on mount and when type changes
  useEffect(() => {
    if (user?.id) {
      fetchLeaderboard(user.id);
    }
  }, [user?.id, fetchLeaderboard, leaderboardType]);

  // Toggle between session and point based leaderboards
  const toggleLeaderboardType = () => {
    setLeaderboardType(leaderboardType === 'session' ? 'coin' : 'session');
  };

  return {
    leaderboardData,
    isLoading,
    error,
    leaderboardType,
    toggleLeaderboardType,
    fetchLeaderboard,
  };
}; 