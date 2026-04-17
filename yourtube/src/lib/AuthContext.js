import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";
import { registerUserSocket } from "./socket";
import OTPModal from "@/components/OTPModal";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [pendingPayload, setPendingPayload] = useState(null);
  const [showOTP, setShowOTP] = useState(false);
  const [authIdentifier, setAuthIdentifier] = useState("");

  const login = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    if (userdata?._id) {
      registerUserSocket(userdata._id);
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  // 1. Google Auth happens, but we suspend the login until OTP is verified.
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };

      // Determine OTP method based on Theme/Location config endpoint
      const configRes = await axiosInstance.get("/theme/config");
      const isSms = configRes.data.otpMethod === "sms";

      let identifier = payload.email;
      let mobile = "";

      if (isSms) {
        mobile = window.prompt("Non-South India Location Detected. Please enter your 10-digit mobile number for SMS OTP:") || "";
        if (!mobile || mobile.length < 10) {
          alert("Valid Mobile number is required for SMS authentication in your region.");
          return;
        }
        identifier = mobile;
      }

      // Request OTP from server
      await axiosInstance.post("/otp/request", {
        email: payload.email,
        mobile: mobile,
      });

      setAuthIdentifier(identifier);
      setPendingPayload(payload);
      setShowOTP(true);
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Called when OTP modal successfully verifies the PIN
  const finishLogin = async () => {
    if (!pendingPayload) return;
    try {
      const response = await axiosInstance.post("/user/login", pendingPayload);
      login(response.data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setShowOTP(false);
      setPendingPayload(null);
    }
  };

  useEffect(() => {
    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      // NOTE: For persistent sessions to truly be secure by strictly enforcing OTP on every refresh, 
      // we would clear local session and trigger OTP here too. 
      // For UX purposes, we only enforce the stringent OTP barrier on explicit login clicks.
      if (firebaseuser && !user && localStorage.getItem("user")) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          login(response.data.result);
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, handlegooglesignin }}>
      {children}
      {showOTP && (
        <OTPModal 
          identifier={authIdentifier} 
          method={authIdentifier.includes("@") ? "email" : "sms"}
          onVerified={finishLogin} 
          onClose={() => setShowOTP(false)} 
        />
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
