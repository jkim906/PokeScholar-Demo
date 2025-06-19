import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Social from '../Social';
import { useAuth } from '@clerk/clerk-expo';
import { useUser } from '@clerk/clerk-react';
import { useFriendsStore } from '../../../stores/friendsStore';

// Mocking
jest.mock('@clerk/clerk-react');
jest.mock('../../../hooks/useAppState');

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../stores/friendsStore', () => ({
  useFriendsStore: jest.fn(),
}));

jest.mock('expo-font', () => ({
     loadAsync: jest.fn(),
     isLoaded: jest.fn().mockReturnValue(true),
     isLoading: jest.fn().mockReturnValue(false),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => callback()),
}));

describe('Social Component', () => {
    const mockUser = {
             id: '123',
             firstName: 'John',
             lastName: 'Doe',
             email: 'john.doe@example.com',
             levelInfo: {
               level: 2,
               coins: 100,
               experience: 180,
               isLevelUp: false,
               nextLevelExperience: 200,
               levelUpCoins: 10,
             }
         };

    beforeEach(() => {
        jest.clearAllMocks();

        (useAuth as jest.Mock).mockReturnValue({
          user: { id: '123' },
        });

        (useUser as jest.Mock).mockReturnValue({
            user: { id: '123', firstName: 'TestUser' },
            isSignedIn: true,
        });

        (useFriendsStore as jest.Mock).mockReturnValue({
            friends: [
                  { _id: 'friend1', name: 'Alice', coins: 10 },
                  { _id: 'friend2', name: 'Bob', coins: 5 },
                  ],
            mail: new Array(42).fill({}),
            loadMail: jest.fn(),
        });
      });

    it('renders three tabs for friends, leaderboard and mail correctly', async () => {
        const {findByTestId} = render(<Social />);

          const friendsTab = await findByTestId('friends-tab');
          const leaderboardTab = await findByTestId('leaderboard-tab');
          const mailTab = await findByTestId('mail-tab');

          expect(friendsTab).toBeTruthy();
          expect(leaderboardTab).toBeTruthy();
          expect(mailTab).toBeTruthy();
    });

    it('default active tab is "friends" on initial load', () => {
        const {getByText} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();
    });

    it('clicking on a friend opens their profile',async () => {
        const mockFriend = {
          _id: "123",
          username: "testuser",
          level: 5,
          profileImage: null,
        };

        // Setup mocks
        useAuth.mockReturnValue({
          isSignedIn: true,
          userId: "user123",
        });

        useFriendsStore.mockReturnValue({
          friends: [mockFriend],
          mail: [],
          loadMail: jest.fn(),
          isLoading: false,
          error: null,
          removeFriend: jest.fn(),
          sendFriendRequest: jest.fn(),
          sendGift: jest.fn(),
          canSendGift: jest.fn().mockResolvedValue(true),
          loadFriends: jest.fn(),
        });

        const {getByText, queryByTestId} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();

        // Press on a friend
        await act(async () => {
            fireEvent.press(getByText(/testuser/i));
        });

        await waitFor(() => {
            expect(queryByTestId("profile-modal")).toBeTruthy();
        });
    });

    it('switching to leaderboard tab renders leaderboard page correctly', async () => {
        const {getByText, findByTestId, getAllByText} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();

        await act(async () => {
            const leaderboardTab = await findByTestId('leaderboard-tab');
            fireEvent.press(leaderboardTab);
        });

        expect(getAllByText(/Leaderboard/i).length).toBeGreaterThan(0);
    });

    it('switching to mail tab renders mail page correctly', async () => {
        const {getByText, findByTestId, getAllByText} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();

        await act(async () => {
            const mailTab = await findByTestId('mail-tab');
            fireEvent.press(mailTab);
        });

        expect(getAllByText(/Mail/i).length).toBeGreaterThan(0);
    });

    it('mail badge renders with correct count', async () => {
        const {getByText, findByTestId, getAllByText} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();

        await act(async () => {
            const mailTab = await findByTestId('mail-tab');
            fireEvent.press(mailTab);
        });

        expect(getAllByText(/Mail/i).length).toBeGreaterThan(0);

        expect(getByText("42")).toBeTruthy();

    });

    it('mail badge hidden when there is no mail', async () => {
        (useFriendsStore as jest.Mock).mockReturnValue({
            friends: [
                  { _id: 'friend1', name: 'Alice', coins: 10 },
                  { _id: 'friend2', name: 'Bob', coins: 5 },
                  ],
            mail: [],
            loadMail: jest.fn(),
        });

        const {getByText, findByTestId, getAllByText, queryByText, queryByTestId} = render(<Social />);

        expect(getByText(/Friends/i)).toBeTruthy();

        await act(async () => {
            const mailTab = await findByTestId('mail-tab');
            fireEvent.press(mailTab);
        });

        expect(getAllByText(/Mail/i).length).toBeGreaterThan(0);

        expect(queryByText("0")).toBeNull(); // badge shouldn't render "0"
        expect(queryByTestId("mail-badge")).toBeNull();

    });

});

