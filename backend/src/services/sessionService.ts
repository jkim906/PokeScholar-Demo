import {
  StudySession,
  ISessionRewards,
  IStudySession,
} from "../models/StudySession";
import { User } from "../models/User";
import { LevelRequirement } from "../models/LevelRequirement";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, addDays } from "date-fns";

interface WeeklyStats {
  date: string;
  totalDuration: number;
  completedDuration: number;
}
interface WeeklyTotal {
  totalDuration: number;
  completedDuration: number;
}
interface StudyStats {
  dailyStats: WeeklyStats[];
  weeklyTotal: WeeklyTotal;
}

interface LeaderboardItem {
  id: string;
  name: string;
  score: number;
  avatar?: string | null;
}

interface UserLevelInfo {
  id: string;
  level: number;
  coins: number;
  levelUpCoins: number;
  experience: number;
  isLevelUp: boolean;
  nextLevelNeededExperience: number;
  nextLevelExperience?: number;
}
export class SessionService {
  async startSession(userId: string, duration: number) {
    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      throw new Error("User not found");
    }

    // End any existing active session incase accidentally exit the app
    await this.endAbandonedSessions(userId);

    const studySession = await StudySession.create({
      userId,
      plannedDuration: duration,
      status: "active",
      startTime: new Date(),
    });

    // Update the user with the new session ID
    await User.updateOne(
      { _id: userId },
      { $set: { currentSession: studySession._id } }
    );

    return studySession;
  }

  async completeSession(sessionId: string) {
    const session = await StudySession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") {
      throw new Error("Session is not active");
    }
    // End the session
    session.endTime = new Date();
    // Calculate actual duration in minutes
    if (!session.startTime) {
      throw new Error("Session start time not found");
    }
    // for now is always 25 minutes for a study session
    session.actualDuration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    );

    // Check if session duration is more than planned duration
    if (session.actualDuration >= session.plannedDuration) {
      session.rewards = { coins: 50, experience: 20 } as ISessionRewards;
    }

    session.actualDuration = 25; // for now is always 25 minutes for a study session

    session.status = "completed";
    await session.save();

    const user = await this.updateUserStats(session);

    return { session, user };
  }

  private async updateUserStats(
    session: IStudySession
  ): Promise<UserLevelInfo> {
    const user = await User.findById(session.userId);
    if (!user) throw new Error("User not found");
    user.experience = user.experience ?? 0;
    user.coins = user.coins ?? 0;
    user.level = user.level ?? 0;

    const nextLevelReq = await LevelRequirement.findOne({
      level: user.level + 1,
    });

    let userLevelInfo: UserLevelInfo = {
      id: user._id,
      level: user.level,
      coins: user.coins,
      levelUpCoins: 0,
      experience: user.experience,
      isLevelUp: false,
      nextLevelNeededExperience: 0,
      nextLevelExperience: nextLevelReq?.experienceRequired,
    };

    user.coins += session.rewards?.coins || 0;
    user.experience += session.rewards?.experience || 0;

    if (nextLevelReq && user.experience < nextLevelReq.experienceRequired) {
      userLevelInfo.coins = user.coins;
      userLevelInfo.nextLevelNeededExperience =
        nextLevelReq.experienceRequired - user.experience;
      userLevelInfo.nextLevelExperience = nextLevelReq.experienceRequired;
      userLevelInfo.experience = user.experience;
    }

    if (nextLevelReq && user.experience >= nextLevelReq.experienceRequired) {
      user.level += 1;
      user.coins += nextLevelReq.rewardCoins;
      userLevelInfo.levelUpCoins = nextLevelReq.rewardCoins;
      userLevelInfo.isLevelUp = true;
      userLevelInfo.level = user.level;
      userLevelInfo.coins = user.coins;
      userLevelInfo.experience = user.experience;
      const nextTwoLevelReq = await LevelRequirement.findOne({
        level: user.level + 1,
      });

      if (nextTwoLevelReq) {
        userLevelInfo.nextLevelNeededExperience =
          nextTwoLevelReq.experienceRequired - user.experience;
        userLevelInfo.nextLevelExperience = nextTwoLevelReq.experienceRequired;
      }
    }

    user.currentSession = undefined;

    await user.save();

    return userLevelInfo;
  }

  async failSession(sessionId: string): Promise<void> {
    const session = await StudySession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    session.endTime = new Date();
    // Calculate actual duration in minutes
    session.actualDuration = Math.floor(
      (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)
    );
    session.status = "failed";
    // Set rewards to 0
    session.rewards = { coins: 0, experience: 0 } as ISessionRewards;
    await session.save();

    await User.findByIdAndUpdate(
      (
        await StudySession.findById(sessionId)
      )?.userId,
      {
        $unset: { currentSession: "" },
      }
    );
  }

  private async endAbandonedSessions(userId: string): Promise<void> {
    await StudySession.updateMany(
      {
        userId,
        status: "active",
        endTime: { $exists: false },
      },
      {
        status: "failed",
        endTime: new Date(),
        actualDuration: 0,
      }
    );
  }

  async getWeeklyStats(userId: string): Promise<StudyStats> {
    const timeZone = "Pacific/Auckland";

    // Get current date/time in NZT
    const now = new Date();
    const nowInNZ = toZonedTime(now, timeZone);

    // Start of week (Sunday 00:00 NZT)
    const startOfWeekNZ = startOfWeek(nowInNZ, { weekStartsOn: 0 }); // 0 = Sunday
    const endOfWeekNZ = addDays(startOfWeekNZ, 7); // Next Sunday

    // Convert NZ week bounds to UTC for MongoDB
    const startUTC = fromZonedTime(startOfWeekNZ, timeZone);
    const endUTC = fromZonedTime(endOfWeekNZ, timeZone);

    // Prepare dailyStats with 7 days of the week (Sunday to Saturday)
    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeekNZ, i);
      return {
        date: format(date, "yyyy-MM-dd", { timeZone }),
        totalDuration: 0,
        completedDuration: 0,
      };
    });

    // Aggregate study sessions
    const sessionStats = await StudySession.aggregate([
      {
        $match: {
          userId,
          startTime: {
            $gte: startUTC,
            $lt: endUTC,
          },
        },
      },
      {
        $addFields: {
          sessionDate: {
            $dateTrunc: {
              date: "$startTime",
              unit: "day",
              timezone: timeZone,
            },
          },
        },
      },
      {
        $group: {
          _id: "$sessionDate",
          totalDuration: { $sum: "$actualDuration" },
          completedDuration: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$actualDuration", 0],
            },
          },
        },
      },
    ]);

    // Map results to dailyStats
    sessionStats.forEach((stat) => {
      const statDate = toZonedTime(stat._id, timeZone);
      const dateStr = format(statDate, "yyyy-MM-dd", { timeZone });

      const index = dailyStats.findIndex((d) => d.date === dateStr);
      if (index !== -1) {
        dailyStats[index].totalDuration = stat.totalDuration;
        dailyStats[index].completedDuration = stat.completedDuration;
      }
    });

    const weeklyTotal = {
      totalDuration: dailyStats.reduce((sum, d) => sum + d.totalDuration, 0),
      completedDuration: dailyStats.reduce(
        (sum, d) => sum + d.completedDuration,
        0
      ),
    };

    return {
      dailyStats,
      weeklyTotal,
    };
  }

  // Helper function to consistently format dates as YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // get latest weekly leaderboard session data for this user and their friends
  async getWeeklyLeaderboardDataBySession(
    userId: string
  ): Promise<LeaderboardItem[]> {
    const timeZone = "Pacific/Auckland";

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    const friends = user.friendsList ? [...user.friendsList] : [];

    // Add current user to list
    friends.push(userId.toString());

    // Get current time in NZ
    const now = new Date();
    const nowInNZ = toZonedTime(now, timeZone);

    // Get start of week (Sunday 00:00 NZT)
    const startOfWeekNZ = startOfWeek(nowInNZ, { weekStartsOn: 0 }); // 0 = Sunday
    const startUTC = fromZonedTime(startOfWeekNZ, timeZone);

    const userSessionData = await StudySession.aggregate([
      {
        $match: {
          userId: { $in: friends },
          startTime: {
            $gte: startUTC,
          },
          status: { $eq: "completed" },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalDuration: { $sum: "$actualDuration" },
        },
      },
    ]);

    const users = await User.find({ _id: { $in: friends } });

    const leaderboard = users.map((user) => {
      const sessionData = userSessionData.find(
        (session) => session._id.toString() === user._id.toString()
      );

      return {
        id: user._id,
        name: user.username,
        avatar: user.profileImage,
        score: sessionData ? sessionData.totalDuration : 0,
      };
    });

    leaderboard.sort((a, b) => {
      if (a.score === b.score) {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score;
    });

    return leaderboard;
  }

  // get the latest weekly leaderboard data by points for this user and their friends
  async getWeeklyLeaderboardDataByPoints(
    userId: string
  ): Promise<LeaderboardItem[]> {
    const timeZone = "Pacific/Auckland";

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    const friends = user.friendsList ? [...user.friendsList] : [];

    // Add current user to list
    friends.push(userId.toString());

    // Get current time in NZ
    const now = new Date();
    const nowInNZ = toZonedTime(now, timeZone);

    // Get start of week (Sunday 00:00 NZT)
    const startOfWeekNZ = startOfWeek(nowInNZ, { weekStartsOn: 0 }); // 0 = Sunday
    const startUTC = fromZonedTime(startOfWeekNZ, timeZone);

    // Filter study sessions for the specific userIds provided
    const userSessionData = await StudySession.aggregate([
      {
        $match: {
          userId: { $in: friends },
          startTime: {
            $gte: startUTC,
          },
          status: { $eq: "completed" },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalPoints: { $sum: "$rewards.coins" },
        },
      },
    ]);

    // Fetch user information from the users collection for ALL friends
    const users = await User.find({ _id: { $in: friends } });

    // Create a complete leaderboard including users with no points
    const leaderboard = users.map((user) => {
      // Find session data for this user if it exists
      const sessionData = userSessionData.find(
        (session) => session._id.toString() === user._id.toString()
      );

      return {
        id: user._id,
        name: user.username,
        avatar: user.profileImage,
        score: sessionData ? sessionData.totalPoints : 0, // Default to 0 if no points
      };
    });

    // Sort by score, then alphabetically
    leaderboard.sort((a, b) => {
      if (a.score === b.score) {
        return a.name.localeCompare(b.name);
      }
      return b.score - a.score;
    });

    return leaderboard;
  }
}
