import video from "../Modals/video.js";
import history from "../Modals/history.js";
import mongoose from "mongoose";

export const handlehistory = async (req, res) => {
  const { userId } = req.body;
  const { videoId } = req.params;
  try {
    // Validate IDs before saving to avoid Mongoose cast errors
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      await history.create({ viewer: userId, videoid: videoId });
    }
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ history: true });
  } catch (error) {
    console.error("History error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const handleview = async (req, res) => {
  const { videoId } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid video ID" });
    }
    await video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    return res.status(200).json({ views: true }); // ← was missing, caused 500
  } catch (error) {
    console.error("View error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallhistoryVideo = async (req, res) => {
  const { userId } = req.params;
  try {
    const historyvideo = await history
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();
    return res.status(200).json(historyvideo);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
