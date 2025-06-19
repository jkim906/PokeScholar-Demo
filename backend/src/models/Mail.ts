import mongoose from "mongoose";

const mailSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who received the mail",
    },
    senderId: {
      type: String,
      ref: "User",
      required: true,
      description: "ID of the user who sent the gift",
    },
    type: {
      type: String,
      enum: ["gift"],
      required: true,
      description: "Type of mail (currently only gift)",
    },
    amount: {
      type: Number,
      required: true,
      default: 20,
      description: "Amount of coins in the gift",
    },
    collected: {
      type: Boolean,
      default: false,
      description: "Whether the gift has been collected",
    },
    collectedAt: {
      type: Date,
      description: "When the gift was collected",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for efficient querying
mailSchema.index({ recipientId: 1, collected: 1 });
mailSchema.index({ senderId: 1, recipientId: 1, createdAt: 1 });

export const Mail = mongoose.model("Mail", mailSchema);
