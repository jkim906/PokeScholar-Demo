import { act } from '@testing-library/react-native';
import { useLeaderboardStore } from '../leaderboardStore';
import * as userHandler from '../../api/userHandler';

// Mock the userHandler module
jest.mock('../../api/userHandler');

describe('leaderboardStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useLeaderboardStore.setState({
        leaderboardData: [],
        isLoading: false,
        error: null,
        leaderboardType: 'session'
      });
    });
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchLeaderboard', () => {
    it('should fetch and set leaderboard data successfully', async () => {
      const mockLeaderboardData = [
        {
          id: 'user1',
          name: 'User 1',
          score: 100,
          avatar: 'avatar1.jpg',
          level: 5,
          coins: 1000,
          experience: 500,
          cardDisplay: ['card1', 'card2']
        },
        {
          id: 'user2',
          name: 'User 2',
          score: 90,
          avatar: 'avatar2.jpg',
          level: 4,
          coins: 800,
          experience: 400,
          cardDisplay: ['card3', 'card4']
        }
      ];

      (userHandler.fetchUserLeaderboard as jest.Mock).mockResolvedValueOnce(mockLeaderboardData);

      await act(async () => {
        await useLeaderboardStore.getState().fetchLeaderboard('user123');
      });

      expect(useLeaderboardStore.getState().leaderboardData).toEqual(mockLeaderboardData);
      expect(useLeaderboardStore.getState().isLoading).toBe(false);
      expect(useLeaderboardStore.getState().error).toBe(null);
    });

    it('should handle fetch error', async () => {
      (userHandler.fetchUserLeaderboard as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useLeaderboardStore.getState().fetchLeaderboard('user123');
      });

      expect(useLeaderboardStore.getState().error).toBe('Failed to fetch leaderboard data');
      expect(useLeaderboardStore.getState().isLoading).toBe(false);
    });
  });

  describe('setLeaderboardType', () => {
    it('should update leaderboard type', () => {
      act(() => {
        useLeaderboardStore.getState().setLeaderboardType('coin');
      });

      expect(useLeaderboardStore.getState().leaderboardType).toBe('coin');
    });

    it('should update leaderboard type back to session', () => {
      act(() => {
        useLeaderboardStore.getState().setLeaderboardType('session');
      });

      expect(useLeaderboardStore.getState().leaderboardType).toBe('session');
    });
  });
}); 