import express from "express";
import { getThemeConfig } from "../controllers/theme.js";

const routes = express.Router();
routes.get("/config", getThemeConfig);
export default routes;
