import express from "express";
import {
  deletecomment,
  dislikecomment,
  editcomment,
  getallcomment,
  likecomment,
  postcomment,
  translatecomment,
} from "../controllers/comment.js";
import { filterComment } from "../middleware/commentFilter.js";

const routes = express.Router();

// Existing routes
routes.get("/:videoid",            getallcomment);
routes.post("/postcomment",        filterComment, postcomment); // filterComment runs first
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id",    editcomment);

// Task 1: New routes
routes.put("/like/:id",            likecomment);
routes.put("/dislike/:id",         dislikecomment);
routes.get("/translate/:id",       translatecomment);

export default routes;
