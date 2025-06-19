import { act } from '@testing-library/react-native';
import { useFriendsStore } from '../friendsStore';
import * as friendsHandler from '../../api/friendsHandler';
import { Mail } from '../../types/mail';


// Mock the friendsHandler module
jest.mock('../../api/friendsHandler');

describe('friendsStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useFriendsStore.setState({
        friends: [],
        pendingRequests: [],
        isLoading: false,
        error: null,
        mail: []
      });
    });
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('State Setters', () => {
    it('should set friends', () => {
      const mockFriends = [
        {
          _id: 'friend1',
          username: 'friend1',
          email: 'friend1@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      act(() => {
        useFriendsStore.getState().setFriends(mockFriends);
      });

      expect(useFriendsStore.getState().friends).toEqual(mockFriends);
    });

    it('should set pending requests', () => {
      const mockRequests = [
        {
          username: 'newfriend',
          level: 3
        }
      ];

      act(() => {
        useFriendsStore.getState().setPendingRequests(mockRequests);
      });

      expect(useFriendsStore.getState().pendingRequests).toEqual(mockRequests);
    });

    it('should set loading state', () => {
      act(() => {
        useFriendsStore.getState().setLoading(true);
      });

      expect(useFriendsStore.getState().isLoading).toBe(true);
    });

    it('should set error state', () => {
      act(() => {
        useFriendsStore.getState().setError('Test error');
      });

      expect(useFriendsStore.getState().error).toBe('Test error');
    });

    it('should set mail', () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'gift',
          amount: 100,
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        useFriendsStore.getState().setMail(mockMail);
      });

      expect(useFriendsStore.getState().mail).toEqual(mockMail);
    });
  });

  describe('loadFriends', () => {
    it('should load friends successfully', async () => {
      const mockFriends = [
        {
          _id: 'friend1',
          username: 'friend1',
          email: 'friend1@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      (friendsHandler.fetchUserFriends as jest.Mock).mockResolvedValueOnce(mockFriends);

      await act(async () => {
        await useFriendsStore.getState().loadFriends('user123');
      });

      expect(useFriendsStore.getState().friends).toEqual(mockFriends);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle load error', async () => {
      (friendsHandler.fetchUserFriends as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useFriendsStore.getState().loadFriends('user123');
      });

      expect(useFriendsStore.getState().error).toBe('Failed to fetch');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('loadFriendsRequest', () => {
    it('should load friend requests successfully', async () => {
      const mockRequests = [
        {
          username: 'newfriend',
          level: 3
        }
      ];

      (friendsHandler.fetchFriendRequests as jest.Mock).mockResolvedValueOnce(mockRequests);

      await act(async () => {
        await useFriendsStore.getState().loadFriendsRequest('user123');
      });

      expect(useFriendsStore.getState().pendingRequests).toEqual(mockRequests);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle load error', async () => {
      (friendsHandler.fetchFriendRequests as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useFriendsStore.getState().loadFriendsRequest('user123');
      });

      expect(useFriendsStore.getState().error).toBe('Failed to fetch');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request successfully', async () => {
      (friendsHandler.sendFriendRequest as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await useFriendsStore.getState().sendFriendRequest('user123', 'newfriend');
      });

      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle send error', async () => {
      (friendsHandler.sendFriendRequest as jest.Mock).mockRejectedValueOnce(new Error('Failed to send'));

      await expect(
        useFriendsStore.getState().sendFriendRequest('user123', 'newfriend')
      ).rejects.toThrow('Failed to send');

      expect(useFriendsStore.getState().error).toBe('Failed to send');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept friend request successfully', async () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'friend_request',
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        useFriendsStore.setState({ mail: mockMail });
      });

      (friendsHandler.acceptFriendRequest as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await useFriendsStore.getState().acceptFriendRequest('user123', 'friend1');
      });

      expect(useFriendsStore.getState().mail).toHaveLength(0);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle accept error', async () => {
      (friendsHandler.acceptFriendRequest as jest.Mock).mockRejectedValueOnce(new Error('Failed to accept'));

      await expect(
        useFriendsStore.getState().acceptFriendRequest('user123', 'friend1')
      ).rejects.toThrow('Failed to accept');

      expect(useFriendsStore.getState().error).toBe('Failed to accept');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('declineFriendRequest', () => {
    it('should decline friend request successfully', async () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'friend_request',
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      act(() => {
        useFriendsStore.setState({ mail: mockMail });
      });

      (friendsHandler.declineFriendRequest as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await useFriendsStore.getState().declineFriendRequest('user123', 'friend1');
      });

      expect(useFriendsStore.getState().mail).toHaveLength(0);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle decline error', async () => {
      (friendsHandler.declineFriendRequest as jest.Mock).mockRejectedValueOnce(new Error('Failed to decline'));

      await expect(
        useFriendsStore.getState().declineFriendRequest('user123', 'friend1')
      ).rejects.toThrow('Failed to decline');

      expect(useFriendsStore.getState().error).toBe('Failed to decline');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('removeFriend', () => {
    it('should remove friend successfully', async () => {
      const mockFriends = [
        {
          _id: 'friend1',
          username: 'friend1',
          email: 'friend1@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      act(() => {
        useFriendsStore.setState({ friends: mockFriends });
      });

      (friendsHandler.removeFriend as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await useFriendsStore.getState().removeFriend('user123', 'friend1');
      });

      expect(useFriendsStore.getState().friends).toHaveLength(0);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle remove error', async () => {
      (friendsHandler.removeFriend as jest.Mock).mockRejectedValueOnce(new Error('Failed to remove'));

      await act(async () => {
        await useFriendsStore.getState().removeFriend('user123', 'friend1');
      });

      expect(useFriendsStore.getState().error).toBe('Failed to remove');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('sendGift', () => {
    it('should send gift successfully', async () => {
      const mockFriends = [
        {
          _id: 'friend1',
          username: 'friend1',
          email: 'friend1@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      (friendsHandler.sendGift as jest.Mock).mockResolvedValueOnce(undefined);
      (friendsHandler.fetchUserFriends as jest.Mock).mockResolvedValueOnce(mockFriends);

      await act(async () => {
        await useFriendsStore.getState().sendGift('user123', 'friend1');
      });

      expect(useFriendsStore.getState().friends).toEqual(mockFriends);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle send error', async () => {
      (friendsHandler.sendGift as jest.Mock).mockRejectedValueOnce(new Error('Failed to send'));

      await expect(
        useFriendsStore.getState().sendGift('user123', 'friend1')
      ).rejects.toThrow('Failed to send');

      expect(useFriendsStore.getState().error).toBe('Failed to send');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('canSendGift', () => {
    it('should return true when gift can be sent', async () => {
      (friendsHandler.canSendGift as jest.Mock).mockResolvedValueOnce(true);

      const result = await useFriendsStore.getState().canSendGift('user123', 'friend1');

      expect(result).toBe(true);
    });

    it('should return false when gift cannot be sent', async () => {
      (friendsHandler.canSendGift as jest.Mock).mockResolvedValueOnce(false);

      const result = await useFriendsStore.getState().canSendGift('user123', 'friend1');

      expect(result).toBe(false);
    });

    it('should handle check error', async () => {
      (friendsHandler.canSendGift as jest.Mock).mockRejectedValueOnce(new Error('Failed to check'));

      const result = await useFriendsStore.getState().canSendGift('user123', 'friend1');

      expect(result).toBe(false);
    });
  });

  describe('loadMail', () => {
    it('should load mail successfully', async () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'gift',
          amount: 100,
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockRequests = [
        {
          username: 'newfriend',
          level: 3
        }
      ];

      (friendsHandler.fetchUncollectedMail as jest.Mock).mockResolvedValueOnce(mockMail);
      (friendsHandler.fetchFriendRequests as jest.Mock).mockResolvedValueOnce(mockRequests);

      await act(async () => {
        await useFriendsStore.getState().loadMail('user123');
      });

      expect(useFriendsStore.getState().mail).toHaveLength(2); // mail + friend request
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle load error', async () => {
      (friendsHandler.fetchUncollectedMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));

      await act(async () => {
        await useFriendsStore.getState().loadMail('user123');
      });

      expect(useFriendsStore.getState().error).toBe('Failed to fetch');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });

  describe('collectMail', () => {
    it('should collect mail successfully', async () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'gift',
          amount: 100,
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockFriends = [
        {
          _id: 'user123',
          username: 'user123',
          email: 'user123@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      act(() => {
        useFriendsStore.setState({ 
          mail: mockMail,
          friends: mockFriends
        });
      });

      (friendsHandler.collectMail as jest.Mock).mockResolvedValueOnce({ 
        success: true,
        newBalance: 1100 // 1000 + 100 from gift
      });

      await act(async () => {
        await useFriendsStore.getState().collectMail('mail1', 'user123');
      });

      expect(useFriendsStore.getState().mail).toHaveLength(0);
      expect(useFriendsStore.getState().friends[0].coins).toBe(1100);
      expect(useFriendsStore.getState().isLoading).toBe(false);
      expect(useFriendsStore.getState().error).toBe(null);
    });

    it('should handle collect error', async () => {
      const mockMail: Mail[] = [
        {
          _id: 'mail1',
          recipientId: 'user123',
          senderId: {
            _id: 'friend1',
            username: 'friend1'
          },
          type: 'gift',
          amount: 100,
          collected: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockFriends = [
        {
          _id: 'user123',
          username: 'user123',
          email: 'user123@example.com',
          profileImage: 'https://example.com/profile1.jpg',
          coins: 1000,
          experience: 500,
          level: 5,
          cardDisplay: ['card1', 'card2'],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          isOnline: true
        }
      ];

      act(() => {
        useFriendsStore.setState({ 
          mail: mockMail,
          friends: mockFriends
        });
      });

      (friendsHandler.collectMail as jest.Mock).mockRejectedValueOnce(new Error('Failed to collect'));

      await expect(
        useFriendsStore.getState().collectMail('mail1', 'user123')
      ).rejects.toThrow('Failed to collect');

      expect(useFriendsStore.getState().mail).toEqual(mockMail); // Mail should remain unchanged
      expect(useFriendsStore.getState().friends[0].coins).toBe(1000); // Coins should remain unchanged
      expect(useFriendsStore.getState().error).toBe('Failed to collect');
      expect(useFriendsStore.getState().isLoading).toBe(false);
    });
  });
}); 