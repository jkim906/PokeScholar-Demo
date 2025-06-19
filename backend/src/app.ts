import express, { Express } from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import { connectToDB } from "./config/connection";
import routes from "./routes/routes";
import path from "path";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(cors());
app.use(morgan("dev"));

// Configure webhook route BEFORE body parsing middleware
app.use("/api/hook", express.raw({ type: "application/json" }));

// Body parsing middleware for all other routes
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Routes
app.use("/", routes);
app.use(
  "/profile-images",
  express.static(path.join(__dirname, "../public/profile-images"))
);

connectToDB();
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
