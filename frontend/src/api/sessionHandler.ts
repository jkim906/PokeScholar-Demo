import axios from "axios";

// Base URL for the API endpoints
const API_BASE_URL = "http://localhost:3000/api";

export interface WeeklyStats {
  date: string;
  totalDuration: number;
  completedDuration: number;
}
export interface WeeklyTotal {
  totalDuration: number;
  completedDuration: number;
}
export interface StudyStats {
  dailyStats: WeeklyStats[];
  weeklyTotal: WeeklyTotal;
}
export interface Session {
  id: string;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
}
export interface UserLevelInfo {
  id: string;
  level: number;
  coins: number;
  levelUpCoins: number;
  experience: number;
  isLevelUp: boolean;
  nextLevelNeededExperience: number;
  nextLevelExperience: number;
}

export const fetchStudyStats = async (userId: string): Promise<StudyStats> => {
  console.log("Fetching study stats for user:", userId);
  try {
    const res = await axios.get(
      `${API_BASE_URL}/session/getStudyStats/${userId}`
    );
    if (res.status !== 200) {
      throw new Error("Failed to load study stats");
    }
    console.log("Study stats fetched:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error fetching study stats:", error);
    throw new Error("Failed to fetch study stats");
  } finally {
    console.log("Study stats fetch attempt completed");
  }
};

export const startSession = async (
  userId: string,
  duration: number
): Promise<any> => {
  console.log("Starting session for user:", userId, "with duration:", duration);
  try {
    const res = await axios.post(`${API_BASE_URL}/session/start`, {
      userId,
      duration,
    });
    if (res.status !== 200) {
      throw new Error("Failed to start session");
    }
    console.log("Session started successfully");
    return res;
  } catch (error) {
    console.error("Error starting session:", error);
    throw new Error("Failed to start session");
  } finally {
    console.log("Session start attempt completed");
  }
};

export const cancelSession = async (sessionId: string): Promise<any> => {
  console.log("Cancelling session with session ID:", sessionId);
  try {
    const res = await axios.post(`${API_BASE_URL}/session/cancel/${sessionId}`);
    if (res.status !== 200) {
      throw new Error("Failed to cancel session");
    }
    console.log("Session cancelled successfully");
    return res;
  } catch (error) {
    console.error("Error cancelling session:", error);
    throw new Error("Failed to cancel session");
  } finally {
    console.log("Session cancellation attempt completed");
  }
};

export const completeSession = async (
  sessionId: string
): Promise<{ session: Session; userLevelInfo: UserLevelInfo }> => {
  console.log("Completing session with session ID:", sessionId);
  try {
    const res = await axios.post(
      `${API_BASE_URL}/session/complete/${sessionId}`
    );
    if (res.status !== 200) {
      throw new Error("Failed to complete session");
    }
    console.log("Session completed successfully");
    return res.data;
  } catch (error) {
    console.error("Error completing session:", error);
    throw new Error("Failed to complete session");
  } finally {
    console.log("Session completion attempt completed");
  }
};
