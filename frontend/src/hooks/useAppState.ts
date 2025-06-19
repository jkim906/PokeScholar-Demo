import { useUser } from '@clerk/clerk-react';
import { useStudyTracking } from './useStudyTracking';
import { useLeaderboard } from './useLeaderboard';
import { useCollection } from '../hooks/useCollection';
import { useFriendsSync } from './useFriendsSync';
import { useUserProfile } from './useUserProfile';
import { useEffect, useCallback, useRef } from 'react';

/**
 * useAppState Hook
 * 
 * A central hook that manages and coordinates all application state.
 * This hook combines multiple stores and provides a unified interface
 * for accessing and updating application data.
 * 
 * Features:
 * - Manages user authentication state
 * - Coordinates data fetching across different stores
 * - Provides a single refresh mechanism for all data
 * - Handles initial data loading
 * - Manages leaderboard updates based on friends list changes
 */
export const useAppState = () => {
  // Get user authentication state from Clerk
  const { user, isSignedIn } = useUser();
  
  // Initialize all store hooks
  const studyTracking = useStudyTracking();
  const leaderboard = useLeaderboard();
  const collection = useCollection();
  const friends = useFriendsSync();
  const userProfile = useUserProfile();
  
  // Ref to prevent multiple simultaneous refreshes
  const isRefreshing = useRef(false);

  /**
   * refreshAllData
   * 
   * Refreshes all application data in parallel.
   * Uses a ref to prevent multiple simultaneous refreshes.
   * Only executes if user is signed in and not already refreshing.
   */
  const refreshAllData = useCallback(async () => {
    if (!isSignedIn || !user?.id || isRefreshing.current) return;
    
    try {
      isRefreshing.current = true;
      await Promise.all([
        userProfile.fetchUserInfo(user.id),
        userProfile.fetchCardDisplay(user.id),
        collection.loadCollection({}),
        studyTracking.fetchWeeklyStats(user.id),
        leaderboard.fetchLeaderboard(user.id),
        friends.loadFriends(user.id)
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      isRefreshing.current = false;
    }
  }, [isSignedIn, user?.id, userProfile, collection, studyTracking, leaderboard, friends]);

  // Initial data load when user signs in
  useEffect(() => {
    if (isSignedIn && user?.id) {
      refreshAllData();
    }
  }, [isSignedIn, user?.id]);

  // Refresh leaderboard when friends list changes
  useEffect(() => {
    if (userProfile.userInfo?._id) {
      leaderboard.fetchLeaderboard(userProfile.userInfo._id);
    }
  }, [friends.friends, userProfile.userInfo?._id]);

  return {
    user,
    studyTracking,
    leaderboard,
    collection,
    friends,
    userProfile,
    refreshAllData,
  };
}; 