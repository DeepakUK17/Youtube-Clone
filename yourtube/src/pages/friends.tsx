"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Video } from "lucide-react";
import VideoCallModal from "@/components/VideoCallModal";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useUser } from "@/lib/AuthContext";

type UserResult = {
  _id:         string;
  name:        string;
  email:       string;
  image:       string;
  channelname: string;
};

type IncomingCallState = {
  callerId:   string;
  callerName: string;
  offer:      RTCSessionDescriptionInit;
} | null;

export default function FriendsPage() {
  const { user } = useUser();
  const [search,  setSearch]  = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeCall,     setActiveCall]     = useState<UserResult | null>(null);
  const [incomingCall,   setIncomingCall]   = useState<IncomingCallState>(null);
  const [showCallModal,  setShowCallModal]  = useState(false);
  const [isCallee,       setIsCallee]       = useState(false);

  const { initiateCall } = useWebRTC({
    onIncomingCall: (callerId, callerName, offer) => {
      setIncomingCall({ callerId, callerName, offer });
    },
    onCallEnded: () => {
      setShowCallModal(false);
      setActiveCall(null);
      setIncomingCall(null);
    },
  });

  // ── Search users ────────────────────────────────────────────────────────
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!search.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/friends?search=${encodeURIComponent(search)}`);
        setResults(res.data.filter((u: UserResult) => u._id !== user?._id));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [search, user]);

  const handleCall = (target: UserResult) => {
    setActiveCall(target);
    setIsCallee(false);
    setShowCallModal(true);
  };

  const handleAcceptIncoming = () => {
    if (!incomingCall) return;
    const fakeTarget: UserResult = {
      _id:         incomingCall.callerId,
      name:        incomingCall.callerName,
      email:       "",
      image:       "",
      channelname: "",
    };
    setActiveCall(fakeTarget);
    setIsCallee(true);
    setShowCallModal(true);
    // DO NOT setIncomingCall(null) here, otherwise the modal won't receive the offer!
  };

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Video className="w-6 h-6 text-red-500" /> Video Call
      </h1>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name to call..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
        />
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center text-sm text-gray-400 py-4">Searching...</div>
      )}

      <ul className="space-y-3">
        {results.map((u) => (
          <li
            key={u._id}
            className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={u.image || ""} />
              <AvatarFallback>{u.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{u.name}</p>
              <p className="text-xs text-gray-400 truncate">{u.channelname || u.email}</p>
            </div>
            <button
              onClick={() => handleCall(u)}
              className="flex items-center gap-2 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl transition-colors font-medium"
            >
              <Video className="w-4 h-4" />
              Call
            </button>
          </li>
        ))}
        {!loading && search && results.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">No users found.</p>
        )}
      </ul>

      {/* Incoming call banner */}
      {incomingCall && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom">
          <div>
            <p className="text-sm font-semibold">📞 Incoming call</p>
            <p className="text-xs text-gray-300">{incomingCall.callerName} is calling...</p>
          </div>
          <button
            onClick={handleAcceptIncoming}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Accept
          </button>
          <button
            onClick={() => setIncomingCall(null)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
          >
            Decline
          </button>
        </div>
      )}

      {/* Full-screen call modal */}
      {showCallModal && activeCall && (
        <VideoCallModal
          targetUserId={activeCall._id}
          targetName={activeCall.name}
          initiateOnMount={!isCallee}
          incomingOffer={isCallee ? incomingCall?.offer : null}
          onClose={() => {
            setShowCallModal(false);
            setActiveCall(null);
          }}
        />
      )}
    </main>
  );
}
