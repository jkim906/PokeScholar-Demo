import mongoose from "mongoose";
import { FriendRequest } from "./FriendRequest";

// Schema for a collected card
const collectedCardSchema = new mongoose.Schema({
  cardId: {
    type: String,
    required: true,
    description: "ID of the collected card",
  },
  collectedAt: {
    type: Date,
    default: Date.now,
    description: "Date and time of card collection",
  },
  copies: {
    type: Number,
    required: true,
    default: 1,
    description: "Number of copies of this card owned by the user",
  },
});

// This schema defines a user.
const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      alias: "clerkId",
      description: "Clerk user ID (used as MongoDB _id)",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      description: "User's primary email address",
    },
    username: {
      type: String,
      required: true,
      description: "In-game display name (Clerk username)",
    },
    profileImage: {
      type: String,
      description: "URL of the user's profile image",
    },
    cards: {
      type: [collectedCardSchema],
      required: true,
      default: [],
      description: "List of collected cards with collection dates",
    },
    // Array of card IDs to display on user's profile
    cardDisplay: {
      type: [String],
      required: true,
      default: [],
      description: "Array of card IDs to display on user's profile",
    },
    coins: {
      type: Number,
      required: true,
      default: 0,
      description: "User's in-game currency",
    },
    experience: {
      type: Number,
      default: 0,
      description: "User's experience",
    },
    level: {
      type: Number,
      default: 0,
      description: "User's level",
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySession",
      description: "Reference to the current study session",
    },
    friendsList: {
      type: [String],
      required: true,
      default: [],
      description: "Array of friend user IDs",
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model("User", userSchema);
