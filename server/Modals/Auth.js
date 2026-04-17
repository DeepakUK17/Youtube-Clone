import mongoose from "mongoose";

const userschema = mongoose.Schema({
  email:       { type: String, required: true },
  name:        { type: String },
  channelname: { type: String },
  description: { type: String },
  image:       { type: String },
  joinedon:    { type: Date, default: Date.now },

  // ── Task 2 & 3: Subscription plan ──────────────────────────────────────
  plan: {
    type: String,
    enum: ["free", "bronze", "silver", "gold"],
    default: "free",
  },
  isPremium: { type: Boolean, default: false },

  // ── Task 2: Download tracking ───────────────────────────────────────────
  downloads: [
    {
      videoId:      { type: String },
      title:        { type: String },
      filepath:     { type: String },
      downloadedAt: { type: Date, default: Date.now },
    },
  ],
  dailyDownloadCount: { type: Number, default: 0 },
  lastDownloadDate:   { type: Date, default: null },
});

export default mongoose.model("user", userschema);
