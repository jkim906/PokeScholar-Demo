import { renderHook, act } from '@testing-library/react-native';
import { useLeaderboard } from '../useLeaderboard';
import { useUser } from '@clerk/clerk-react';
import { useLeaderboardStore } from '../../stores/leaderboardStore';

jest.mock('@clerk/clerk-react');
jest.mock('../../stores/leaderboardStore');

describe('useLeaderboard', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  const mockLeaderboardData = [
    { userId: 'user1', score: 100 },
    { userId: 'user2', score: 90 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useLeaderboardStore as unknown as jest.Mock).mockReturnValue({
      leaderboardData: [],
      isLoading: false,
      error: null,
      leaderboardType: 'session',
      fetchLeaderboard: jest.fn(),
      setLeaderboardType: jest.fn(),
    });
  });

  it('should fetch leaderboard data when user is available', () => {
    const mockFetchLeaderboard = jest.fn();
    (useLeaderboardStore as unknown as jest.Mock).mockReturnValue({
      leaderboardData: [],
      isLoading: false,
      error: null,
      leaderboardType: 'session',
      fetchLeaderboard: mockFetchLeaderboard,
      setLeaderboardType: jest.fn(),
    });

    renderHook(() => useLeaderboard());
    expect(mockFetchLeaderboard).toHaveBeenCalledWith(mockUser.id);
  });

  it('should return the correct data from the store', () => {
    (useLeaderboardStore as unknown as jest.Mock).mockReturnValue({
      leaderboardData: mockLeaderboardData,
      isLoading: true,
      error: 'Test error',
      leaderboardType: 'coin',
      fetchLeaderboard: jest.fn(),
      setLeaderboardType: jest.fn(),
    });

    const { result } = renderHook(() => useLeaderboard());
    expect(result.current.leaderboardData).toEqual(mockLeaderboardData);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
    expect(result.current.leaderboardType).toBe('coin');
  });

  it('should toggle leaderboard type', () => {
    const mockSetLeaderboardType = jest.fn();
    (useLeaderboardStore as unknown as jest.Mock).mockReturnValue({
      leaderboardData: mockLeaderboardData,
      isLoading: false,
      error: null,
      leaderboardType: 'session',
      fetchLeaderboard: jest.fn(),
      setLeaderboardType: mockSetLeaderboardType,
    });

    const { result } = renderHook(() => useLeaderboard());
    act(() => {
      result.current.toggleLeaderboardType();
    });

    expect(mockSetLeaderboardType).toHaveBeenCalledWith('coin');
  });
});