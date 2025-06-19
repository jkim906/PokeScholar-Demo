import mongoose from "mongoose";

interface ISessionRewards {
  coins: number;
  experience: number;
}

interface IStudySession extends mongoose.Document {
  userId: string;
  plannedDuration: number;
  actualDuration?: number;
  status: "active" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  rewards?: ISessionRewards;
}

const studySessionSchema = new mongoose.Schema<IStudySession>(
  {
    userId: {
      type: String,
      required: true,
    },
    plannedDuration: {
      type: Number,
      required: true,
    },
    actualDuration: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    rewards: {
      coins: {
        type: Number,
        default: 0,
      },
      experience: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

const StudySession = mongoose.model<IStudySession>(
  "StudySession",
  studySessionSchema
);
export { StudySession, IStudySession, ISessionRewards };
