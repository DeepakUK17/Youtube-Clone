"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useUser } from "@/lib/AuthContext";

const STUN_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  onIncomingCall: (callerId: string, callerName: string, offer: RTCSessionDescriptionInit) => void;
  onCallEnded:    () => void;
}

export const useWebRTC = ({ onIncomingCall, onCallEnded }: UseWebRTCOptions) => {
  const { user } = useUser();
  const pc = useRef<RTCPeerConnection | null>(null);

  const localStreamRef  = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const targetUserIdRef = useRef<string | null>(null);

  const [localStream,   setLocalStream]   = useState<MediaStream | null>(null);
  const [remoteStream,  setRemoteStream]  = useState<MediaStream | null>(null);
  const [isConnected,   setIsConnected]   = useState(false);

  // ── Listen to socket events ───────────────────────────────────────────────
  useEffect(() => {
    const s = getSocket();

    const onIncoming = ({ callerId, callerName, offer }: any) => {
      console.log("📞 Incoming call from:", callerName);
      onIncomingCall(callerId, callerName, offer);
    };

    const onAnswered = async ({ answer }: any) => {
      console.log("📞 Call answered");
      if (pc.current) {
        await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const onIceCandidate = async ({ candidate }: any) => {
      if (pc.current && candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("ICE candidate error:", e);
        }
      }
    };

    const onEnded   = () => { endCall(); onCallEnded(); };
    const onRejected = () => { endCall(); onCallEnded(); };
    const onOffline  = ({ targetUserId }: any) => {
      console.warn("User is offline:", targetUserId);
      alert("The user you are calling is offline or not registered.");
    };

    s.on("call:incoming",      onIncoming);
    s.on("call:answered",      onAnswered);
    s.on("call:ice-candidate", onIceCandidate);
    s.on("call:ended",         onEnded);
    s.on("call:rejected",      onRejected);
    s.on("call:user-offline",  onOffline);

    return () => {
      s.off("call:incoming",      onIncoming);
      s.off("call:answered",      onAnswered);
      s.off("call:ice-candidate", onIceCandidate);
      s.off("call:ended",         onEnded);
      s.off("call:rejected",      onRejected);
      s.off("call:user-offline",  onOffline);
    };
  }, [onIncomingCall, onCallEnded]);

  // ── Get camera + mic stream ───────────────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  // ── Create RTCPeerConnection ──────────────────────────────────────────────
  const createPC = useCallback((targetId: string) => {
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }

    const newPC = new RTCPeerConnection(STUN_SERVERS);
    targetUserIdRef.current = targetId;

    newPC.onicecandidate = (e) => {
      if (e.candidate) {
        getSocket().emit("call:ice-candidate", {
          targetUserId: targetId,
          candidate:    e.candidate,
        });
      }
    };

    newPC.ontrack = (e) => {
      console.log("🎥 Remote track received");
      remoteStreamRef.current = e.streams[0];
      setRemoteStream(e.streams[0]);
    };

    newPC.onconnectionstatechange = () => {
      console.log("RTCPeerConnection state:", newPC.connectionState);
      setIsConnected(newPC.connectionState === "connected");
    };

    newPC.oniceconnectionstatechange = () => {
      console.log("ICE state:", newPC.iceConnectionState);
    };

    // Add local tracks to connection
    localStreamRef.current?.getTracks().forEach((track) => {
      newPC.addTrack(track, localStreamRef.current!);
    });

    pc.current = newPC;
    return newPC;
  }, []);

  // ── Initiate a call ───────────────────────────────────────────────────────
  const initiateCall = useCallback(async (targetId: string, targetName: string) => {
    await getLocalStream();
    const newPC = createPC(targetId);

    const offer = await newPC.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await newPC.setLocalDescription(offer);

    getSocket().emit("call:initiate", {
      targetUserId: targetId,
      callerId:     user?._id,
      callerName:   (user as any)?.name || "Unknown",
      offer,
    });
    console.log("📤 Call offer sent to:", targetId);
  }, [user, createPC, getLocalStream]);

  // ── Answer an incoming call ───────────────────────────────────────────────
  const answerCall = useCallback(async (callerId: string, offer: RTCSessionDescriptionInit) => {
    await getLocalStream();
    const newPC = createPC(callerId);

    await newPC.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await newPC.createAnswer();
    await newPC.setLocalDescription(answer);

    getSocket().emit("call:answer", { callerId, answer });
    console.log("📤 Answer sent to:", callerId);
  }, [createPC, getLocalStream]);

  // ── Screen sharing ────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const videoTrack   = screenStream.getVideoTracks()[0];
    const sender = pc.current?.getSenders().find((s) => s.track?.kind === "video");
    if (sender) await sender.replaceTrack(videoTrack);
    videoTrack.onended = async () => {
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
    };
    return screenStream;
  }, []);

  // ── End call ─────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    const targetId = targetUserIdRef.current;
    pc.current?.close();
    pc.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current  = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    targetUserIdRef.current = null;

    if (targetId) {
      getSocket().emit("call:end", { targetUserId: targetId });
    }
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
    initiateCall,
    answerCall,
    startScreenShare,
    endCall,
  };
};
