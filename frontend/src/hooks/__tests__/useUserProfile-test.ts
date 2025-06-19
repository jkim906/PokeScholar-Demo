import { renderHook, act } from '@testing-library/react-native';
import { useUserProfile } from '../useUserProfile';
import { useUser } from '@clerk/clerk-react';
import { useUserStore } from '../../stores/userStore';

// Mock the dependencies
jest.mock('@clerk/clerk-react');
jest.mock('../../stores/userStore');

describe('useUserProfile', () => {
  const mockUser = {
    id: 'test-user-id',
  };

  const mockUserInfo = {
    _id: 'test-user-id',
    username: 'testuser',
    profileImage: 'test-image.jpg',
    coins: 100,
  };

  const mockCardDisplay = ['card1', 'card2', null];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock useUser hook
    (useUser as jest.Mock).mockReturnValue({ user: mockUser });

    // Mock useUserStore
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });
  });

  it('should fetch user info and card display when user is available', () => {
    const mockFetchUserInfo = jest.fn();
    const mockFetchCardDisplay = jest.fn();

    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: mockFetchUserInfo,
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: mockFetchCardDisplay,
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    renderHook(() => useUserProfile());

    expect(mockFetchUserInfo).toHaveBeenCalledWith(mockUser.id);
    expect(mockFetchCardDisplay).toHaveBeenCalledWith(mockUser.id);
  });

  it('should not fetch data when user is not available', () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });

    const mockFetchUserInfo = jest.fn();
    const mockFetchCardDisplay = jest.fn();

    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: mockFetchUserInfo,
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: mockFetchCardDisplay,
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    renderHook(() => useUserProfile());

    expect(mockFetchUserInfo).not.toHaveBeenCalled();
    expect(mockFetchCardDisplay).not.toHaveBeenCalled();
  });

  it('should return the correct data from the store', () => {
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: mockUserInfo,
      cardDisplay: mockCardDisplay,
      isLoading: true,
      error: 'Test error',
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    expect(result.current.userInfo).toEqual(mockUserInfo);
    expect(result.current.cardDisplay).toEqual(mockCardDisplay);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Test error');
  });

  it('should handle profile updates', async () => {
    const mockUpdateProfile = jest.fn();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: mockUserInfo,
      cardDisplay: mockCardDisplay,
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: mockUpdateProfile,
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    await act(async () => {
      await result.current.updateProfile({ profileImage: 'new-image.jpg' });
    });

    expect(mockUpdateProfile).toHaveBeenCalledWith(mockUser.id, { profileImage: 'new-image.jpg' });
  });

  it('should reject profile update when user is not available', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    
    const mockUpdateProfile = jest.fn();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: mockUpdateProfile,
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    await expect(result.current.updateProfile({ profileImage: 'new-image.jpg' }))
      .rejects.toBe('No user ID');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('should handle card display updates', async () => {
    const mockUpdateCardDisplay = jest.fn();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: mockUserInfo,
      cardDisplay: mockCardDisplay,
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: mockUpdateCardDisplay,
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    await act(async () => {
      await result.current.updateCardDisplay(['card1', 'card2', 'card3']);
    });

    expect(mockUpdateCardDisplay).toHaveBeenCalledWith(mockUser.id, ['card1', 'card2', 'card3']);
  });

  it('should reject card display update when user is not available', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    
    const mockUpdateCardDisplay = jest.fn();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: mockUpdateCardDisplay,
      fetchCardDisplay: jest.fn(),
      addCoins: jest.fn(),
      deductCoins: jest.fn(),
    });

    const { result } = renderHook(() => useUserProfile());

    await expect(result.current.updateCardDisplay(['card1', 'card2', 'card3']))
      .rejects.toBe('No user ID');
    expect(mockUpdateCardDisplay).not.toHaveBeenCalled();
  });

  it('should handle coin operations', async () => {
    const mockAddCoins = jest.fn().mockResolvedValue(undefined);
    const mockDeductCoins = jest.fn().mockResolvedValue(undefined);
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: mockUserInfo,
      cardDisplay: mockCardDisplay,
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: mockAddCoins,
      deductCoins: mockDeductCoins,
    });

    const { result } = renderHook(() => useUserProfile());
    await act(async () => {
      await result.current.addCoins(50);
      await result.current.deductCoins(20);
    });

    // Check that the functions were called with the correct arguments
    expect(mockAddCoins).toHaveBeenCalledWith(50);
    expect(mockDeductCoins).toHaveBeenCalledWith(20);
  });

  it('should handle coin operations when user is not available', async () => {
    (useUser as jest.Mock).mockReturnValue({ user: null });
    const mockAddCoins = jest.fn();
    const mockDeductCoins = jest.fn();
    (useUserStore as unknown as jest.Mock).mockReturnValue({
      userInfo: null,
      cardDisplay: [null, null, null],
      isLoading: false,
      error: null,
      fetchUserInfo: jest.fn(),
      updateProfile: jest.fn(),
      updateCardDisplay: jest.fn(),
      fetchCardDisplay: jest.fn(),
      addCoins: mockAddCoins,
      deductCoins: mockDeductCoins,
    });

    const { result } = renderHook(() => useUserProfile());
    
    
    await act(async () => {
      await result.current.addCoins(50);
      await result.current.deductCoins(20);
    });
    
    expect(mockAddCoins).toHaveBeenCalledWith( 50);
    expect(mockDeductCoins).toHaveBeenCalledWith( 20);
  });
}); 