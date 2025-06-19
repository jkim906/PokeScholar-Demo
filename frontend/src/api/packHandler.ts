import axios from "axios";

// Base URL for the API endpoints
const API_BASE_URL = "http://localhost:3000/api";

export interface Pack {
  name: string;
  cost: number;
  code: string;
  description?: string;
  cards: string[];
}

export interface Card {
  name: string;
  rarity: string;
  small: string;
  large: string;
}

//get all packs
export const fetchAllPacks = async (): Promise<Pack[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pack`);
    if (response.status !== 200) {
      throw new Error("Failed to fetch packs");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching packs:", error);
    throw new Error("Failed to fetch packs");
  }
};

// buy a pack
export const buyPack = async (
  packCode: string,
  userId: string
): Promise<Card[]> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/pack/open/${packCode}/${userId}`
    );
    if (response.status !== 200) {
      throw new Error("Failed to buy pack");
    }
    return response.data;
  } catch (error) {
    console.error("Error buying pack:", error);
    throw new Error("Failed to buy pack");
  }
};
