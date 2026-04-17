import express from "express";
import { downloadVideo, getDownloadHistory } from "../controllers/download.js";

const routes = express.Router();

routes.get("/history/:userId", getDownloadHistory);  // must be before /:videoId
routes.get("/:videoId",        downloadVideo);

export default routes;
