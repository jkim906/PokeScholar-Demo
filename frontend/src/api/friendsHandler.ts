import axios from "axios";
import { Alert } from "react-native";

// Base URL for the API endpoints
export const API_BASE_URL = "http://localhost:3000";

/**
 * Friend interface defines the structure of a friend
 */
export interface Friend {
  _id: string; // Unique identifier for the friend
  username: string; // Username of the friend
  email: string; // Email of the friend
  profileImage?: string; // URL of the friend's profile image
  coins: number; // Friend's in-game currency
  experience: number; // Friend's experience points
  level: number; // Friend's level
  cardDisplay: string[]; // Array of card IDs displayed on friend's profile
  createdAt: string; // Date when the friend's account was created
  updatedAt: string; // Date when the friend's account was last updated
  isOnline?: boolean;
}

/**
 * FriendRequest interface defines the structure of a friend request
 */
export interface FriendRequest {
  username: string;
  level: number;
}

/**
 * Mail interface defines the structure of a mail
 */
export interface Mail {
  _id: string;
  recipientId: string;
  senderId: {
    _id: string;
    username: string;
  };
  type: "gift" | "friend_request";
  amount?: number; // Optional since friend requests don't have amount
  collected: boolean;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetches the user's friends list from the backend
 * @param userId - The ID of the user whose friends to fetch
 * @returns Promise resolving to an array of Friend objects
 */
export const fetchUserFriends = async (userId: string): Promise<Friend[]> => {
  try {
    console.log("Fetching friends for user:", userId);
    const response = await axios.get(
      `${API_BASE_URL}/api/user/friends/${userId}`
    );
    console.log("API Response:", response.data);
    return response.data.friends || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(error.response?.data?.error || "Failed to fetch friends");
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while fetching friends");
  }
};

/**
 * Fetches the user's pending friend requests from the backend
 * @param userId - The ID of the user whose friend requests to fetch
 * @returns Promise resolving to an array of FriendRequest objects
 */
export const fetchFriendRequests = async (
  userId: string
): Promise<FriendRequest[]> => {
  try {
    console.log("Fetching friend requests for user:", userId);
    const response = await axios.get(
      `${API_BASE_URL}/api/user/friend-requests/${userId}`
    );
    console.log("API Response:", response.data);
    return response.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.error || "Failed to fetch friend requests"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error(
      "An unexpected error occurred while fetching friend requests"
    );
  }
};

/**
 * Sends a friend request to another user
 * @param senderId - The ID of the current user
 * @param recipientUsername - The username of the user to send the request to
 * @returns Promise resolving to the recipient's username
 */
export const sendFriendRequest = async (
  senderId: string,
  recipientUsername: string
): Promise<string> => {
  try {
    console.log(
      "Sending friend request from:",
      senderId,
      "to:",
      recipientUsername
    );
    const response = await axios.post(
      `${API_BASE_URL}/api/user/friend-request/${senderId}/${recipientUsername}`
    );

    if (!response.data || !response.data.recipientUsername) {
      throw new Error("Invalid response from server");
    }

    return response.data.recipientUsername;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Ensure we're throwing a proper error with the message from the server
      throw new Error(
        error.response?.data?.error || "Failed to send friend request"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error(
      "An unexpected error occurred while sending friend request"
    );
  }
};

/**
 * Accepts a friend request
 * @param userId - The ID of the current user
 * @param username - The username of the user who sent the request
 * @returns Promise resolving to the sender's username
 */
export const acceptFriendRequest = async (
  userId: string,
  username: string
): Promise<string> => {
  try {
    console.log("Accepting friend request from:", username);
    const response = await axios.post(
      `${API_BASE_URL}/api/user/friend-request/${userId}/accept/${username}`
    );
    return response.data.senderUsername;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.error || "Failed to accept friend request"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error(
      "An unexpected error occurred while accepting friend request"
    );
  }
};

/**
 * Declines a friend request
 * @param userId - The ID of the current user
 * @param username - The username of the user who sent the request
 * @returns Promise resolving to the sender's username
 */
export const declineFriendRequest = async (
  userId: string,
  username: string
): Promise<string> => {
  try {
    console.log("Declining friend request from:", username);
    const response = await axios.delete(
      `${API_BASE_URL}/api/user/friend-request/${userId}/decline/${username}`
    );

    if (!response.data || !response.data.senderUsername) {
      throw new Error("Invalid response from server");
    }

    return response.data.senderUsername;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.error || "Failed to decline friend request"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error(
      "An unexpected error occurred while declining friend request"
    );
  }
};

/**
 * Removes a friend
 * @param userId - The ID of the current user
 * @param friendId - The ID of the friend to remove
 * @returns Promise resolving to the friend's username
 */
export const removeFriend = async (
  userId: string,
  friendId: string
): Promise<string> => {
  try {
    console.log("Removing friend:", friendId);
    const response = await axios.delete(
      `${API_BASE_URL}/api/user/friends/${userId}/${friendId}`
    );
    return response.data.friendUsername;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(error.response?.data?.error || "Failed to remove friend");
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while removing friend");
  }
};

/**
 * Handles the removal of a friend with confirmation dialog
 * @param userId - The ID of the current user
 * @param friendId - The ID of the friend to remove
 * @param onSuccess - Callback function to execute on successful removal
 * @param onError - Callback function to execute on error
 */
export const handleRemoveFriend = async (
  userId: string,
  friendId: string,
  onSuccess: () => void,
  onError: (error: Error) => void
) => {
  Alert.alert("Remove Friend", "Are you sure you want to remove this friend?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Remove",
      style: "destructive",
      onPress: async () => {
        try {
          await removeFriend(userId, friendId);
          onSuccess();
        } catch (error) {
          onError(
            error instanceof Error
              ? error
              : new Error("Failed to remove friend")
          );
        }
      },
    },
  ]);
};

/**
 * Handles sending a gift to a friend
 * @param friendId - The ID of the friend to send a gift to
 */
export const handleSendGift = (friendId: string) => {
  Alert.alert("Coming Soon", "Gift feature coming soon!");
};

/**
 * Sends a gift to a friend
 * @param senderId - The ID of the user sending the gift
 * @param recipientId - The ID of the user receiving the gift
 * @returns Promise resolving to the gift object
 */
export const sendGift = async (senderId: string, recipientId: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/user/gift/${senderId}/${recipientId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to send gift");
    }
    throw new Error("An unexpected error occurred while sending gift");
  }
};

/**
 * Checks if a gift can be sent to a friend
 * @param senderId - The ID of the user sending the gift
 * @param recipientId - The ID of the user receiving the gift
 * @returns Promise resolving to a boolean indicating if a gift can be sent
 */
export const canSendGift = async (senderId: string, recipientId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/user/gift/${senderId}/${recipientId}`
    );
    return response.data.canSend;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.error || "Failed to check gift status"
      );
    }
    throw new Error("An unexpected error occurred while checking gift status");
  }
};

/**
 * Gets the user's uncollected mail
 * @param userId - The ID of the user
 * @returns Promise resolving to an array of Mail objects
 */
export const fetchUncollectedMail = async (userId: string): Promise<Mail[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/mail/${userId}`);
    return response.data.mail || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to fetch mail");
    }
    throw new Error("An unexpected error occurred while fetching mail");
  }
};

/**
 * Collects a mail item
 * @param mailId - The ID of the mail to collect
 * @param userId - The ID of the user collecting the mail
 * @returns Promise resolving to the collection result
 */
export const collectMail = async (mailId: string, userId: string) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/user/mail/${mailId}/collect/${userId}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to collect mail");
    }
    throw new Error("An unexpected error occurred while collecting mail");
  }
};
