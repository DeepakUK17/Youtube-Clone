const SOUTH_INDIAN_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
];

/**
 * Resolve IP to location using ip-api.com (free, no key required)
 * @param {string} ip
 * @returns {{ city, state, country }}
 */
export const getLocationFromIP = async (ip) => {
  try {
    const cleanIP = ip === "::1" || ip === "127.0.0.1" || !ip ? "" : ip;

    // Allow mock override via query param during development
    if (!cleanIP) {
      return { city: "Unknown", state: "Unknown", country: "Unknown" };
    }

    const res = await fetch(
      `http://ip-api.com/json/${cleanIP}?fields=city,regionName,country,status`
    );
    const data = await res.json();

    if (data.status === "success") {
      return {
        city:    data.city    || "Unknown",
        state:   data.regionName || "Unknown",
        country: data.country || "Unknown",
      };
    }
    return { city: "Unknown", state: "Unknown", country: "Unknown" };
  } catch {
    return { city: "Unknown", state: "Unknown", country: "Unknown" };
  }
};

/**
 * Returns true if the given state name is a South Indian state
 */
export const isSouthIndian = (state) => SOUTH_INDIAN_STATES.includes(state);

/**
 * Returns current IST hour (0–23)
 */
export const getCurrentISTHour = () => {
  const now = new Date();
  // IST = UTC + 5:30
  const istOffset = 5.5 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + istOffset) % (24 * 60);
  return Math.floor(istMinutes / 60);
};

/**
 * Returns true if current IST time is between 10:00 AM and 12:00 PM
 */
export const isLightThemeTime = () => {
  const hour = getCurrentISTHour();
  return hour >= 10 && hour < 12;
};
