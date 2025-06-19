import { act } from '@testing-library/react-native';
import { useStudyTrackingStore } from '../studyTrackingStore';
import * as sessionHandler from '../../api/sessionHandler';

// Mock the sessionHandler module
jest.mock('../../api/sessionHandler');

describe('studyTrackingStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useStudyTrackingStore.setState({
        weeklyStats: null,
        isLoading: false,
        error: null
      });
    });
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchWeeklyStats', () => {
    it('should fetch and set weekly stats successfully', async () => {
      const mockStats = {
        dailyStats: [
          {
            date: '2024-03-20',
            totalDuration: 120,
            completedDuration: 100
          }
        ],
        weeklyTotal: {
          totalDuration: 120,
          completedDuration: 100
        }
      };

      (sessionHandler.fetchStudyStats as jest.Mock).mockResolvedValueOnce(mockStats);

      await act(async () => {
        await useStudyTrackingStore.getState().fetchWeeklyStats('user123');
      });

      expect(useStudyTrackingStore.getState().weeklyStats).toEqual(mockStats);
      expect(useStudyTrackingStore.getState().isLoading).toBe(false);
      expect(useStudyTrackingStore.getState().error).toBe(null);
    });

    it('should handle fetch error', async () => {
      (sessionHandler.fetchStudyStats as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useStudyTrackingStore.getState().fetchWeeklyStats('user123');
      });

      expect(useStudyTrackingStore.getState().error).toBe('Failed to fetch study stats');
      expect(useStudyTrackingStore.getState().isLoading).toBe(false);
    });
  });
}); 