import mongoose, { Schema, Document } from "mongoose";

/* ── Student Document ──────────────────────────────── */

export type StudentStatus = "active" | "kicked";

export interface IStudent extends Document {
  studentKey: string;
  name: string;
  status: StudentStatus;
  kickedAt?: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentKey: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "kicked"],
      default: "active",
      required: true,
      index: true,
    },
    kickedAt: { type: Date },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", StudentSchema);
