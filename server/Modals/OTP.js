import mongoose from "mongoose";

const OTPSchema = mongoose.Schema({
  identifier: { type: String, required: true }, // email or mobile
  otp:        { type: String, required: true },
  method:     { type: String, enum: ["email", "sms"] },
  createdAt:  { type: Date, default: Date.now, expires: 300 }, // TTL: 5 minutes
});

export default mongoose.model("OTP", OTPSchema);
