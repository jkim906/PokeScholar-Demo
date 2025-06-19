import axios from 'axios';
import {
  fetchStudyStats,
  startSession,
  cancelSession,
  completeSession
} from '../sessionHandler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('sessionHandler', () => {
  const mockStudyStats = {
    dailyStats: [
      {
        date: '2024-03-20',
        totalDuration: 3600,
        completedDuration: 3000
      },
      {
        date: '2024-03-21',
        totalDuration: 3600,
        completedDuration: 3600
      }
    ],
    weeklyTotal: {
      totalDuration: 7200,
      completedDuration: 6600
    }
  };

  const mockSession = {
    id: 'session123',
    userId: 'user123',
    startTime: '2024-03-20T10:00:00.000Z',
    endTime: '2024-03-20T11:00:00.000Z',
    duration: 3600,
    completed: true
  };

  const mockUserLevelInfo = {
    id: 'user123',
    level: 5,
    coins: 1000,
    levelUpCoins: 100,
    experience: 500,
    isLevelUp: false,
    nextLevelNeededExperience: 1000,
    nextLevelExperience: 1500
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchStudyStats', () => {
    it('should fetch study stats successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockStudyStats, status: 200 });

      const result = await fetchStudyStats('user123');
      expect(result).toEqual(mockStudyStats);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/session/getStudyStats/user123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404 });

      await expect(fetchStudyStats('user123')).rejects.toThrow('Failed to fetch study stats');
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchStudyStats('user123')).rejects.toThrow('Failed to fetch study stats');
    });
  });

  describe('startSession', () => {
    it('should start session successfully', async () => {
      const mockResponse = { data: mockSession, status: 200 };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await startSession('user123', 3600);
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/session/start',
        { userId: 'user123', duration: 3600 }
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 400 });

      await expect(startSession('user123', 3600)).rejects.toThrow('Failed to start session');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(startSession('user123', 3600)).rejects.toThrow('Failed to start session');
    });
  });

  describe('cancelSession', () => {
    it('should cancel session successfully', async () => {
      const mockResponse = { data: { success: true }, status: 200 };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await cancelSession('session123');
      expect(result).toEqual(mockResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/session/cancel/session123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 404 });

      await expect(cancelSession('session123')).rejects.toThrow('Failed to cancel session');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(cancelSession('session123')).rejects.toThrow('Failed to cancel session');
    });
  });

  describe('completeSession', () => {
    it('should complete session successfully', async () => {
      const mockResponse = {
        data: {
          session: mockSession,
          userLevelInfo: mockUserLevelInfo
        },
        status: 200
      };
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await completeSession('session123');
      expect(result).toEqual({
        session: mockSession,
        userLevelInfo: mockUserLevelInfo
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/session/complete/session123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 404 });

      await expect(completeSession('session123')).rejects.toThrow('Failed to complete session');
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(completeSession('session123')).rejects.toThrow('Failed to complete session');
    });
  });
}); 