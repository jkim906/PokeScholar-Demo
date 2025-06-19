import { renderHook, act } from '@testing-library/react-native';
import { useAppState } from '../useAppState';
import { useUser } from '@clerk/clerk-react';
import { useStudyTracking } from '../useStudyTracking';
import { useLeaderboard } from '../useLeaderboard';
import { useCollection } from '../useCollection';
import { useFriendsSync } from '../useFriendsSync';
import { useUserProfile } from '../useUserProfile';

jest.mock('@clerk/clerk-react');
jest.mock('../useStudyTracking');
jest.mock('../useLeaderboard');
jest.mock('../useCollection');
jest.mock('../useFriendsSync');
jest.mock('../useUserProfile');

describe('useAppState', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser, isSignedIn: true });
    (useStudyTracking as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: jest.fn(),
    });
    (useLeaderboard as jest.Mock).mockReturnValue({
      leaderboardData: [],
      isLoading: false,
      error: null,
      leaderboardType: 'session',
      fetchLeaderboard: jest.fn(),
      toggleLeaderboardType: jest.fn(),
    });
    (useCollection as jest.Mock).mockReturnValue({
      cards: [],
      allCards: [],
      filteredTotal: 0,
      isLoading: false,
      error: null,
      loadCollection: jest.fn(),
    });
    (useFriendsSync as jest.Mock).mockReturnValue({
      friends: [],
      pendingRequests: [],
      isLoading: false,
      error: null,
      loadFriends: jest.fn(),
    });
    (useUserProfile as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      fetchCardDisplay: jest.fn(),
    });
  });

  it('should refresh all data when user is signed in', async () => {
    const mockFetchUserInfo = jest.fn();
    const mockFetchCardDisplay = jest.fn();
    const mockLoadCollection = jest.fn();
    const mockFetchWeeklyStats = jest.fn();
    const mockFetchLeaderboard = jest.fn();
    const mockLoadFriends = jest.fn();

    (useUserProfile as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: mockFetchUserInfo,
      fetchCardDisplay: mockFetchCardDisplay,
    });
    (useCollection as jest.Mock).mockReturnValue({
      cards: [],
      allCards: [],
      filteredTotal: 0,
      isLoading: false,
      error: null,
      loadCollection: mockLoadCollection,
    });
    (useStudyTracking as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: mockFetchWeeklyStats,
    });
    (useLeaderboard as jest.Mock).mockReturnValue({
      leaderboardData: [],
      isLoading: false,
      error: null,
      leaderboardType: 'session',
      fetchLeaderboard: mockFetchLeaderboard,
      toggleLeaderboardType: jest.fn(),
    });
    (useFriendsSync as jest.Mock).mockReturnValue({
      friends: [],
      pendingRequests: [],
      isLoading: false,
      error: null,
      loadFriends: mockLoadFriends,
    });

    const { result } = renderHook(() => useAppState());
    await act(async () => {
      await result.current.refreshAllData();
    });

    expect(mockFetchUserInfo).toHaveBeenCalledWith(mockUser.id);
    expect(mockFetchCardDisplay).toHaveBeenCalledWith(mockUser.id);
    expect(mockLoadCollection).toHaveBeenCalledWith({});
    expect(mockFetchWeeklyStats).toHaveBeenCalledWith(mockUser.id);
    expect(mockFetchLeaderboard).toHaveBeenCalledWith(mockUser.id);
    expect(mockLoadFriends).toHaveBeenCalledWith(mockUser.id);
  });
});