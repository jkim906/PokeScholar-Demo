import axios from 'axios';
import {
  fetchUserData,
  updateUserProfile,
  fetchUserLeaderboard,
  updateUserCardDisplay,
  fetchUserCardDisplay
} from '../userHandler';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('userHandler', () => {
  const mockUserInfo = {
    _id: 'user123',
    username: 'testuser',
    email: 'test@example.com',
    coins: 1000,
    experience: 500,
    level: 5,
    profileImage: 'profile.jpg',
    __v: 0,
    nextLevelExp: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserData', () => {
    it('should fetch user data successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUserInfo, status: 200 });

      const result = await fetchUserData('user123');
      expect(result).toEqual(mockUserInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/user123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404 });

      const result = await fetchUserData('user123');
      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchUserData('user123');
      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should update profile successfully', async () => {
      const profileData = { profileImage: 'new-profile.jpg' };
      mockedAxios.post.mockResolvedValueOnce({ data: { profileImage: 'new-profile.jpg' } });

      const result = await updateUserProfile('user123', profileData);
      expect(result).toBe('new-profile.jpg');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/profileImage/user123',
        profileData
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await updateUserProfile('user123', { profileImage: 'new-profile.jpg' });
      expect(result).toBeNull();
    });
  });

  describe('fetchUserLeaderboard', () => {
    const mockLeaderboard = [
      { id: '1', name: 'User1', score: 1000 },
      { id: '2', name: 'User2', score: 800 }
    ];

    it('should fetch leaderboard successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockLeaderboard, status: 200 });

      const result = await fetchUserLeaderboard('user123', 'point');
      expect(result).toEqual(mockLeaderboard);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/leaderboard/point/user123'
      );
    });

    it('should handle non-200 status code', async () => {
      mockedAxios.get.mockResolvedValueOnce({ status: 404 });

      const result = await fetchUserLeaderboard('user123', 'point');
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchUserLeaderboard('user123', 'point');
      expect(result).toEqual([]);
    });
  });

  describe('updateUserCardDisplay', () => {
    const mockCardDisplay = ['card1', 'card2', 'card3'];

    it('should update card display successfully', async () => {
      mockedAxios.put.mockResolvedValueOnce({ data: { cardDisplay: mockCardDisplay } });

      const result = await updateUserCardDisplay('user123', mockCardDisplay);
      expect(result).toEqual({ cardDisplay: mockCardDisplay });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/card-display/user123',
        { cardDisplay: mockCardDisplay }
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Invalid card display' }
        }
      });

      await expect(updateUserCardDisplay('user123', mockCardDisplay))
        .rejects.toThrow('An unexpected error occurred while updating card display');
    });
  });

  describe('fetchUserCardDisplay', () => {
    const mockCardDisplay = ['card1', 'card2', 'card3'];

    it('should fetch card display successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockCardDisplay });

      const result = await fetchUserCardDisplay('user123');
      expect(result).toEqual(mockCardDisplay);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/card-display/user123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'User not found' }
        }
      });

      await expect(fetchUserCardDisplay('user123'))
        .rejects.toThrow('An unexpected error occurred while fetching card display');
    });
  });
}); 