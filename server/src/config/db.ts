import mongoose from "mongoose";
import { ENV } from "./env";

/* ── DB health state (used by controllers / socket handlers) ── */
export const dbState = {
  healthy: false,
  lastError: undefined as string | undefined,
};

/**
 * Attempt to connect to MongoDB.
 * Does NOT throw — sets dbState.healthy = false on failure
 * so the server can still start and respond with 503.
 */
export async function connectMongo(): Promise<void> {
  try {
    console.log("⏳ Connecting to MongoDB…");
    await mongoose.connect(ENV.MONGO_URI);
    dbState.healthy = true;
    dbState.lastError = undefined;
    console.log("✅ MongoDB connected:", ENV.MONGO_URI.replace(/\/\/.*@/, "//<credentials>@"));

    mongoose.connection.on("disconnected", () => {
      dbState.healthy = false;
      console.warn("❌ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      dbState.healthy = true;
      console.log("✅ MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      dbState.healthy = false;
      dbState.lastError = err.message;
      console.error("❌ MongoDB error:", err.message);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    dbState.healthy = false;
    dbState.lastError = message;
    console.error("❌ MongoDB connection failed:", message);
    console.error("   Server will start without database. DB-dependent routes return 503.");
  }
}
