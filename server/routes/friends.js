import express from "express";
import users from "../Modals/Auth.js";

const routes = express.Router();

// GET /friends?search=name — simple user search for VoIP call target
routes.get("/", async (req, res) => {
  const { search } = req.query;
  try {
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { channelname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    const results = await users.find(query).select("name email image channelname").limit(20);
    return res.status(200).json(results);
  } catch (error) {
    console.error("Friends search error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
});

export default routes;
