import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useRef, useState } from "react";

const WatchPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [currentVideo, setCurrentVideo] = useState<any>(null);
  const [allVideos,    setAllVideos]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  // Ref for comments section (gesture triple-tap left opens it)
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") return;
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/video/getall");
        const all = res.data || [];
        setAllVideos(all);
        const found = all.find((v: any) => v._id === id);
        setCurrentVideo(found || null);
      } catch (error) {
        console.error("Watch page fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [id]);

  // Go to next video in list
  const handleNextVideo = () => {
    if (!allVideos.length || !currentVideo) return;
    const idx  = allVideos.findIndex((v: any) => v._id === currentVideo._id);
    const next = allVideos[(idx + 1) % allVideos.length];
    if (next) router.push(`/watch/${next._id}`);
  };

  // Scroll to comments (gesture triple-tap left)
  const handleOpenComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <p className="text-sm">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-gray-600 font-medium">Video not found</p>
          <p className="text-gray-400 text-sm mt-1">It may have been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-0 md:px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">
          {/* ── Left: Player + Info + Comments ── */}
          <div className="lg:col-span-2 flex flex-col">
            <Videopplayer
              video={currentVideo}
              onNextVideo={handleNextVideo}
              onOpenComments={handleOpenComments}
            />
            <div className="px-4 md:px-0 mt-4">
              <VideoInfo video={currentVideo} />
            </div>
            <div className="px-4 md:px-0 mt-4" ref={commentsRef}>
              <Comments videoId={id as string} />
            </div>
          </div>

          {/* ── Right: Related Videos ── */}
          <div className="px-4 md:px-0 mt-6 lg:mt-0 space-y-4">
            <RelatedVideos videos={allVideos.filter((v: any) => v._id !== currentVideo._id)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchPage;

