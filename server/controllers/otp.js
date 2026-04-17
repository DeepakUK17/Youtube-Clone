import OTP from "../Modals/OTP.js";
import nodemailer from "nodemailer";
import { getLocationFromIP, isSouthIndian } from "../services/locationService.js";

// ── Generate a 6-digit OTP ────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── Nodemailer transporter ────────────────────────────────────────────────────
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send OTP via Email ─────────────────────────────────────────────────────────
const sendEmailOTP = async (email, otp) => {
  await emailTransporter.sendMail({
    from:    `"YourTube Security" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: "🔐 Your YourTube Login OTP",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:24px;background:#f9f9f9;border-radius:12px;">
        <h2 style="color:#cc0000;margin-bottom:8px;">YourTube Login OTP</h2>
        <p style="color:#555;font-size:14px;">Use the OTP below to complete your login. Valid for <strong>5 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:10px;text-align:center;color:#111;background:#fff;padding:20px;border-radius:8px;border:2px dashed #e0e0e0;margin:20px 0;">
          ${otp}
        </div>
        <p style="font-size:12px;color:#aaa;text-align:center;">Do not share this OTP with anyone.</p>
      </div>
    `,
  });
};

// ── Send OTP via Fast2SMS (free, India) ───────────────────────────────────────
const sendSMSOTP = async (mobile, otp) => {
  // Fast2SMS API
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method:  "POST",
    headers: {
      authorization: process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route:         "otp",
      variables_values: otp,
      numbers:       mobile,
    }),
  });
  const data = await res.json();
  if (!data.return) throw new Error("SMS sending failed: " + JSON.stringify(data));
};

// ─── POST /otp/request ────────────────────────────────────────────────────────
// Body: { email, mobile, mockState? }
export const requestOTP = async (req, res) => {
  const { email, mobile, mockState } = req.body;

  // Resolve location from IP (or mock during development)
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
  const location = await getLocationFromIP(ip);
  const state    = mockState || location.state; // allow dev override
  const isFromSouth = isSouthIndian(state);

  const otp    = generateOTP();
  const method = isFromSouth ? "email" : "sms";

  // Delete any existing OTP for this user
  const identifier = isFromSouth ? email : mobile;
  await OTP.deleteMany({ identifier });

  // Save new OTP
  await new OTP({ identifier, otp, method }).save();

  try {
    if (isFromSouth && email) {
      await sendEmailOTP(email, otp);
    } else if (!isFromSouth && mobile) {
      await sendSMSOTP(mobile, otp);
    } else {
      // Fallback to email
      await sendEmailOTP(email, otp);
    }
    return res.status(200).json({
      success: true,
      method,
      state,
      message: `OTP sent to your ${method === "email" ? "email" : "mobile number"}`,
    });
  } catch (error) {
    console.error("OTP send error:", error);
    return res.status(500).json({ message: "Failed to send OTP. Try again." });
  }
};

// ─── POST /otp/verify ─────────────────────────────────────────────────────────
// Body: { identifier, otp }
export const verifyOTP = async (req, res) => {
  const { identifier, otp } = req.body;

  try {
    const record = await OTP.findOne({ identifier });

    if (!record) {
      return res.status(400).json({ message: "OTP expired or not found. Request a new one." });
    }
    if (record.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // OTP is valid — delete it
    await OTP.deleteOne({ _id: record._id });
    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verify error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
