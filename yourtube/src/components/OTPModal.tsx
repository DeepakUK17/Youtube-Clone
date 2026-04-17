"use client";

import React, { useState, useRef } from "react";
import { X, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";

interface OTPModalProps {
  identifier: string;   // email or mobile number
  method:     "email" | "sms";
  onVerified: () => void;
  onClose:    () => void;
}

export default function OTPModal({
  identifier,
  method,
  onVerified,
  onClose,
}: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join("");

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/otp/verify", {
        identifier,
        otp: otpValue,
      });
      if (res.data.success) {
        onVerified();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    setError("");
    try {
      await axiosInstance.post("/otp/request", {
        [method === "email" ? "email" : "mobile"]: identifier,
      });
      setResent(true);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } catch {
      setError("Failed to resend OTP. Try again.");
    } finally {
      setResending(false);
    }
  };

  const masked =
    method === "email"
      ? identifier.replace(/(.{2}).+(@.+)/, "$1****$2")
      : identifier.replace(/(\d{2})\d{6}(\d{2})/, "$1******$2");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-500 to-red-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <ShieldCheck className="w-8 h-8 mb-3 text-white/80" />
          <h2 className="text-lg font-bold">Verify your identity</h2>
          <p className="text-sm text-white/80 mt-1">
            OTP sent to your {method}: <strong>{masked}</strong>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* 6-box OTP input */}
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputsRef.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 text-center text-lg font-bold border-2 rounded-lg outline-none focus:border-red-500 transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}
          {resent && (
            <p className="text-xs text-green-600 text-center">✅ OTP resent successfully!</p>
          )}

          <Button
            onClick={handleVerify}
            disabled={loading || otpValue.length !== 6}
            className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mx-auto transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Resending..." : "Resend OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}
