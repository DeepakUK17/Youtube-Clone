"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axiosInstance from "@/lib/axiosinstance";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme:     Theme;
  otpMethod: "email" | "sms";
  isSouth:   boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme:     "dark",
  otpMethod: "email",
  isSouth:   false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme,     setTheme]     = useState<Theme>("dark");
  const [otpMethod, setOtpMethod] = useState<"email" | "sms">("email");
  const [isSouth,   setIsSouth]   = useState(false);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await axiosInstance.get("/theme/config");
        setTheme(res.data.theme);
        setOtpMethod(res.data.otpMethod);
        setIsSouth(res.data.isSouthIndia);

        // Use data-theme attribute — does NOT trigger Tailwind's dark variant
        document.documentElement.setAttribute("data-theme", res.data.theme);
      } catch {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    };
    fetchTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, otpMethod, isSouth }}>
      {children}
    </ThemeContext.Provider>
  );
};
