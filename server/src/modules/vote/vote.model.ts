import mongoose, { Schema, Document } from "mongoose";

/* ── Vote Document ─────────────────────────────────── */
export interface IVote extends Document {
  pollId: mongoose.Types.ObjectId;
  studentKey: string;
  studentName: string;
  optionId: string;
  votedAt: Date;
}

const VoteSchema = new Schema<IVote>({
  pollId: {
    type: Schema.Types.ObjectId,
    ref: "Poll",
    required: true,
    index: true,
  },
  studentKey: { type: String, required: true },
  studentName: { type: String, required: true },
  optionId: { type: String, required: true },
  votedAt: { type: Date, default: Date.now },
});

/* ── UNIQUE compound index: one vote per student per poll ── */
VoteSchema.index({ pollId: 1, studentKey: 1 }, { unique: true });

export default mongoose.model<IVote>("Vote", VoteSchema);
