import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Profile from '../profile';
import { useUser } from '@clerk/clerk-react';
import { useAppState } from '../../../hooks/useAppState';
import { useCollectionStore } from '../../../stores/collectionStore';
import * as ImagePicker from 'expo-image-picker';

// Mocks
jest.mock('@clerk/clerk-react');
jest.mock('../../../hooks/useAppState');
jest.mock('../../../stores/collectionStore');
jest.mock('expo-image-picker');

// Clerk mock
jest.mock('@clerk/clerk-expo', () => ({
  useClerk: () => ({
    signOut: jest.fn(),
  }),
}));

// Navigation mock
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Font loading mock
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
  isLoading: jest.fn().mockReturnValue(false),
}));

describe('Profile Component', () => {
  const mockUserInfo = {
    _id: '123',
    username: 'testuser',
    level: 5,
    experience: 750,
    nextLevelExp: 1000,
    profileImage: 'test-image.jpg',
  };

  const mockCards = [
    {
      _id: '1',
      name: 'Pikachu',
      small: 'pikachu-small.jpg',
      large: 'pikachu-large.jpg',
    },
    {
      _id: '2',
      name: 'Charizard',
      small: 'charizard-small.jpg',
      large: 'charizard-large.jpg',
    },
    {
      _id: '3',
      name: 'Squirtle',
      small: 'squirtle-small.jpg',
      large: 'squirtle-large.jpg',
    },
  ];

  const mockWeeklyStats = {
    dailyStats: [
      { date: '2024-03-10', completedDuration: 30 },
      { date: '2024-03-11', completedDuration: 45 },
    ],
    weeklyTotal: { completedDuration: 75 },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useUser as jest.Mock).mockReturnValue({
      user: { id: '123' },
      isSignedIn: true,
    });

    (useAppState as jest.Mock).mockReturnValue({
      userProfile: {
        userInfo: mockUserInfo,
        cardDisplay: ['1', '2', '3'],
        updateProfile: jest.fn(),
        updateCardDisplay: jest.fn(),
      },
      studyTracking: {
        weeklyStats: mockWeeklyStats,
        isLoading: false,
        error: null,
      },
      refreshAllData: jest.fn(),
    });

    (useCollectionStore as unknown as jest.Mock).mockReturnValue({
      cards: mockCards,
    });
  });

  it('renders profile information correctly', () => {
    const { getByText } = render(<Profile />);
    expect(getByText('testuser')).toBeTruthy();
    expect(getByText('Level 5')).toBeTruthy();
    expect(getByText('750 / 1000 XP')).toBeTruthy();
  });

  it('handles profile image update', async () => {
    const mockImagePickerResult = {
      canceled: false,
      assets: [{
        uri: 'test-uri',
        base64: 'test-base64',
      }],
    };

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockImagePickerResult);

    const { getByTestId } = render(<Profile />);
    fireEvent.press(getByTestId('profile-image'));

    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.5,
        exif: false,
      });
    });
  });

  it('displays card slots correctly', () => {
    const { getByTestId } = render(<Profile />);
    expect(getByTestId('card-slot-0')).toBeTruthy();
    expect(getByTestId('card-slot-1')).toBeTruthy();
    expect(getByTestId('card-slot-2')).toBeTruthy();
  });

  it('opens card selection modal when slot is pressed', async () => {
    const { getByTestId, queryByTestId } = render(<Profile />);
    expect(queryByTestId('card-selection-modal')).toBeNull();

    fireEvent.press(getByTestId('card-slot-2'));

    await waitFor(() => {
      expect(getByTestId('card-selection-modal')).toBeTruthy();
    });
  });

  it('displays study tracking graph correctly', () => {
    const { getByText } = render(<Profile />);
    expect(getByText('Weekly Total: 75 mins')).toBeTruthy();
  });

  it('handles loading state in study tracking', () => {
    (useAppState as jest.Mock).mockReturnValue({
      userProfile: {
        userInfo: mockUserInfo,
        cardDisplay: ['1', '2'],
        updateProfile: jest.fn(),
        updateCardDisplay: jest.fn(),
      },
      studyTracking: {
        weeklyStats: null,
        isLoading: true,
        error: null,
      },
      refreshAllData: jest.fn(),
    });

    const { getByTestId } = render(<Profile />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('handles error state in study tracking', () => {
    (useAppState as jest.Mock).mockReturnValue({
      userProfile: {
        userInfo: mockUserInfo,
        cardDisplay: ['1', '2'],
        updateProfile: jest.fn(),
        updateCardDisplay: jest.fn(),
      },
      studyTracking: {
        weeklyStats: null,
        isLoading: false,
        error: 'Failed to load study data',
      },
      refreshAllData: jest.fn(),
    });

    const { getByText } = render(<Profile />);
    expect(getByText('Failed to load study data')).toBeTruthy();
  });
  
  
});
