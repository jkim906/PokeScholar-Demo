import axios from 'axios';
import { Alert } from 'react-native';
import {
  fetchUserFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendGift,
  canSendGift,
  collectMail,
  fetchUncollectedMail
} from '../friendsHandler';

// Mock axios and Alert
jest.mock('axios');
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedAlert = Alert as jest.Mocked<typeof Alert>;

describe('friendsHandler', () => {
  const mockFriend = {
    _id: 'friend123',
    username: 'frienduser',
    email: 'friend@example.com',
    profileImage: 'profile.jpg',
    coins: 1000,
    experience: 500,
    level: 5,
    cardDisplay: ['card1', 'card2'],
    createdAt: '2024-03-20T00:00:00.000Z',
    updatedAt: '2024-03-20T00:00:00.000Z',
    isOnline: true
  };

  const mockFriendRequest = {
    username: 'newfriend',
    level: 3
  };

  const mockMail = {
    _id: 'mail123',
    recipientId: 'user123',
    senderId: {
      _id: 'friend123',
      username: 'frienduser'
    },
    type: 'gift',
    amount: 100,
    collected: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserFriends', () => {
    it('should fetch friends successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { friends: [mockFriend] } });

      const result = await fetchUserFriends('user123');
      expect(result).toEqual([mockFriend]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friends/user123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Failed to fetch friends' }
        }
      });

      await expect(fetchUserFriends('user123')).rejects.toThrow('An unexpected error occurred while fetching friends');
    });
  });

  describe('fetchFriendRequests', () => {
    it('should fetch friend requests successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: [mockFriendRequest] });

      const result = await fetchFriendRequests('user123');
      expect(result).toEqual([mockFriendRequest]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friend-requests/user123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { error: 'Failed to fetch friend requests' }
        }
      });

      await expect(fetchFriendRequests('user123')).rejects.toThrow('An unexpected error occurred while fetching friend requests');
    });
  });

  describe('sendFriendRequest', () => {
    it('should send friend request successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { recipientUsername: 'newfriend' } });

      const result = await sendFriendRequest('user123', 'newfriend');
      expect(result).toBe('newfriend');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friend-request/user123/newfriend'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to send friend request' }
        }
      });

      await expect(sendFriendRequest('user123', 'newfriend')).rejects.toThrow('An unexpected error occurred while sending friend request');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept friend request successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: { senderUsername: 'newfriend' } });

      const result = await acceptFriendRequest('user123', 'newfriend');
      expect(result).toBe('newfriend');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friend-request/user123/accept/newfriend'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to accept friend request' }
        }
      });

      await expect(acceptFriendRequest('user123', 'newfriend')).rejects.toThrow('An unexpected error occurred while accepting friend request');
    });
  });

  describe('declineFriendRequest', () => {
    it('should decline friend request successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: { senderUsername: 'newfriend' } });

      const result = await declineFriendRequest('user123', 'newfriend');
      expect(result).toBe('newfriend');
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friend-request/user123/decline/newfriend'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to decline friend request' }
        }
      });

      await expect(declineFriendRequest('user123', 'newfriend')).rejects.toThrow('An unexpected error occurred while declining friend request');
    });
  });

  describe('removeFriend', () => {
    it('should remove friend successfully', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: { friendUsername: 'frienduser' } });

      const result = await removeFriend('user123', 'friend123');
      expect(result).toBe('frienduser');
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/friends/user123/friend123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.delete.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to remove friend' }
        }
      });

      await expect(removeFriend('user123', 'friend123')).rejects.toThrow('An unexpected error occurred while removing friend');
    });
  });

  describe('sendGift', () => {
    it('should send gift successfully', async () => {
      const mockGift = { amount: 100 };
      mockedAxios.post.mockResolvedValueOnce({ data: mockGift });

      const result = await sendGift('user123', 'friend123');
      expect(result).toEqual(mockGift);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/gift/user123/friend123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to send gift' }
        }
      });

      await expect(sendGift('user123', 'friend123')).rejects.toThrow('An unexpected error occurred while sending gift');
    });
  });

  describe('canSendGift', () => {
    it('should check gift status successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { canSend: true } });

      const result = await canSendGift('user123', 'friend123');
      expect(result).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/gift/user123/friend123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to check gift status' }
        }
      });

      await expect(canSendGift('user123', 'friend123')).rejects.toThrow('An unexpected error occurred while checking gift status');
    });
  });

  describe('collectMail', () => {
    it('should collect mail successfully', async () => {
      const mockResult = { success: true };
      mockedAxios.post.mockResolvedValueOnce({ data: mockResult });

      const result = await collectMail('mail123', 'user123');
      expect(result).toEqual(mockResult);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/mail/mail123/collect/user123'
      );
    });

    it('should handle API errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Failed to collect mail' }
        }
      });

      await expect(collectMail('mail123', 'user123')).rejects.toThrow('An unexpected error occurred while collecting mail');
    });
  });

  describe('fetchUncollectedMail', () => {
    const mockMail = {
      _id: 'mail123',
      recipientId: 'user123',
      senderId: {
        _id: 'friend123',
        username: 'frienduser'
      },
      type: 'gift',
      amount: 100,
      collected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  
    it('should fetch uncollected mail successfully', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { mail: [mockMail] } });
  
      const result = await fetchUncollectedMail('user123');
      expect(result).toEqual([mockMail]);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/user/mail/user123' // or use API_BASE_URL if available
      );
    });
  
    it('should return an empty array if no mail is returned', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
  
      const result = await fetchUncollectedMail('user123');
      expect(result).toEqual([]);
    });
  
    it('should throw a specific error message from response', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { data: { error: 'Mail fetch failed' } }
      });
  
      await expect(fetchUncollectedMail('user123')).rejects.toThrow('An unexpected error occurred while fetching mail');
    });
  
    it('should throw a generic error message for unexpected errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));
  
      await expect(fetchUncollectedMail('user123')).rejects.toThrow(
        'An unexpected error occurred while fetching mail'
      );
    });
  });

}); 