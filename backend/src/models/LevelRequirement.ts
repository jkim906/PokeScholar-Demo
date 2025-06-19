import mongoose from "mongoose";

const levelRequirementSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
    },
    experienceRequired: {
      type: Number,
      required: true,
    },
    rewardCoins: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

export const LevelRequirement = mongoose.model(
  "LevelRequirement",
  levelRequirementSchema
);
