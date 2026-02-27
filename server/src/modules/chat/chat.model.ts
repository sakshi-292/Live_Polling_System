import mongoose, { Schema, Document } from "mongoose";

/* ── Chat Message Document ─────────────────────────── */

export interface IChatMessage extends Document {
  pollId: string;
  fromKey: string;
  fromName: string;
  text: string;
  ts: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    pollId: { type: String, required: true, index: true },
    fromKey: { type: String, required: true },
    fromName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 300 },
    ts: { type: Date, required: true, default: Date.now },
  },
  { timestamps: false } // we use our own `ts` field
);

// Index for efficient retrieval of recent messages per poll
ChatMessageSchema.index({ pollId: 1, ts: -1 });

export default mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
