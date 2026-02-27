import mongoose, { Schema, Document } from "mongoose";

/* ── Sub-document: Poll Option ─────────────────────── */
export interface IPollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

const PollOptionSchema = new Schema<IPollOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false } // no auto _id on subdoc
);

/* ── Main document: Poll ──────────────────────────── */
export interface IPoll extends Document {
  question: string;
  options: IPollOption[];
  durationSec: number;
  startedAt: Date;
  status: "active" | "ended";
  endedAt?: Date;
  eligibleStudentKeys: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true },
    options: {
      type: [PollOptionSchema],
      required: true,
      validate: [(v: IPollOption[]) => v.length >= 2, "At least 2 options required"],
    },
    durationSec: { type: Number, required: true },
    startedAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "ended"],
      required: true,
      index: true,
    },
    endedAt: { type: Date },
    eligibleStudentKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IPoll>("Poll", PollSchema);
