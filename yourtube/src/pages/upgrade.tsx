"use client";

import React, { useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Check, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window { Razorpay: any; }
}

type Plan = {
  id:       "bronze" | "silver" | "gold";
  name:     string;
  price:    number;
  minutes:  string;
  color:    string;
  bg:       string;
  icon:     string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id:      "bronze",
    name:    "Bronze",
    price:   10,
    minutes: "7 minutes",
    icon:    "🥉",
    color:   "text-orange-700",
    bg:      "bg-orange-50 border-orange-200",
    features: ["Watch videos up to 7 minutes", "1 download / day", "Basic support"],
  },
  {
    id:      "silver",
    name:    "Silver",
    price:   50,
    minutes: "10 minutes",
    icon:    "🥈",
    color:   "text-slate-600",
    bg:      "bg-slate-50 border-slate-200",
    features: ["Watch videos up to 10 minutes", "Unlimited downloads", "Priority support"],
  },
  {
    id:      "gold",
    name:    "Gold",
    price:   100,
    minutes: "Unlimited",
    icon:    "🥇",
    color:   "text-yellow-700",
    bg:      "bg-yellow-50 border-yellow-200",
    features: ["Unlimited watch time", "Unlimited downloads", "Premium badge", "Ad-free"],
  },
];

const FREE_PLAN = {
  name: "Free",
  minutes: "5 minutes",
  icon: "🎯",
  features: ["Watch videos up to 5 minutes", "1 download per day", "Standard support"],
};

export default function UpgradePage() {
  const { user } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRazorpay = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handleUpgrade = async (plan: Plan) => {
    if (!user) { setError("Please sign in first."); return; }
    setLoadingPlan(plan.id);
    setError("");

    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Failed to load payment gateway");

      const { data: orderData } = await axiosInstance.post("/payment/create-order", {
        plan:   plan.id,
        userId: user._id,
      });

      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "YourTube",
        description: `${plan.name} Plan — ${plan.minutes} watch time`,
        order_id:    orderData.orderId,
        prefill:     { name: user.name, email: user.email },
        theme:       { color: "#FF0000" },
        handler: async (response: any) => {
          try {
            await axiosInstance.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userId: user._id,
              plan:   plan.id,
            });
            setSuccessPlan(plan.id);
            // Reload after 2 seconds so the backend changes apply to AuthContext local state
            setTimeout(() => window.location.reload(), 2000);
          } catch {
            setError("Payment verification failed. Please contact support.");
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: { ondismiss: () => setLoadingPlan(null) },
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoadingPlan(null);
    }
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <Crown className="w-4 h-4" /> Upgrade Your Plan
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Choose the right plan for you</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Unlock more watch time and download features
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm text-center mb-6">
          {error}
        </div>
      )}

      {/* Plan cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Free plan card (non-clickable) */}
        <div className="border border-gray-200 bg-gray-50 rounded-2xl p-5 flex flex-col">
          <div className="text-2xl mb-2">{FREE_PLAN.icon}</div>
          <h2 className="text-lg font-bold text-gray-700">{FREE_PLAN.name}</h2>
          <p className="text-3xl font-bold text-gray-900 mt-1 mb-1">₹0</p>
          <p className="text-xs text-gray-400 mb-4">⏱ {FREE_PLAN.minutes} / video</p>
          <ul className="space-y-2 flex-1 mb-5">
            {FREE_PLAN.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <Check className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <div className="text-xs text-center text-gray-400 font-medium py-2 rounded-xl bg-gray-200">
            Current (Free)
          </div>
        </div>

        {/* Paid plan cards */}
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`border-2 rounded-2xl p-5 flex flex-col ${plan.bg} ${
              plan.id === "gold" ? "ring-2 ring-yellow-400 shadow-lg" : ""
            }`}
          >
            {plan.id === "gold" && (
              <div className="text-xs font-bold bg-yellow-400 text-white rounded-full px-2 py-0.5 self-start mb-2">
                ⭐ BEST VALUE
              </div>
            )}
            <div className="text-2xl mb-2">{plan.icon}</div>
            <h2 className={`text-lg font-bold ${plan.color}`}>{plan.name}</h2>
            <p className="text-3xl font-bold text-gray-900 mt-1 mb-1">₹{plan.price}</p>
            <p className="text-xs text-gray-400 mb-4">⏱ {plan.minutes} / video</p>
            <ul className="space-y-2 flex-1 mb-5">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.color}`} /> {f}
                </li>
              ))}
            </ul>

            {successPlan === plan.id ? (
              <div className="text-xs text-center text-green-600 font-semibold py-2 rounded-xl bg-green-100">
                ✅ Activated! Check your email.
              </div>
            ) : (
              <Button
                onClick={() => handleUpgrade(plan)}
                disabled={loadingPlan !== null}
                className="w-full text-white font-semibold rounded-xl"
                style={{ background: plan.id === "gold" ? "linear-gradient(135deg,#f59e0b,#d97706)" : undefined }}
              >
                <Zap className="w-4 h-4 mr-1" />
                {loadingPlan === plan.id ? "Processing..." : `Upgrade — ₹${plan.price}`}
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        🔒 All payments are secured by Razorpay. Invoice will be sent to your registered email.
      </p>
    </main>
  );
}
