import mongoose from "mongoose";

const giftSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who sent the gift",
    },
    recipientId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who received the gift",
    },
    amount: {
      type: Number,
      required: true,
      default: 20,
      description: "Amount of coins gifted",
    },
    giftedAt: {
      type: Date,
      required: true,
      default: Date.now,
      description: "Date and time when the gift was sent",
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure one gift per day per sender-recipient pair
giftSchema.index(
  { senderId: 1, recipientId: 1, giftedAt: 1 },
  { unique: true }
);

export const Gift = mongoose.model("Gift", giftSchema);
