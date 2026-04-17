import mongoose from "mongoose";

const commentschema = mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    commentbody: { type: String },
    usercommented: { type: String },
    commentedon: { type: Date, default: Date.now },

    // Task 1: City of the commenter (resolved from IP at post time)
    city: { type: String, default: "Unknown" },

    // Task 1: Like / Dislike tracking (array of user ObjectIds)
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentschema);
