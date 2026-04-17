"use client";

import React from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/router";

interface WatchLimitOverlayProps {
  plan: string;
  minutesWatched: number;
}

const PLAN_LIMITS: Record<string, number> = {
  free:   5,
  bronze: 7,
  silver: 10,
  gold:   Infinity,
};

const NEXT_PLAN: Record<string, string> = {
  free:   "Bronze (₹10) — 7 min",
  bronze: "Silver (₹50) — 10 min",
  silver: "Gold (₹100) — Unlimited",
  gold:   "",
};

export default function WatchLimitOverlay({
  plan,
  minutesWatched,
}: WatchLimitOverlayProps) {
  const router = useRouter();

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm text-white text-center px-6">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-4">
        <Clock className="w-8 h-8 text-red-400" />
      </div>

      <h2 className="text-xl font-bold mb-2">
        Your {PLAN_LIMITS[plan]}-Minute Limit Reached
      </h2>
      <p className="text-gray-300 text-sm mb-6 max-w-xs">
        You&apos;ve watched <strong>{minutesWatched} minutes</strong> on the{" "}
        <span className="capitalize font-semibold text-white">{plan}</span> plan.
        Upgrade to keep watching!
      </p>

      {NEXT_PLAN[plan] && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-3 mb-5 text-sm w-full max-w-xs">
          <p className="text-gray-400 text-xs mb-1">Next plan</p>
          <p className="font-semibold">{NEXT_PLAN[plan]}</p>
        </div>
      )}

      <Button
        onClick={() => router.push("/upgrade")}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2"
      >
        Upgrade Plan
        <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-gray-500 mt-3">
        Free plan resets after the video ends or page refresh.
      </p>
    </div>
  );
}
