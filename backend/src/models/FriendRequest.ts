import mongoose from "mongoose";

// Schema for friend requests
const friendRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who sent the request",
    },
    recipientId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who received the request",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      description: "Status of the friend request",
    },
  },
  {
    timestamps: true,
  }
);

export const FriendRequest = mongoose.model(
  "FriendRequest",
  friendRequestSchema
);
