import express from "express";
import { requestOTP, verifyOTP } from "../controllers/otp.js";

const routes = express.Router();
routes.post("/request", requestOTP);
routes.post("/verify",  verifyOTP);
export default routes;
