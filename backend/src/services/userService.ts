import { User } from "../models/User";
import { AllGameCards } from "../models/AllGameCards";
import { FriendRequest } from "../models/FriendRequest";
import { Document, Types } from "mongoose";
import path from "path";
import fs from "fs";
import { Gift } from "../models/Gift";
import { Mail } from "../models/Mail";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

type CardRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Double Rare"
  | "Illustration Rare"
  | "Special Illustration Rare";

interface CardData {
  _id: string;
  name: string;
  types: string[];
  rarity: CardRarity;
  small: string;
  large: string;
  copies: number;
  collectedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface CardFilters {
  sortBy?: string;
  order?: string;
  rarity?: CardRarity;
  name?: string;
}

interface PopulatedFriendRequest extends Document {
  _id: Types.ObjectId;
  senderId: {
    _id: Types.ObjectId;
    username: string;
    profileImage?: string;
  };
  recipientId: Types.ObjectId;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

export class UserService {
  async getUserCards(userId: string, filters: CardFilters = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all card IDs from user's collection
    const cardIds = user.cards.map((card) => card.cardId);

    // Fetch full card details for all collected cards
    const cards = await AllGameCards.find({ _id: { $in: cardIds } });

    // Combine card details with user's collection info (copies, collectedAt)
    let userCards: CardData[] = cards.map((card) => {
      const userCard = user.cards.find((uc) => uc.cardId === card._id);
      return {
        ...card.toObject(),
        copies: userCard?.copies || 0,
        collectedAt: userCard?.collectedAt,
      } as CardData;
    });

    // Apply filters
    if (filters.rarity) {
      userCards = userCards.filter((card) => card.rarity === filters.rarity);
    }

    if (filters.name) {
      const searchTerm = filters.name.toLowerCase();
      userCards = userCards.filter((card) =>
        card.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting if sortBy parameter is provided
    if (filters.sortBy) {
      userCards = this.sortCards(userCards, filters.sortBy, filters.order);
    }

    return userCards;
  }

  private sortCards(cards: CardData[], sortBy: string, order?: string) {
    const sortOrder = order === "desc" ? -1 : 1;

    switch (sortBy) {
      case "recent":
        return cards.sort((a, b) => {
          const dateA = a.collectedAt || new Date(0);
          const dateB = b.collectedAt || new Date(0);
          return (dateB.getTime() - dateA.getTime()) * sortOrder;
        });

      case "types":
        return cards.sort((a, b) => {
          const typeA = a.types[0] || ""; // Sort by first type
          const typeB = b.types[0] || "";
          return typeA.localeCompare(typeB) * sortOrder;
        });

      case "rarity":
        return cards.sort((a, b) => {
          const rarityOrder: Record<CardRarity, number> = {
            Common: 0,
            Uncommon: 1,
            Rare: 2,
            "Double Rare": 3,
            "Illustration Rare": 4,
            "Special Illustration Rare": 5,
          };
          return (rarityOrder[a.rarity] - rarityOrder[b.rarity]) * sortOrder;
        });

      case "duplicates":
        return cards.sort((a, b) => (a.copies - b.copies) * sortOrder);

      default:
        return cards;
    }
  }

  /**
   * Updates the user's card display
   * @param userId - The user's ID
   * @param cardDisplay - Array of card IDs to display
   */
  async updateCardDisplay(userId: string, cardDisplay: string[]) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate that all cards exist in user's collection
    const userCardIds = user.cards.map((card) => card.cardId);
    const invalidCards = cardDisplay.filter((id) => !userCardIds.includes(id));

    if (invalidCards.length > 0) {
      throw new Error(`Invalid card IDs: ${invalidCards.join(", ")}`);
    }

    user.cardDisplay = cardDisplay;
    await user.save();
    return user.cardDisplay;
  }

  /**
   * Gets the user's card display
   * @param userId - The user's ID
   */
  async getCardDisplay(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.cardDisplay;
  }

  /**
   * Sends a friend request from one user to another
   * @param senderId - The ID of the user sending the request
   * @param recipientUsername - The username of the user receiving the request
   * @returns The recipient's username
   * @throws Error if users are not found, already friends, or request already sent
   */
  async sendFriendRequest(
    senderId: string,
    recipientUsername: string
  ): Promise<string> {
    // Check if recipient exists
    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      throw new Error("Recipient user not found");
    }

    // Check if sender exists
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error("Sender user not found");
    }

    // Check if they're already friends
    if (recipient.friendsList.includes(senderId)) {
      throw new Error("Users are already friends");
    }

    // Check if a pending request already exists
    const existingRequest = await FriendRequest.findOne({
      senderId: sender._id,
      recipientId: recipient._id,
      status: "pending",
    });
    if (existingRequest) {
      throw new Error("Friend request already sent");
    }

    // Create new friend request
    await FriendRequest.create({
      senderId: sender._id,
      recipientId: recipient._id,
      status: "pending",
    });

    return recipient.username;
  }

  /**
   * Accepts a friend request from another user
   * @param userId - The ID of the user accepting the request
   * @param senderUsername - The username of the user who sent the request
   * @returns The sender's username
   * @throws Error if users are not found or request doesn't exist
   */
  async acceptFriendRequest(
    userId: string,
    senderUsername: string
  ): Promise<string> {
    // Check if users exist
    const recipient = await User.findById(userId);
    const sender = await User.findOne({ username: senderUsername });
    if (!recipient || !sender) {
      throw new Error("User not found");
    }

    // Find and update the friend request
    const request = await FriendRequest.findOneAndUpdate(
      {
        senderId: sender._id,
        recipientId: recipient._id,
        status: "pending",
      },
      { status: "accepted" },
      { new: true }
    );

    if (!request) {
      throw new Error("Friend request not found");
    }

    // Add each other to friends list if not already friends
    if (!recipient.friendsList.includes(sender._id.toString())) {
      recipient.friendsList.push(sender._id);
    }
    if (!sender.friendsList.includes(userId)) {
      sender.friendsList.push(userId);
    }

    // Save both users
    await Promise.all([recipient.save(), sender.save()]);

    return sender.username;
  }

  /**
   * Declines a friend request from another user
   * @param userId - The ID of the user declining the request
   * @param senderUsername - The username of the user who sent the request
   * @returns The sender's username
   * @throws Error if users are not found or request doesn't exist
   */
  async declineFriendRequest(
    userId: string,
    senderUsername: string
  ): Promise<string> {
    // Check if users exist
    const recipient = await User.findById(userId);
    const sender = await User.findOne({ username: senderUsername });
    if (!recipient || !sender) {
      throw new Error("User not found");
    }

    // Find and update the friend request
    const request = await FriendRequest.findOneAndUpdate(
      {
        senderId: sender._id,
        recipientId: recipient._id,
        status: "pending",
      },
      { status: "declined" },
      { new: true }
    );

    if (!request) {
      throw new Error("Friend request not found");
    }

    return sender.username;
  }

  /**
   * Gets all pending friend requests for a user
   * @param userId - The ID of the user
   * @returns Array of pending friend requests
   */
  async getPendingFriendRequests(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const requests = await FriendRequest.find({
      recipientId: userId,
      status: "pending",
    }).populate<{
      senderId: {
        _id: string;
        username: string;
        level: number;
      };
    }>("senderId", "username level");

    return requests.map((request) => ({
      username: request.senderId.username,
      level: request.senderId.level,
    }));
  }

  /**
   * Removes a friend from both users' friends lists
   * @param userId - The ID of the user removing the friend
   * @param friendId - The ID of the friend to remove
   * @returns The removed friend's username
   * @throws Error if users are not found or not friends
   */
  async removeFriend(userId: string, friendId: string): Promise<string> {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      throw new Error("Friend user not found");
    }

    // Check if they are friends
    if (
      !user.friendsList.includes(friendId) ||
      !friend.friendsList.includes(userId)
    ) {
      throw new Error("Users are not friends");
    }

    // Remove each other from friends lists
    user.friendsList = user.friendsList.filter((id) => id !== friendId);
    friend.friendsList = friend.friendsList.filter((id) => id !== userId);

    // Save both users
    await Promise.all([user.save(), friend.save()]);

    return friend.username;
  }

  /**
   * Gets a user's friend list with their usernames
   * @param userId - The ID of the user whose friends to get
   * @returns Array of friends with their IDs and usernames
   * @throws Error if user is not found
   */
  async getFriendsList(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all friends' user documents
    const friends = await User.find({ _id: { $in: user.friendsList } });

    // Return complete user information for each friend
    return friends.map((friend) => ({
      _id: friend._id,
      username: friend.username,
      email: friend.email,
      profileImage: friend.profileImage,
      coins: friend.coins,
      experience: friend.experience,
      level: friend.level,
      cardDisplay: friend.cardDisplay,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
    }));
  }

  async updateUserProfile(
    userId: string,
    profileImage: string // URL of the profile image
  ): Promise<{ image: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    // delete the old image if it exists
    if (user.profileImage) {
      const oldImagePath = path.join(
        __dirname,
        "../../public",
        user.profileImage
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    if (profileImage.startsWith("data:image")) {
      console.log("image start with data image Processing base64 image");
      try {
        // // Convert base64 to buffer
        // const imageBuffer = this.base64ToBuffer(profileImage);

        // Generate unique filename
        const filename = this.generateUniqueFilename(userId);

        // Save the image to the public directory
        const publicPath = path.join(__dirname, "../../public/profile-images");
        console.log("publicPath", publicPath);
        if (!fs.existsSync(publicPath)) {
          fs.mkdirSync(publicPath, { recursive: true });
        }
        let base64Data = profileImage;
        if (base64Data.startsWith("data:image")) {
          base64Data = base64Data.split(",")[1];
        }

        const filePath = path.join(publicPath, filename);
        fs.writeFileSync(filePath, base64Data, { encoding: "base64" });

        // Update user's profile image with the public URL

        const publicUrl = `/profile-images/${filename}`;
        user.profileImage = publicUrl;
      } catch (error) {
        console.error("Error processing image:", error);
        throw new Error("Invalid image data");
      }
    } else {
      // If it's already a URL, just update it
      user.profileImage = profileImage;
    }
    await user.save();
    return { image: user.profileImage };
  }

  // Helper function to generate a unique filename
  private generateUniqueFilename = (userId: string) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}_${timestamp}_${random}.jpg`;
  };

  async sendGift(senderId: string, recipientId: string) {
    // Get current time in New Zealand timezone
    const nzTimeZone = "Pacific/Auckland";
    const now = new Date();
    const nzTime = toZonedTime(now, nzTimeZone);

    // Check if a gift was already sent today
    const todayStart = new Date(nzTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(nzTime);
    todayEnd.setHours(23, 59, 59, 999);

    // Convert back to UTC for database storage
    const todayStartUtc = new Date(
      formatInTimeZone(todayStart, nzTimeZone, "yyyy-MM-dd'T'HH:mm:ssXXX")
    );
    const todayEndUtc = new Date(
      formatInTimeZone(todayEnd, nzTimeZone, "yyyy-MM-dd'T'HH:mm:ssXXX")
    );

    // Check if users exist
    const sender = await User.findById(senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new Error("Recipient not found");
    }

    // Check if they are friends
    if (!sender.friendsList.includes(recipientId)) {
      throw new Error("You can only gift friends");
    }

    // Check if a gift was already sent today
    const existingGift = await Gift.findOne({
      senderId,
      recipientId,
      giftedAt: {
        $gte: todayStartUtc,
        $lte: todayEndUtc,
      },
    });

    if (existingGift) {
      throw new Error("You have already gifted this friend today");
    }

    // Create the gift record
    const gift = new Gift({
      senderId,
      recipientId,
      giftedAt: now,
    });

    // Create mail for the recipient
    const mail = new Mail({
      recipientId,
      senderId,
      type: "gift",
      amount: 20,
    });

    await Promise.all([gift.save(), mail.save()]);

    return { gift, mail };
  }

  async getUncollectedMail(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const mail = await Mail.find({
      recipientId: userId,
      collected: false,
    }).populate("senderId", "username profileImage");

    return mail;
  }

  async collectMail(mailId: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const mail = await Mail.findOne({
      _id: mailId,
      recipientId: userId,
      collected: false,
    });

    if (!mail) {
      throw new Error("Mail not found or already collected");
    }

    // Update user's coins
    user.coins += mail.amount;

    // Mark mail as collected
    mail.collected = true;
    mail.collectedAt = new Date();

    await Promise.all([user.save(), mail.save()]);

    return { mail, newBalance: user.coins };
  }

  async canSendGift(senderId: string, recipientId: string) {
    const nzTimeZone = "Pacific/Auckland";
    const now = new Date();
    const nzTime = toZonedTime(now, nzTimeZone);

    const todayStart = new Date(nzTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(nzTime);
    todayEnd.setHours(23, 59, 59, 999);

    // Convert back to UTC for database query
    const todayStartUtc = new Date(
      formatInTimeZone(todayStart, nzTimeZone, "yyyy-MM-dd'T'HH:mm:ssXXX")
    );
    const todayEndUtc = new Date(
      formatInTimeZone(todayEnd, nzTimeZone, "yyyy-MM-dd'T'HH:mm:ssXXX")
    );

    const existingGift = await Gift.findOne({
      senderId,
      recipientId,
      giftedAt: {
        $gte: todayStartUtc,
        $lte: todayEndUtc,
      },
    });

    return !existingGift;
  }
}
