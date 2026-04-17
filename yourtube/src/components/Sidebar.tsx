import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
  Crown,
  Video,
  Download,
} from "lucide-react";
import Link from "next/link";

import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";

const Sidebar = () => {
  const { user } = useUser();
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  const handleLinkClick = () => {
    // Auto-close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile background overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <aside className={`
        ${isMobileOpen ? "fixed inset-y-0 left-0 z-50 bg-white dark:bg-[#0f0f0f] shadow-2xl translate-x-0" : "hidden -translate-x-full"} 
        md:translate-x-0 md:block md:static md:z-auto 
        w-64 sidebar-theme border-r min-h-screen p-2 transition-transform duration-300 ease-in-out
      `}>
      <nav className="space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className="w-full justify-start">
            <Compass className="w-5 h-5 mr-3" />
            Explore
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className="w-full justify-start">
            <PlaySquare className="w-5 h-5 mr-3" />
            Subscriptions
          </Button>
        </Link>

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <Link href="/history">
                <Button variant="ghost" className="w-full justify-start">
                  <History className="w-5 h-5 mr-3" />
                  History
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant="ghost" className="w-full justify-start">
                  <ThumbsUp className="w-5 h-5 mr-3" />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="w-5 h-5 mr-3" />
                  Watch later
                </Button>
              </Link>
              {/* Task 2 & 3: Profile + Downloads */}
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="w-5 h-5 mr-3" />
                  Profile & Downloads
                </Button>
              </Link>
              {/* Task 3: Upgrade Plan / Current Plan Display */}
              <Link href="/upgrade">
                <Button variant="ghost" className="w-full justify-start relative group">
                  <Crown className={`w-5 h-5 mr-3 ${user.isPremium ? (user.plan === 'gold' ? 'text-yellow-500 fill-yellow-500' : user.plan === 'silver' ? 'text-slate-400 fill-slate-400' : 'text-orange-500 fill-orange-500') : 'text-yellow-600'}`} />
                  {user.isPremium ? (
                    <span className="flex items-center gap-2">
                      Manage Plan
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        user.plan === 'gold' 
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300 text-yellow-700 shadow-sm'
                          : user.plan === 'silver'
                          ? 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300 text-slate-700 shadow-sm'
                          : 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-700 shadow-sm'
                      }`}>
                         {user.plan}
                      </span>
                    </span>
                  ) : (
                    <span className="text-yellow-600">Upgrade Plan</span>
                  )}
                </Button>
              </Link>
              {/* Task 6: Video Call */}
              <Link href="/friends">
                <Button variant="ghost" className="w-full justify-start text-red-600">
                  <Video className="w-5 h-5 mr-3" />
                  Video Call
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user.id}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-5 h-5 mr-3" />
                    Your channel
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
    </>
  );
};

export default Sidebar;
