"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import WatchLimitOverlay from "./WatchLimitOverlay";
import { useUser } from "@/lib/AuthContext";

// ── Plan watch-time limits (seconds) ─────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {
  free:   300,   // 5 min
  bronze: 420,   // 7 min
  silver: 600,   // 10 min
  gold:   Infinity,
};

interface VideoPlayerProps {
  video: {
    _id:        string;
    videotitle: string;
    filepath:   string;
  };
  onNextVideo?:    () => void;
  onOpenComments?: () => void;
}

// ── Gesture feedback overlay ──────────────────────────────────────────────────
type Feedback = { text: string; key: number } | null;

export default function VideoPlayer({
  video,
  onNextVideo,
  onOpenComments,
}: VideoPlayerProps) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const { user }      = useUser();

  // Task 3: Watch-time enforcement
  const [watchedSeconds, setWatchedSeconds]   = useState(0);
  const [limitReached,   setLimitReached]     = useState(false);
  const plan = (user as any)?.plan || "free";
  const limitSeconds = PLAN_LIMITS[plan] ?? 300;

  // Task 5: Gesture feedback
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Tap tracking per zone
  const tapCount  = useRef<Record<string, number>>({ left: 0, center: 0, right: 0 });
  const tapTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // ── Task 3: Watch timer ─────────────────────────────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const interval = setInterval(() => {
      if (!vid.paused && !vid.ended) {
        setWatchedSeconds((s) => {
          const next = s + 1;
          if (next >= limitSeconds) {
            vid.pause();
            setLimitReached(true);
          }
          return next;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [limitSeconds]);

  // ── Task 5: Show visual feedback briefly ───────────────────────────────
  const showFeedback = useCallback((text: string) => {
    setFeedback({ text, key: Date.now() });
    setTimeout(() => setFeedback(null), 700);
  }, []);

  // ── Task 5: Get tap zone ───────────────────────────────────────────────
  const getZone = (clientX: number): "left" | "center" | "right" => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return "center";
    const x = clientX - rect.left;
    const w = rect.width;
    if (x < w / 3)      return "left";
    if (x > (2 * w) / 3) return "right";
    return "center";
  };

  // ── Task 5: Execute gesture action ─────────────────────────────────────
  const executeGesture = useCallback(
    (zone: "left" | "center" | "right", count: number) => {
      const vid = videoRef.current;
      if (!vid) return;

      if (zone === "center" && count === 1) {
        vid.paused ? vid.play() : vid.pause();
        showFeedback(vid.paused ? "▶" : "⏸");
      } else if (zone === "left" && count === 2) {
        vid.currentTime = Math.max(0, vid.currentTime - 10);
        showFeedback("◀◀  -10s");
      } else if (zone === "right" && count === 2) {
        vid.currentTime = Math.min(vid.duration, vid.currentTime + 10);
        showFeedback("▶▶  +10s");
      } else if (zone === "center" && count >= 3) {
        showFeedback("⏭ Next Video");
        onNextVideo?.();
      } else if (zone === "right" && count >= 3) {
        showFeedback("❌ Closing...");
        setTimeout(() => window.close(), 500);
      } else if (zone === "left" && count >= 3) {
        showFeedback("💬 Comments");
        onOpenComments?.();
      }
    },
    [onNextVideo, onOpenComments, showFeedback]
  );

  // ── Task 5: Handle click/tap ───────────────────────────────────────────
  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      let clientX: number;
      if ("touches" in e) {
        clientX = e.changedTouches[0].clientX;
      } else {
        clientX = (e as React.MouseEvent).clientX;
      }

      const zone = getZone(clientX);
      tapCount.current[zone] = (tapCount.current[zone] || 0) + 1;

      clearTimeout(tapTimers.current[zone]);
      tapTimers.current[zone] = setTimeout(() => {
        const count = tapCount.current[zone];
        tapCount.current[zone] = 0;
        executeGesture(zone, count);
      }, 300);
    },
    [executeGesture]
  );

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-lg overflow-hidden select-none cursor-pointer"
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      {/* ── Video element ── */}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={false}
      >
        <source
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/${video?.filepath?.replace(/\\/g, "/")}`}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* ── Task 5: Gesture feedback overlay ── */}
      {feedback && (
        <div
          key={feedback.key}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="text-white text-2xl font-bold bg-black/50 rounded-2xl px-6 py-3 animate-in fade-in zoom-in-75 duration-150">
            {feedback.text}
          </div>
        </div>
      )}

      {/* ── Gesture zone hint overlays (invisible, just for UX clarity) ── */}
      <div className="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
        {["LEFT", "CENTER", "RIGHT"].map((z) => (
          <div key={z} className="flex items-center justify-center text-white/20 text-xs">
            {z}
          </div>
        ))}
      </div>

      {/* Custom bottom control bar */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="range"
          min={0}
          max={videoRef.current?.duration || 0}
          value={videoRef.current?.currentTime || 0}
          onChange={(e) => {
            if (videoRef.current) videoRef.current.currentTime = +e.target.value;
          }}
          className="w-full h-1 accent-red-500 cursor-pointer"
        />
        <div className="flex items-center justify-between mt-1 text-white text-xs">
          <span>⏱ {Math.floor(watchedSeconds / 60)}:{String(watchedSeconds % 60).padStart(2, "0")} watched</span>
          <span className="capitalize opacity-60">{plan} plan</span>
        </div>
      </div>

      {/* ── Task 3: Watch limit overlay ── */}
      {limitReached && (
        <WatchLimitOverlay
          plan={plan}
          minutesWatched={Math.floor(watchedSeconds / 60)}
        />
      )}
    </div>
  );
}
