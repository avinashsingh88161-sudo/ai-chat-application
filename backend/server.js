import dns from "dns";
// Fix Windows DNS SRV lookup issue for MongoDB Atlas before any imports/network calls
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./route/chat.js";
import authRoutes from "./route/auth.js";

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("connected to database");
  } catch (err) {
    console.error("failed to connect database:", err.message);
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
});
