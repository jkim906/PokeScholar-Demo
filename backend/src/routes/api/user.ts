import { Router, Request, Response } from "express";
import { config } from "dotenv";
import { UserService } from "../../services/userService";
import { User } from "../../models/User";
import { SessionService } from "../../services/sessionService";
import { LevelRequirement } from "../../models/LevelRequirement";

// Load environment variables
config();

// This is the API route for handling User requests
const router = Router();
const userService = new UserService();
const sessionService = new SessionService();

// GET /api/user/cards/:userId - get all cards for a specific user
router.get(
  "/cards/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    const { sortBy, order, rarity, name } = req.query;

    console.log(
      `Received request to fetch cards for user: ${userId} with filters:`,
      {
        sortBy,
        order,
        rarity,
        name,
      }
    );

    try {
      const userCards = await userService.getUserCards(userId, {
        sortBy: sortBy as string,
        order: order as string,
        rarity: rarity as
          | "Common"
          | "Uncommon"
          | "Rare"
          | "Double Rare"
          | "Illustration Rare"
          | "Special Illustration Rare"
          | undefined,
        name: name as string,
      });
      console.log(
        `Successfully found ${userCards.length} cards for user ${userId}`
      );
      res.status(200).json(userCards);
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        console.error(`Error fetching cards for user ${userId}:`, error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// GET /api/user/card-display/:userId - get user's card display
router.get(
  "/card-display/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;

    try {
      const cardDisplay = await userService.getCardDisplay(userId);
      res.status(200).json(cardDisplay);
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        console.error(`Error fetching card display for user ${userId}:`, error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// PUT /api/user/card-display/:userId - update user's card display
router.put(
  "/card-display/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    const { cardDisplay } = req.body;

    if (!Array.isArray(cardDisplay)) {
      return res.status(400).json({ error: "cardDisplay must be an array" });
    }

    try {
      const updatedDisplay = await userService.updateCardDisplay(
        userId,
        cardDisplay
      );
      res.status(200).json(updatedDisplay);
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else if (error.message.startsWith("Invalid card IDs:")) {
        res.status(400).json({ error: error.message });
      } else {
        console.error(`Error updating card display for user ${userId}:`, error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// POST /api/user/friend-request/:senderId/:recipientUsername - send a friend request
router.post(
  "/friend-request/:senderId/:recipientUsername",
  async (req: Request, res: Response): Promise<any> => {
    const { senderId, recipientUsername } = req.params;

    try {
      // Check if sender exists and get their username
      const sender = await User.findById(senderId);
      if (!sender) {
        throw new Error("Sender user not found");
      }

      // Check if user is trying to add themselves
      if (sender.username.toLowerCase() === recipientUsername.toLowerCase()) {
        throw new Error("You cannot send a friend request to yourself");
      }

      const username = await userService.sendFriendRequest(
        senderId,
        recipientUsername
      );

      res.status(200).json({
        message: "Friend request sent successfully",
        recipientUsername: username,
      });
    } catch (error: any) {
      console.error(
        `Error sending friend request from ${senderId} to ${recipientUsername}:`,
        error
      );
      if (
        error.message === "Recipient user not found" ||
        error.message === "Sender user not found" ||
        error.message === "You cannot send a friend request to yourself"
      ) {
        res.status(400).json({ error: error.message });
      } else if (
        error.message === "Users are already friends" ||
        error.message === "Friend request already sent"
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// POST /api/user/friend-request/:userId/accept/:senderUsername - accept a friend request
router.post(
  "/friend-request/:userId/accept/:senderUsername",
  async (req: Request, res: Response): Promise<any> => {
    const { userId, senderUsername } = req.params;

    try {
      const acceptedUsername = await userService.acceptFriendRequest(
        userId,
        senderUsername
      );

      res.status(200).json({
        message: "Friend request accepted successfully",
        senderUsername: acceptedUsername,
      });
    } catch (error: any) {
      console.error(
        `Error accepting friend request from ${senderUsername} for user ${userId}:`,
        error
      );
      if (
        error.message === "User not found" ||
        error.message === "Sender user not found"
      ) {
        res.status(404).json({ error: error.message });
      } else if (error.message === "Friend request not found") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// DELETE /api/user/friend-request/:userId/decline/:senderUsername - decline a friend request
router.delete(
  "/friend-request/:userId/decline/:senderUsername",
  async (req: Request, res: Response): Promise<any> => {
    const { userId, senderUsername } = req.params;

    try {
      const declinedUsername = await userService.declineFriendRequest(
        userId,
        senderUsername
      );

      res.status(200).json({
        message: "Friend request declined successfully",
        senderUsername: declinedUsername,
      });
    } catch (error: any) {
      console.error(
        `Error declining friend request from ${senderUsername} for user ${userId}:`,
        error
      );
      if (
        error.message === "User not found" ||
        error.message === "Sender user not found"
      ) {
        res.status(404).json({ error: error.message });
      } else if (error.message === "Friend request not found") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// DELETE /api/user/friends/:userId/:friendId - remove a friend
router.delete(
  "/friends/:userId/:friendId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId, friendId } = req.params;

    try {
      const friendUsername = await userService.removeFriend(userId, friendId);

      res.status(200).json({
        message: "Friend removed successfully",
        friendUsername,
      });
    } catch (error: any) {
      console.error(
        `Error removing friend ${friendId} from user ${userId}:`,
        error
      );
      if (
        error.message === "User not found" ||
        error.message === "Friend user not found"
      ) {
        res.status(404).json({ error: error.message });
      } else if (error.message === "Users are not friends") {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// GET /api/user/friends/:userId - get user's friend list
router.get(
  "/friends/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;

    try {
      const friends = await userService.getFriendsList(userId);

      res.status(200).json({
        friends,
      });
    } catch (error: any) {
      console.error(`Error getting friends list for user ${userId}:`, error);
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// GET /api/user/friend-requests/:userId - get all pending friend requests for a user
router.get(
  "/friend-requests/:userId",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { userId } = req.params;
      const requests = await userService.getPendingFriendRequests(userId);
      res.status(200).json(requests);
    } catch (error: any) {
      console.error("Error fetching friend requests:", error);
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// GET /api/user/:userId - get user details
router.get("/:userId", async (req: Request, res: Response): Promise<any> => {
  const { userId } = req.params;
  console.log(`Received request to fetch user details for user: ${userId}`);
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return res.status(404).json({ error: "User not found" });
    }
    // get the user level and exp
    const nextLevelReq = await LevelRequirement.findOne({
      level: user.level + 1,
    });
    const nextLevelExp = nextLevelReq?.experienceRequired || 0;
    console.log(`Successfully found user: ${userId}`);
    const userData = {
      ...user.toObject(),
      nextLevelExp,
    };
    res.status(200).json(userData);
  } catch (error: any) {
    console.error(`Error fetching user details for user ${userId}:`, error);
    if (error.message === "User not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// update user profile
router.post(
  "/profileImage/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    const { profileImage } = req.body;
    console.log(`Received request to update profile image for user: ${userId}`);
    try {
      // write in the user service
      const image = await userService.updateUserProfile(userId, profileImage);
      console.log(`Successfully updated profile image for user: ${userId}`);
      res.status(200).json({
        message: "Profile image updated successfully",
        profileImage: image.image,
      });
    } catch (error: any) {
      console.error(`Error updating profile image for user ${userId}:`, error);
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// get weekly leaderboard data by sessions
router.get(
  "/leaderboard/session/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    console.log(
      `Received request to fetch leaderboard session data for user: ${userId}`
    );
    try {
      const leaderboardData =
        await sessionService.getWeeklyLeaderboardDataBySession(userId);
      res.status(200).json(leaderboardData);
    } catch (error: any) {
      console.error(
        `Error fetching leaderboard data for user ${userId}:`,
        error
      );
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);
// get weekly leaderboard data by points
router.get(
  "/leaderboard/point/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;
    console.log(
      `Received request to fetch leaderboard points data for user: ${userId}`
    );
    try {
      const leaderboardData =
        await sessionService.getWeeklyLeaderboardDataByPoints(userId);
      res.status(200).json(leaderboardData);
    } catch (error: any) {
      console.error(
        `Error fetching leaderboard data for user ${userId}:`,
        error
      );
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// POST /api/user/gift/:senderId/:recipientId - send a gift to a friend
router.post(
  "/gift/:senderId/:recipientId",
  async (req: Request, res: Response): Promise<any> => {
    const { senderId, recipientId } = req.params;

    try {
      const gift = await userService.sendGift(senderId, recipientId);
      res.status(200).json({
        message: "Gift sent successfully",
        gift,
      });
    } catch (error: any) {
      console.error(
        `Error sending gift from ${senderId} to ${recipientId}:`,
        error
      );
      if (
        error.message === "Sender not found" ||
        error.message === "Recipient not found" ||
        error.message === "You can only gift friends" ||
        error.message === "You have already gifted this friend today"
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// GET /api/user/gift/:senderId/:recipientId - check if a gift can be sent
router.get(
  "/gift/:senderId/:recipientId",
  async (req: Request, res: Response): Promise<any> => {
    const { senderId, recipientId } = req.params;

    try {
      const canSend = await userService.canSendGift(senderId, recipientId);
      res.status(200).json({ canSend });
    } catch (error: any) {
      console.error(
        `Error checking gift status from ${senderId} to ${recipientId}:`,
        error
      );
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/user/mail/:userId - get user's uncollected mail
router.get(
  "/mail/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.params;

    try {
      const mail = await userService.getUncollectedMail(userId);
      res.status(200).json({ mail });
    } catch (error: any) {
      console.error(`Error fetching mail for user ${userId}:`, error);
      if (error.message === "User not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

// POST /api/user/mail/:mailId/collect/:userId - collect mail
router.post(
  "/mail/:mailId/collect/:userId",
  async (req: Request, res: Response): Promise<any> => {
    const { mailId, userId } = req.params;

    try {
      const result = await userService.collectMail(mailId, userId);
      res.status(200).json({
        message: "Mail collected successfully",
        mail: result.mail,
        newBalance: result.newBalance,
      });
    } catch (error: any) {
      console.error(
        `Error collecting mail ${mailId} for user ${userId}:`,
        error
      );
      if (
        error.message === "User not found" ||
        error.message === "Mail not found or already collected"
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }
);

export default router;
