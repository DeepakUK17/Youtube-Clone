"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mic, MicOff, Video, VideoOff,
  Monitor, Circle, StopCircle, PhoneOff,
} from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useCallRecording } from "@/hooks/useCallRecording";

interface VideoCallModalProps {
  targetUserId:  string;
  targetName:    string;
  initiateOnMount?: boolean;      // true = caller, false = callee
  incomingOffer?: RTCSessionDescriptionInit | null;
  onClose: () => void;
}

export default function VideoCallModal({
  targetUserId,
  targetName,
  initiateOnMount = true,
  incomingOffer   = null,
  onClose,
}: VideoCallModalProps) {
  const localVideoRef  = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [audioMuted,   setAudioMuted]   = useState(false);
  const [videoStopped, setVideoStopped] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [status, setStatus] = useState<"connecting" | "connected" | "ended">("connecting");

  const {
    localStream,
    remoteStream,
    isConnected,
    initiateCall,
    answerCall,
    startScreenShare,
    endCall,
  } = useWebRTC({
    onIncomingCall: () => {}, // handled by parent FriendsPage
    onCallEnded: () => {
      setStatus("ended");
      setTimeout(onClose, 1500);
    },
  });

  const { isRecording, startRecording, stopRecording } = useCallRecording(
    localStream || null
  );

  // ── Attach local stream to video element ──────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // ── Attach remote stream ──────────────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      setStatus("connected");
    }
  }, [remoteStream]);

  // ── Update connection status ──────────────────────────────────────────────
  useEffect(() => {
    if (isConnected) setStatus("connected");
  }, [isConnected]);

  // ── Initiate or answer call on mount ─────────────────────────────────────
  useEffect(() => {
    if (initiateOnMount) {
      initiateCall(targetUserId, targetName);
    } else if (incomingOffer) {
      answerCall(targetUserId, incomingOffer);
    }
  }, []);

  const handleToggleAudio = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setAudioMuted((m) => !m);
  };

  const handleToggleVideo = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setVideoStopped((v) => !v);
  };

  const handleScreenShare = async () => {
    try {
      await startScreenShare();
      setIsSharingScreen(true);
    } catch {}
  };

  const handleEndCall = () => {
    if (isRecording) stopRecording();
    endCall();
    setStatus("ended");
    setTimeout(onClose, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white font-semibold">📹 {targetName}</span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            status === "connected"
              ? "bg-green-500/20 text-green-400"
              : status === "ended"
              ? "bg-red-500/20 text-red-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {status === "connected" ? "● Connected" : status === "ended" ? "Call Ended" : "Connecting..."}
        </span>
        {isRecording && (
          <span className="text-xs text-red-400 animate-pulse">● REC</span>
        )}
      </div>

      {/* Remote video (main area) */}
      <div className="flex-1 relative bg-gray-900">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {!remoteStream && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            Waiting for {targetName} to connect...
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-4 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {videoStopped && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-xs">
              Camera Off
            </div>
          )}
        </div>

        {isSharingScreen && (
          <div className="absolute top-4 left-4 bg-blue-600/90 text-white text-xs rounded-full px-3 py-1">
            🖥 Screen Sharing
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-5 bg-black/90">
        {/* Mute audio */}
        <button
          onClick={handleToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            audioMuted ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title="Toggle Microphone"
        >
          {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Stop video */}
        <button
          onClick={handleToggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            videoStopped ? "bg-red-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title="Toggle Camera"
        >
          {videoStopped ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </button>

        {/* Screen share */}
        <button
          onClick={handleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isSharingScreen ? "bg-blue-600 text-white" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title="Share Screen (select YouTube tab)"
        >
          <Monitor className="w-5 h-5" />
        </button>

        {/* Record */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isRecording ? "bg-red-600 text-white animate-pulse" : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
          title={isRecording ? "Stop Recording" : "Start Recording"}
        >
          {isRecording ? <StopCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        </button>

        {/* End call */}
        <button
          onClick={handleEndCall}
          className="w-16 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
