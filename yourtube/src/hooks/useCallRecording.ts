"use client";

import { useRef, useState, useCallback } from "react";

export const useCallRecording = (stream: MediaStream | null) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks        = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback(() => {
    if (!stream) return;
    chunks.current = [];

    const recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
    mediaRecorder.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: "video/webm" });
      const url  = URL.createObjectURL(blob);

      // Auto-download the recorded file
      const link = document.createElement("a");
      link.href     = url;
      link.download = `YourTube_Call_${new Date().toISOString().slice(0, 19)}.webm`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setIsRecording(false);
    };

    recorder.start(1000); // collect chunks every 1s
    setIsRecording(true);
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
  }, []);

  return { isRecording, startRecording, stopRecording };
};
