"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Download, Crown, User, Film } from "lucide-react";

type DownloadItem = {
  videoId: string;
  title:   string;
  downloadedAt: string;
};

const PLAN_COLORS: Record<string, string> = {
  free:   "bg-gray-100 text-gray-600",
  bronze: "bg-orange-100 text-orange-700",
  silver: "bg-slate-100 text-slate-600",
  gold:   "bg-yellow-100 text-yellow-700",
};

const PLAN_ICONS: Record<string, string> = {
  free:   "🎯",
  bronze: "🥉",
  silver: "🥈",
  gold:   "🥇",
};

export default function ProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"info" | "downloads">("info");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [plan, setPlan] = useState("free");
  const [isPremium, setIsPremium] = useState(false);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

  useEffect(() => {
    if (user?._id && activeTab === "downloads") {
      loadDownloads();
    }
  }, [user, activeTab]);

  const loadDownloads = async () => {
    setLoadingDownloads(true);
    try {
      const res = await axiosInstance.get(`/download/history/${user?._id}`);
      setDownloads(res.data.downloads || []);
      setPlan(res.data.plan || "free");
      setIsPremium(res.data.isPremium || false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDownloads(false);
    }
  };

  if (!user) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-gray-500 text-sm">Please sign in to view your profile.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full">
      {/* ── Profile header ── */}
      <div className="flex items-center gap-5 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
        <Avatar className="w-20 h-20">
          <AvatarImage src={user.image || ""} />
          <AvatarFallback className="text-2xl">{user.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name || "Anonymous"}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          {user.channelname && (
            <p className="text-sm text-gray-600 mt-1">📺 {user.channelname}</p>
          )}
          {/* Plan badge */}
          <span
            className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-semibold capitalize ${PLAN_COLORS[plan] || PLAN_COLORS.free}`}
          >
            {PLAN_ICONS[plan]} {plan} Plan
            {isPremium && (
              <Crown className="w-3 h-3 text-yellow-500 ml-0.5" />
            )}
          </span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["info", "downloads"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "info" ? (
              <User className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {tab === "info" ? "Channel Info" : "Downloads"}
          </button>
        ))}
      </div>

      {/* ── Tab: Info ── */}
      {activeTab === "info" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Name",        value: user.name },
              { label: "Email",       value: user.email },
              { label: "Channel",     value: user.channelname || "—" },
              { label: "Description", value: user.description || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-gray-800 break-words">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Downloads ── */}
      {activeTab === "downloads" && (
        <div>
          {loadingDownloads ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Loading downloads...
            </div>
          ) : downloads.length === 0 ? (
            <div className="text-center py-12">
              <Film className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No downloads yet.</p>
              <p className="text-gray-400 text-xs mt-1">
                Download videos from the watch page.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {downloads.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(item.downloadedAt))} ago
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}
