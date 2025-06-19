import axios from "axios";

// Base URL for the API endpoints
const API_BASE_URL = "http://localhost:3000/api";

export interface UserInfo {
  _id: string;
  username: string;
  email: string;
  coins: number;
  experience: number;
  level: number;
  profileImage: string;
  __v: number;
  nextLevelExp: number;
}

interface UserProfile {
  profileImage?: string;
  // Add other profile fields as needed
}

export interface LeaderboardItem {
  id: string;
  name: string;
  score: number;
  avatar?: string | null;
  level?: number;
  coins?: number;
  experience?: number;
  cardDisplay?: string[];
}

export const fetchUserData = async (
  userId: string
): Promise<UserInfo | null> => {
  try {
    console.log("Fetching user data for user:", userId);
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch user data");
    }
    console.log("User data fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user Info:", error);
    return null;
  }
};

export const updateUserProfile = async (
  userId: string,
  profileData: UserProfile
): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/user/profileImage/${userId}`,
      profileData
    );
    return response.data?.profileImage;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    return null;
  }
};

export const fetchUserLeaderboard = async (
  userId: string,
  leaderboardType: "session" | "point"
): Promise<LeaderboardItem[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/leaderboard/${leaderboardType}/${userId}`
    );
    if (response.status !== 200) {
      throw new Error("Failed to fetch leaderboard data");
    }
    return response.data;
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    return [];
  }
};

/**
 * Updates the user's card display configuration
 * @param userId - The ID of the user whose display to update
 * @param cardDisplay - Array of card IDs to display
 * @returns Promise resolving to the updated display configuration
 */
export const updateUserCardDisplay = async (
  userId: string,
  cardDisplay: string[]
) => {
  try {
    console.log("Updating card display for user:", userId);
    console.log("New card display:", cardDisplay);

    const response = await axios.put(
      `${API_BASE_URL}/user/card-display/${userId}`,
      {
        cardDisplay,
      }
    );

    console.log("Card display updated successfully");
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to update card display"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while updating card display");
  }
};

/**
 * Fetches the user's card display configuration
 * @param userId - The ID of the user whose display to fetch
 * @returns Promise resolving to an array of card IDs or null values
 */
export const fetchUserCardDisplay = async (
  userId: string
): Promise<(string | null)[]> => {
  try {
    console.log("Fetching card display for user:", userId);
    const response = await axios.get(
      `${API_BASE_URL}/user/card-display/${userId}`
    );
    console.log("Card display fetched:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to fetch card display"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while fetching card display");
  }
};
