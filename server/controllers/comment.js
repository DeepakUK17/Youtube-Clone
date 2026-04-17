import comment from "../Modals/comment.js";
import mongoose from "mongoose";

// ─── Helper: resolve city from IP using ip-api.com (free, no key needed) ──────
const getCityFromIP = async (ip) => {
  try {
    let resolvedIP = ip;

    // If loopback (localhost dev), fetch the machine's real public IP
    if (!resolvedIP || resolvedIP === "::1" || resolvedIP === "127.0.0.1") {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        resolvedIP = ipData.ip;
      } catch {
        return "Unknown";
      }
    }

    const res = await fetch(`http://ip-api.com/json/${resolvedIP}?fields=city,status`);
    const data = await res.json();
    if (data.status === "success" && data.city) return data.city;
    return "Unknown";
  } catch {
    return "Unknown";
  }
};

// ─── POST /comment/postcomment ─────────────────────────────────────────────────
export const postcomment = async (req, res) => {
  const commentdata = req.body;

  // Resolve city from requester's IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";
  const city = await getCityFromIP(ip);

  const newComment = new comment({ ...commentdata, city });
  try {
    await newComment.save();
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("Post comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── GET /comment/:videoid ─────────────────────────────────────────────────────
export const getallcomment = async (req, res) => {
  const { videoid } = req.params;
  try {
    const comments = await comment.find({ videoid }).sort({ commentedon: -1 });
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Get comments error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── DELETE /comment/deletecomment/:id ────────────────────────────────────────
export const deletecomment = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comment unavailable");
  }
  try {
    await comment.findByIdAndDelete(_id);
    return res.status(200).json({ comment: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── POST /comment/editcomment/:id ────────────────────────────────────────────
export const editcomment = async (req, res) => {
  const { id: _id } = req.params;
  const { commentbody } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).send("Comment unavailable");
  }
  try {
    const updated = await comment.findByIdAndUpdate(
      _id,
      { $set: { commentbody } },
      { new: true }
    );
    return res.status(200).json(updated);
  } catch (error) {
    console.error("Edit comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── PUT /comment/like/:id ────────────────────────────────────────────────────
// Task 1: Toggle like on a comment. If user already liked → remove like.
// If user is in dislikes → remove from dislikes and add like.
export const likecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) return res.status(404).json({ message: "Comment not found" });

    const uid = new mongoose.Types.ObjectId(userId);
    const alreadyLiked = found.likes.some((id) => id.equals(uid));

    if (alreadyLiked) {
      // Unlike
      await comment.findByIdAndUpdate(_id, { $pull: { likes: uid } });
      return res.status(200).json({ liked: false });
    } else {
      // Like + remove from dislikes if present
      await comment.findByIdAndUpdate(_id, {
        $addToSet: { likes: uid },
        $pull: { dislikes: uid },
      });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error("Like comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── PUT /comment/dislike/:id ─────────────────────────────────────────────────
// Task 1: Toggle dislike. Auto-delete comment when dislikes reach 2.
export const dislikecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }
  try {
    const found = await comment.findById(_id);
    if (!found) return res.status(404).json({ message: "Comment not found" });

    const uid = new mongoose.Types.ObjectId(userId);
    const alreadyDisliked = found.dislikes.some((id) => id.equals(uid));

    if (alreadyDisliked) {
      // Un-dislike
      await comment.findByIdAndUpdate(_id, { $pull: { dislikes: uid } });
      return res.status(200).json({ disliked: false, deleted: false });
    } else {
      // Dislike + remove from likes if present
      const updated = await comment.findByIdAndUpdate(
        _id,
        {
          $addToSet: { dislikes: uid },
          $pull: { likes: uid },
        },
        { new: true }
      );

      // Auto-delete if dislikes reach 2
      if (updated.dislikes.length >= 2) {
        await comment.findByIdAndDelete(_id);
        return res.status(200).json({ disliked: true, deleted: true });
      }

      return res.status(200).json({ disliked: true, deleted: false });
    }
  } catch (error) {
    console.error("Dislike comment error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── GET /comment/translate/:id?lang=ta ───────────────────────────────────────
// Task 1: Translate a comment using MyMemory free API (no key needed)
export const translatecomment = async (req, res) => {
  const { id: _id } = req.params;
  const { lang } = req.query; // e.g. "ta", "hi", "fr"

  if (!lang) {
    return res.status(400).json({ message: "Target language is required" });
  }
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Comment not found" });
  }

  try {
    const found = await comment.findById(_id);
    if (!found) return res.status(404).json({ message: "Comment not found" });

    const text = found.commentbody;

    // MyMemory API — completely free, no API key required (5000 chars/day)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=autodetect|${lang}`;

    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (data.responseStatus === 200) {
      return res.status(200).json({
        translated: data.responseData.translatedText,
        original: text,
      });
    } else {
      return res
        .status(500)
        .json({ message: "Translation failed. Please try again." });
    }
  } catch (error) {
    console.error("Translate comment error:", error);
    return res.status(500).json({ message: "Translation service unavailable" });
  }
};
