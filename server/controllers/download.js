import users from "../Modals/Auth.js";
import video from "../Modals/video.js";
import path from "path";
import fs from "fs";

// ─── Helper: check if two dates are the same calendar day ────────────────────
const isSameDay = (date1, date2) => {
  if (!date1) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ─── GET /download/:videoId?userId=xxx ────────────────────────────────────────
export const downloadVideo = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.query;

  try {
    // 1. Find the video
    const videoDoc = await video.findById(videoId);
    if (!videoDoc) {
      return res.status(404).json({ message: "Video not found" });
    }

    // 2. Find the user
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const today = new Date();

    // 3. Enforce daily download limit for free / non-premium users
    if (!user.isPremium) {
      const alreadyDownloadedToday =
        isSameDay(user.lastDownloadDate, today) &&
        user.dailyDownloadCount >= 1;

      if (alreadyDownloadedToday) {
        return res.status(403).json({
          message:
            "Free users can download only 1 video per day. Upgrade to Premium for unlimited downloads.",
          limitReached: true,
        });
      }
    }

    // 4. Resolve file path
    const filePath = path.resolve(videoDoc.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Video file not found on server" });
    }

    // 5. Update user's download record
    const updateData = {
      $push: {
        downloads: {
          videoId: videoDoc._id.toString(),
          title: videoDoc.videotitle,
          filepath: videoDoc.filepath,
        },
      },
    };

    if (!user.isPremium) {
      // Reset count if it's a new day, then increment
      if (!isSameDay(user.lastDownloadDate, today)) {
        updateData.$set = { dailyDownloadCount: 1, lastDownloadDate: today };
      } else {
        updateData.$inc = { dailyDownloadCount: 1 };
        updateData.$set = { lastDownloadDate: today };
      }
    }

    await users.findByIdAndUpdate(userId, updateData);

    // 6. Stream the file as download
    const fileName = `${videoDoc.videotitle.replace(/\s+/g, "_")}.mp4`;
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "video/mp4");

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (err) => {
      console.error("File stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error streaming file" });
      }
    });
  } catch (error) {
    console.error("Download error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// ─── GET /download/history/:userId ────────────────────────────────────────────
export const getDownloadHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await users.findById(userId).select("downloads plan isPremium");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      downloads: user.downloads.sort(
        (a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt)
      ),
      plan: user.plan,
      isPremium: user.isPremium,
    });
  } catch (error) {
    console.error("Download history error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
