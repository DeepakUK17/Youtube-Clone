import { getLocationFromIP, isSouthIndian, isLightThemeTime } from "../services/locationService.js";

// ─── GET /theme/config ────────────────────────────────────────────────────────
// Returns the theme and OTP method based on current time + requester's location.
// Accepts ?mockState=Tamil Nadu for development override.
export const getThemeConfig = async (req, res) => {
  const { mockState } = req.query;

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
  const location = await getLocationFromIP(ip);
  const state    = mockState || location.state;

  const southIndia   = isSouthIndian(state);
  const lightTime    = isLightThemeTime();
  const isLightTheme = southIndia && lightTime;

  return res.status(200).json({
    theme:     isLightTheme ? "light" : "dark",
    otpMethod: southIndia ? "email" : "sms",
    state,
    city:      location.city,
    isSouthIndia: southIndia,
    currentISTHour: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: true,
    }),
  });
};
