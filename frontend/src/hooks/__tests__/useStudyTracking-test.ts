import { renderHook, act } from '@testing-library/react-native';
import { useStudyTracking } from '../useStudyTracking';
import { useUser } from '@clerk/clerk-react';
import { useStudyTrackingStore } from '../../stores/studyTrackingStore';

// Mock the dependencies
jest.mock('@clerk/clerk-react');
jest.mock('../../stores/studyTrackingStore');

describe('useStudyTracking', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  const mockWeeklyStats = {
    totalSessions: 5,
    totalMinutes: 120,
    averageSessionLength: 24,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useStudyTrackingStore as unknown as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: jest.fn(),
    });
  });

  it('should fetch weekly stats when user is available', () => {
    const mockFetchWeeklyStats = jest.fn();
    (useStudyTrackingStore as unknown as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: mockFetchWeeklyStats,
    });

    renderHook(() => useStudyTracking());
    expect(mockFetchWeeklyStats).toHaveBeenCalledWith(mockUser.id);
  });

  it('should not fetch weekly stats when user is not available', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    const mockFetchWeeklyStats = jest.fn();
    (useStudyTrackingStore as unknown as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: mockFetchWeeklyStats,
    });

    renderHook(() => useStudyTracking());
    expect(mockFetchWeeklyStats).not.toHaveBeenCalled();
  });

  it('should return the correct data from the store', () => {
    (useStudyTrackingStore as unknown as jest.Mock).mockReturnValue({
      weeklyStats: mockWeeklyStats,
      isLoading: true,
      error: 'Test error',
      fetchWeeklyStats: jest.fn(),
    });

    const { result } = renderHook(() => useStudyTracking());
    expect(result.current.weeklyStats).toEqual(mockWeeklyStats);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
  });

  it('should allow manual refresh of weekly stats', async () => {
    const mockFetchWeeklyStats = jest.fn();
    (useStudyTrackingStore as unknown as jest.Mock).mockReturnValue({
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchWeeklyStats: mockFetchWeeklyStats,
    });

    const { result } = renderHook(() => useStudyTracking());
    await act(async () => {
      await result.current.fetchWeeklyStats('new-user-id');
    });

    expect(mockFetchWeeklyStats).toHaveBeenCalledWith('new-user-id');
  });
});