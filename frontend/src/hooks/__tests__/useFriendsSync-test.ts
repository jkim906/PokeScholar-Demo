import { renderHook, act } from '@testing-library/react-native';
import { useFriendsSync } from '../useFriendsSync';
import { useUser } from '@clerk/clerk-react';
import { useFriendsStore } from '../../stores/friendsStore';

jest.mock('@clerk/clerk-react');
jest.mock('../../stores/friendsStore');

describe('useFriendsSync', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  const mockFriends = [
    { id: 'friend1', username: 'friend1' },
    { id: 'friend2', username: 'friend2' },
  ];

  const mockPendingRequests = [
    { id: 'request1', username: 'request1' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });
    (useFriendsStore as unknown as jest.Mock).mockReturnValue({
      friends: [],
      pendingRequests: [],
      isLoading: false,
      error: null,
      loadFriends: jest.fn(),
      loadFriendsRequest: jest.fn(),
      removeFriend: jest.fn(),
      sendFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      declineFriendRequest: jest.fn(),
      setFriends: jest.fn(),
      setPendingRequests: jest.fn(),
      setError: jest.fn(),
    });
  });

  it('should load friends and pending requests when user is available', () => {
    const mockLoadFriends = jest.fn();
    const mockLoadFriendsRequest = jest.fn();
    (useFriendsStore as unknown as jest.Mock).mockReturnValue({
      friends: [],
      pendingRequests: [],
      isLoading: false,
      error: null,
      loadFriends: mockLoadFriends,
      loadFriendsRequest: mockLoadFriendsRequest,
      removeFriend: jest.fn(),
      sendFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      declineFriendRequest: jest.fn(),
      setFriends: jest.fn(),
      setPendingRequests: jest.fn(),
      setError: jest.fn(),
    });

    renderHook(() => useFriendsSync());
    expect(mockLoadFriends).toHaveBeenCalledWith(mockUser.id);
    expect(mockLoadFriendsRequest).toHaveBeenCalledWith(mockUser.id);
  });

  it('should clear state when user is not available', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    const mockSetFriends = jest.fn();
    const mockSetPendingRequests = jest.fn();
    const mockSetError = jest.fn();

    (useFriendsStore as unknown as jest.Mock).mockReturnValue({
      friends: [],
      pendingRequests: [],
      isLoading: false,
      error: null,
      loadFriends: jest.fn(),
      loadFriendsRequest: jest.fn(),
      removeFriend: jest.fn(),
      sendFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      declineFriendRequest: jest.fn(),
      setFriends: mockSetFriends,
      setPendingRequests: mockSetPendingRequests,
      setError: mockSetError,
    });

    renderHook(() => useFriendsSync());
    expect(mockSetFriends).toHaveBeenCalledWith([]);
    expect(mockSetPendingRequests).toHaveBeenCalledWith([]);
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it('should handle friend operations', async () => {
    const mockRemoveFriend = jest.fn();
    const mockSendFriendRequest = jest.fn();
    const mockAcceptFriendRequest = jest.fn();
    const mockDeclineFriendRequest = jest.fn();

    (useFriendsStore as unknown as jest.Mock).mockReturnValue({
      friends: mockFriends,
      pendingRequests: mockPendingRequests,
      isLoading: false,
      error: null,
      loadFriends: jest.fn(),
      loadFriendsRequest: jest.fn(),
      removeFriend: mockRemoveFriend,
      sendFriendRequest: mockSendFriendRequest,
      acceptFriendRequest: mockAcceptFriendRequest,
      declineFriendRequest: mockDeclineFriendRequest,
      setFriends: jest.fn(),
      setPendingRequests: jest.fn(),
      setError: jest.fn(),
    });

    const { result } = renderHook(() => useFriendsSync());
    await act(async () => {
      await result.current.removeFriend(mockUser.id, 'friend1');
      await result.current.sendFriendRequest(mockUser.id, 'new-friend');
      await result.current.acceptFriendRequest(mockUser.id, 'request1');
      await result.current.declineFriendRequest(mockUser.id, 'request1');
    });

    expect(mockRemoveFriend).toHaveBeenCalledWith(mockUser.id, 'friend1');
    expect(mockSendFriendRequest).toHaveBeenCalledWith(mockUser.id, 'new-friend');
    expect(mockAcceptFriendRequest).toHaveBeenCalledWith(mockUser.id, 'request1');
    expect(mockDeclineFriendRequest).toHaveBeenCalledWith(mockUser.id, 'request1');
  });
});