import { create } from "zustand";
import {
  Friend,
  FriendRequest,
  Mail,
  fetchUserFriends,
  fetchFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  API_BASE_URL,
  sendGift,
  canSendGift,
  fetchUncollectedMail,
  collectMail,
} from "../api/friendsHandler";
import axios from "axios";

/**
 * FriendsState interface defines the shape of the friends store
 * This store manages the user's friends list and related data
 */
interface FriendsState {
  // User's friends list
  friends: Friend[];
  // Pending friend requests
  pendingRequests: FriendRequest[];
  // Loading state indicator
  isLoading: boolean;
  // Error message if any
  error: string | null;
  // Mail
  mail: Mail[];
  // State setters
  setFriends: (friends: Friend[]) => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setMail: (mail: Mail[]) => void;
  // Friend management functions
  loadFriends: (userId: string) => Promise<void>;
  loadFriendsRequest: (userId: string) => Promise<void>;
  sendFriendRequest: (
    senderId: string,
    recipientUsername: string
  ) => Promise<void>;
  acceptFriendRequest: (userId: string, username: string) => Promise<void>;
  declineFriendRequest: (userId: string, username: string) => Promise<void>;
  removeFriend: (userId: string, friendId: string) => Promise<void>;
  sendGift: (senderId: string, recipientId: string) => Promise<void>;
  canSendGift: (senderId: string, recipientId: string) => Promise<boolean>;
  loadMail: (userId: string) => Promise<void>;
  collectMail: (mailId: string, userId: string) => Promise<void>;
}

/**
 * useFriendsStore is a Zustand store that manages the state of the user's friends list
 * The data is persisted in MongoDB and fetched when needed
 */
export const useFriendsStore = create<FriendsState>((set) => ({
  // Initial state
  friends: [],
  pendingRequests: [],
  isLoading: false,
  error: null,
  mail: [],

  // State setters
  setFriends: (friends) => {
    console.log("Setting friends in store:", friends);
    set({ friends });
  },
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setMail: (mail) => set({ mail }),

  /**
   * Loads the user's friends list
   * @param userId - The ID of the current user
   */
  loadFriends: async (userId: string) => {
    try {
      console.log("Loading friends for user:", userId);
      set({ isLoading: true, error: null });
      const friends = await fetchUserFriends(userId);
      console.log("Fetched friends:", friends);
      set({ friends, isLoading: false });
    } catch (error) {
      console.error("Error loading friends:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load friends";
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Loads the user's pending friend requests
   * @param userId - The ID of the current user
   */
  loadFriendsRequest: async (userId: string) => {
    try {
      console.log("Loading friend requests for user:", userId);
      set({ isLoading: true, error: null });
      const requests = await fetchFriendRequests(userId);
      console.log("Fetched friend requests:", requests);
      set({ pendingRequests: requests, isLoading: false });
    } catch (error) {
      console.error("Error loading friend requests:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load friend requests";
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Sends a friend request to another user
   * @param senderId - The ID of the current user
   * @param recipientUsername - The username of the user to send the request to
   */
  sendFriendRequest: async (senderId: string, recipientUsername: string) => {
    try {
      set({ isLoading: true, error: null });
      await sendFriendRequest(senderId, recipientUsername);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send friend request";
      set({ error: errorMessage });
      throw error; // Re-throw to let the component handle it
    } finally {
      set({ isLoading: false }); // Always reset loading state
    }
  },

  /**
   * Accepts a friend request
   * @param userId - The ID of the current user
   * @param username - The username of the user who sent the request
   */
  acceptFriendRequest: async (userId: string, username: string) => {
    try {
      set({ isLoading: true, error: null });
      await acceptFriendRequest(userId, username);
      // Update mail list to remove the accepted request
      set((state) => ({
        mail: state.mail.filter(
          (m) =>
            !(m.type === "friend_request" && m.senderId.username === username)
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to accept friend request";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Declines a friend request
   * @param userId - The ID of the current user
   * @param username - The username of the user who sent the request
   */
  declineFriendRequest: async (userId: string, username: string) => {
    try {
      set({ isLoading: true, error: null });
      await declineFriendRequest(userId, username);
      // Update mail list to remove the declined request
      set((state) => ({
        mail: state.mail.filter(
          (m) =>
            !(m.type === "friend_request" && m.senderId.username === username)
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to decline friend request";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Removes a friend
   * @param userId - The ID of the current user
   * @param friendId - The ID of the friend to remove
   */
  removeFriend: async (userId: string, friendId: string) => {
    try {
      set({ isLoading: true, error: null });
      await removeFriend(userId, friendId);
      // Update friends list after removal
      set((state) => ({
        friends: state.friends.filter((friend) => friend._id !== friendId),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove friend";
      set({ error: errorMessage, isLoading: false });
      console.error("Error removing friend:", error);
    }
  },

  sendGift: async (senderId: string, recipientId: string) => {
    try {
      set({ isLoading: true, error: null });
      await sendGift(senderId, recipientId);
      // Reload friends list to update coins
      const friends = await fetchUserFriends(senderId);
      set({ friends, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send gift";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  canSendGift: async (senderId: string, recipientId: string) => {
    try {
      return await canSendGift(senderId, recipientId);
    } catch (error) {
      console.error("Error checking gift status:", error);
      return false;
    }
  },

  loadMail: async (userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const [mail, requests] = await Promise.all([
        fetchUncollectedMail(userId),
        fetchFriendRequests(userId),
      ]);

      // Convert friend requests to mail format
      const friendRequestMail: Mail[] = requests.map((request) => ({
        _id: `request_${request.username}`,
        recipientId: userId,
        senderId: {
          _id: request.username,
          username: request.username,
        },
        type: "friend_request",
        collected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      set({ mail: [...mail, ...friendRequestMail], isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load mail";
      set({ error: errorMessage, isLoading: false });
    }
  },

  collectMail: async (mailId: string, userId: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await collectMail(mailId, userId);
      // Update mail list and user's coins
      set((state) => ({
        mail: state.mail.filter((m) => m._id !== mailId),
        friends: state.friends.map((friend) =>
          friend._id === userId
            ? { ...friend, coins: result.newBalance }
            : friend
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to collect mail";
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
