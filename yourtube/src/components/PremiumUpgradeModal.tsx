"use client";

import React, { useState } from "react";
import { X, Crown, Download, Zap, Check } from "lucide-react";
import { Button } from "./ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";

interface PremiumUpgradeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const FEATURES = [
  "Unlimited video downloads per day",
  "No daily download restrictions",
  "Priority support",
  "Ad-free experience",
  "Download history saved to profile",
];

export default function PremiumUpgradeModal({
  onClose,
  onSuccess,
}: PremiumUpgradeModalProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // 1. Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load payment gateway");

      // 2. Create order on backend
      const { data: orderData } = await axiosInstance.post(
        "/payment/create-order",
        { plan: "premium", userId: user._id }
      );

      // 3. Open Razorpay checkout
      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "YourTube",
        description: "Premium Plan — Unlimited Downloads",
        order_id:    orderData.orderId,
        prefill: {
          name:  user.name,
          email: user.email,
        },
        theme: { color: "#FF0000" },
        handler: async (response: any) => {
          try {
            // 4. Verify payment on backend
            await axiosInstance.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userId: user._id,
              plan:   "premium",
            });
            onSuccess();
            onClose();
          } catch {
            setError("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upgrade to Premium</h2>
              <p className="text-white/80 text-sm">Unlock unlimited downloads</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-red-50 border border-red-100 rounded-lg p-3">
            <Download className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>
              You&apos;ve reached your <strong>free daily download limit</strong>.
            </span>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {FEATURES.map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                {feat}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              ₹499
              <span className="text-base font-normal text-gray-500"> / month</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">Billed monthly. Cancel anytime.</p>
          </div>

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold py-3 rounded-xl text-base"
          >
            <Zap className="w-4 h-4 mr-2" />
            {loading ? "Processing..." : "Pay with Razorpay — ₹499"}
          </Button>

          <p className="text-xs text-center text-gray-400">
            🔒 Secured by Razorpay. Your payment info is never stored.
          </p>
        </div>
      </div>
    </div>
  );
}
