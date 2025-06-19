import axios from "axios";

// Base URL for the API endpoints
const API_BASE_URL = "http://localhost:3000";

/**
 * CardFilters interface defines the available filters for card queries
 */
export interface CardFilters {
  rarity?: string; // Filter by card rarity
  type?: string; // Filter by card type
  search?: string; // Search term for card name
}

/**
 * Card interface defines the structure of a Pokemon card
 */
export interface Card {
  _id: string; // Unique identifier for the card
  name: string; // Name of the Pokemon card
  rarity: string; // Rarity level of the card
  types: string[]; // Array of card types
  small: string; // URL for small card image
  large: string; // URL for large card image
  copies: number; // Number of copies owned
  collectedAt: string; // Timestamp when the card was collected
}

/**
 * Fetches the user's card collection from the backend
 * @param userId - The ID of the user whose collection to fetch
 * @param filters - Optional filters to apply to the collection
 * @returns Promise resolving to an array of Card objects
 */
export const fetchUserCards = async (
  userId: string,
  filters: CardFilters = {}
): Promise<Card[]> => {
  try {
    console.log("Fetching cards for user:", userId);
    console.log("Using filters:", filters);
    console.log("API URL:", `${API_BASE_URL}/api/user/cards/${userId}`);

    const response = await axios.get(
      `${API_BASE_URL}/api/user/cards/${userId}`,
      {
        params: filters,
      }
    );

    console.log("API Response:", response.data[0]); // Log first card from API
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to fetch user cards"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while fetching user cards");
  }
};

/**
 * Fetches all available cards from the backend
 * @param filters - Optional filters to apply to the collection
 * @returns Promise resolving to an array of Card objects
 */
export const fetchAllCards = async (filters: CardFilters = {}) => {
  try {
    console.log("Fetching all cards with filters:", filters);
    const response = await axios.get(`${API_BASE_URL}/api/card`, {
      params: filters,
    });
    console.log("All cards fetched:", response.data.length);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message || "Failed to fetch all cards"
      );
    }
    console.error("Unexpected error:", error);
    throw new Error("An unexpected error occurred while fetching all cards");
  }
};
