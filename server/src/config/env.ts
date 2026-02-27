import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || "5001", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/intervue_poll",
};
