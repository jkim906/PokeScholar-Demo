import { act } from '@testing-library/react-native';
import { useUserStore } from '../userStore';
import * as userHandler from '../../api/userHandler';

// Mock the userHandler module
jest.mock('../../api/userHandler');

describe('userStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useUserStore.setState({
        userInfo: null,
        cardDisplay: [null, null, null],
        isLoading: false,
        error: null
      });
    });
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('fetchUserInfo', () => {
    it('should fetch and set user info successfully', async () => {
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

      (userHandler.fetchUserData as jest.Mock).mockResolvedValueOnce(mockUserInfo);

      await act(async () => {
        await useUserStore.getState().fetchUserInfo('user123');
      });

      expect(useUserStore.getState().userInfo).toEqual(mockUserInfo);
      expect(useUserStore.getState().isLoading).toBe(false);
      expect(useUserStore.getState().error).toBe(null);
    });

    it('should handle fetch error', async () => {
      (userHandler.fetchUserData as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useUserStore.getState().fetchUserInfo('user123');
      });

      expect(useUserStore.getState().error).toBe('Failed to fetch user info');
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUserInfo = {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        coins: 1000,
        experience: 500,
        level: 5,
        profileImage: 'new-profile.jpg',
        __v: 0,
        nextLevelExp: 1000
      };

      (userHandler.updateUserProfile as jest.Mock).mockResolvedValueOnce('new-profile.jpg');
      (userHandler.fetchUserData as jest.Mock).mockResolvedValueOnce(mockUserInfo);

      await act(async () => {
        await useUserStore.getState().updateProfile('user123', { profileImage: 'new-profile.jpg' });
      });

      expect(useUserStore.getState().userInfo).toEqual(mockUserInfo);
      expect(useUserStore.getState().isLoading).toBe(false);
      expect(useUserStore.getState().error).toBe(null);
    });

    it('should handle update error', async () => {
      (userHandler.updateUserProfile as jest.Mock).mockRejectedValueOnce(new Error('Failed to update'));

      await act(async () => {
        await useUserStore.getState().updateProfile('user123', { profileImage: 'new-profile.jpg' });
      });

      expect(useUserStore.getState().error).toBe('Failed to update profile');
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('updateCardDisplay', () => {
    it('should update card display successfully', async () => {
      const cardIds = ['card1', 'card2'];
      (userHandler.updateUserCardDisplay as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await useUserStore.getState().updateCardDisplay('user123', cardIds);
      });

      expect(useUserStore.getState().cardDisplay).toEqual(['card1', 'card2', null]);
      expect(useUserStore.getState().isLoading).toBe(false);
      expect(useUserStore.getState().error).toBe(null);
    });

    it('should handle update error', async () => {
      (userHandler.updateUserCardDisplay as jest.Mock).mockRejectedValueOnce(new Error('Failed to update'));

      await act(async () => {
        await useUserStore.getState().updateCardDisplay('user123', ['card1', 'card2']);
      });

      expect(useUserStore.getState().error).toBe('Failed to update card display');
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchCardDisplay', () => {
    it('should fetch card display successfully', async () => {
      const cardDisplay = ['card1', 'card2'];
      (userHandler.fetchUserCardDisplay as jest.Mock).mockResolvedValueOnce(cardDisplay);

      await act(async () => {
        await useUserStore.getState().fetchCardDisplay('user123');
      });

      expect(useUserStore.getState().cardDisplay).toEqual(['card1', 'card2', null]);
      expect(useUserStore.getState().isLoading).toBe(false);
      expect(useUserStore.getState().error).toBe(null);
    });

    it('should handle fetch error', async () => {
      (userHandler.fetchUserCardDisplay as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useUserStore.getState().fetchCardDisplay('user123');
      });

      expect(useUserStore.getState().error).toBe('Failed to fetch card display');
      expect(useUserStore.getState().isLoading).toBe(false);
    });
  });

  describe('addCoins', () => {
    it('should add coins to user balance', () => {
      const initialState = {
        userInfo: {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          coins: 1000,
          experience: 500,
          level: 5,
          profileImage: 'profile.jpg',
          __v: 0,
          nextLevelExp: 1000
        }
      };

      act(() => {
        useUserStore.setState(initialState);
        useUserStore.getState().addCoins(500);
      });

      expect(useUserStore.getState().userInfo?.coins).toBe(1500);
    });
  });

  describe('deductCoins', () => {
    it('should deduct coins from user balance', () => {
      const initialState = {
        userInfo: {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          coins: 1000,
          experience: 500,
          level: 5,
          profileImage: 'profile.jpg',
          __v: 0,
          nextLevelExp: 1000
        }
      };

      act(() => {
        useUserStore.setState(initialState);
        useUserStore.getState().deductCoins(300);
      });

      expect(useUserStore.getState().userInfo?.coins).toBe(700);
    });

    it('should not allow negative balance', () => {
      const initialState = {
        userInfo: {
          _id: 'user123',
          username: 'testuser',
          email: 'test@example.com',
          coins: 1000,
          experience: 500,
          level: 5,
          profileImage: 'profile.jpg',
          __v: 0,
          nextLevelExp: 1000
        }
      };

      act(() => {
        useUserStore.setState(initialState);
        useUserStore.getState().deductCoins(1500);
      });

      expect(useUserStore.getState().userInfo?.coins).toBe(0);
    });
  });
}); 