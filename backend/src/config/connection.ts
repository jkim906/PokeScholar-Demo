import { connect, set } from "mongoose";

const DB_URI = process.env.DB_URI;

export const connectToDB = async () => {
  try {
    set("strictQuery", false);
    const db = await connect(DB_URI!);
    console.log("MongoDB connected to", db.connection.name);
  } catch (error) {
    console.error(error);
  }
};
