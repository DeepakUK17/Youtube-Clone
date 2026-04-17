import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

// ── Route imports ─────────────────────────────────────────────────────────────
import userroutes     from "./routes/auth.js";
import videoroutes    from "./routes/video.js";
import likeroutes     from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes  from "./routes/comment.js";
import downloadroutes from "./routes/download.js";   // Task 2
import paymentroutes  from "./routes/payment.js";    // Task 2 & 3
import otproutes      from "./routes/otp.js";        // Task 4
import themeroutes    from "./routes/theme.js";      // Task 4
import friendroutes   from "./routes/friends.js";    // Task 6

// ── Socket.io handler ─────────────────────────────────────────────────────────
import { registerVoIPHandlers } from "./socket/voipSignaling.js"; // Task 6

dotenv.config();

const app = express();

// Trust proxy for accurate IP detection (Task 1 & 4)
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join("uploads")));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.send("YouTube backend is running ✅"));

app.use("/user",     userroutes);
app.use("/video",    videoroutes);
app.use("/like",     likeroutes);
app.use("/watch",    watchlaterroutes);
app.use("/history",  historyrroutes);
app.use("/comment",  commentroutes);
app.use("/download", downloadroutes);  // Task 2
app.use("/payment",  paymentroutes);   // Task 2 & 3
app.use("/otp",      otproutes);       // Task 4
app.use("/theme",    themeroutes);     // Task 4
app.use("/friends",  friendroutes);    // Task 6

// ── HTTP server + Socket.io (Task 6) ─────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  registerVoIPHandlers(io, socket);
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ── MongoDB ───────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("MongoDB connected ✅"))
  .catch((error) => console.error("MongoDB error:", error));
