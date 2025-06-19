import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useUserStore } from '../stores/userStore';

/**
 * useUserProfile Hook
 * 
 * Manages user profile data and card display preferences.
 * This hook provides access to user information and methods
 * to update profile settings and card display.
 * 
 * Features:
 * - Fetches and manages user profile information
 * - Handles card display preferences
 * - Provides methods for updating profile and card display
 * - Manages coin balance
 * - Automatically syncs with backend on mount
 */
export const useUserProfile = () => {
  // Get user authentication state from Clerk
  const { user } = useUser();
  
  // Get user store methods and state
  const {
    userInfo,
    cardDisplay,
    isLoading,
    error,
    fetchUserInfo,
    updateProfile,
    updateCardDisplay,
    fetchCardDisplay,
    addCoins,
    deductCoins,
  } = useUserStore();

  // Fetch user data on mount and when user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchUserInfo(user.id);
      fetchCardDisplay(user.id);
    }
  }, [user?.id, fetchUserInfo, fetchCardDisplay]);

  return {
    userInfo,
    cardDisplay,
    isLoading,
    error,
    // Wrap methods to ensure user ID is available
    updateProfile: (profileData: { profileImage?: string }) => 
      user?.id ? updateProfile(user.id, profileData) : Promise.reject('No user ID'),
    updateCardDisplay: (cardIds: string[]) => 
      user?.id ? updateCardDisplay(user.id, cardIds) : Promise.reject('No user ID'),
    addCoins,
    deductCoins,
    fetchUserInfo: (userId: string) => fetchUserInfo(userId),
    fetchCardDisplay: (userId: string) => fetchCardDisplay(userId),
  };
}; 