import { Bell, Menu, Mic, Moon, Search, Sun, User, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { Button } from "./ui/button";
import Link from "next/link";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Channeldialogue from "./channeldialogue";
import { useRouter } from "next/router";
import { useUser } from "@/lib/AuthContext";

const Header = () => {
  const { user, logout, handlegooglesignin } = useUser();
  const { theme, isSouth }  = useTheme();
  const [searchQuery,   setSearchQuery]   = useState("");
  const [isdialogeopen, setisdialogeopen] = useState(false);
  const [manualTheme,   setManualTheme]   = useState<"light"|"dark">("light");
  const router = useRouter();

  // Manual theme toggle — overrides auto-detection
  const toggleTheme = () => {
    const next = manualTheme === "light" ? "dark" : "light";
    setManualTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.body.style.backgroundColor = next === "dark" ? "#0f0f0f" : "#ffffff";
    document.body.style.color = next === "dark" ? "#f1f1f1" : "#111111";
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  const handleKeypress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e as any);
    }
  };

  const handleVideoAction = () => {
    if (user?.channelname) {
    router.push(`/channel/${user._id}`);
    } else {
      setisdialogeopen(true);
    }
  };

  const handleMenuToggle = () => {
    window.dispatchEvent(new Event("toggleSidebar"));
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 header-theme border-b transition-colors duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleMenuToggle}>
          <Menu className="w-6 h-6" />
        </Button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-red-600 p-1 rounded">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span className="text-xl font-medium">YourTube</span>
          <span className="text-xs text-gray-400 ml-1">IN</span>
        </Link>
      </div>
      <form
        onSubmit={handleSearch}
        className="hidden md:flex items-center gap-2 flex-1 max-w-2xl mx-4"
      >
        <div className="flex flex-1">
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onKeyPress={handleKeypress}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-l-full border-r-0 focus-visible:ring-0"
          />
          <Button
            type="submit"
            className="rounded-r-full px-6 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-l-0"
          >
            <Search className="w-5 h-5" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Mic className="w-5 h-5" />
        </Button>
      </form>
      <div className="flex items-center gap-2">
        {/* Task 4: Theme Toggle + indicator */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            title={`Switch to ${manualTheme === 'light' ? 'dark' : 'light'} mode`}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            {manualTheme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          {isSouth && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full hidden sm:block">
              🌏 South India
            </span>
          )}
        </div>
        {user ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleVideoAction}>
              <Plus className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => alert("No new notifications")}>
              <Bell className="w-6 h-6" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image} />
                    <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.channelname ? (
                  <DropdownMenuItem asChild>
                    <Link href={`/channel/${user?._id}`}>Your channel</Link>
                  </DropdownMenuItem>
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
                {user?.isPremium && (
                  <div className="px-2 py-1.5 mb-1 flex justify-center">
                    <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border shadow-sm ${
                      user.plan === 'gold' 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300 text-yellow-700'
                        : user.plan === 'silver'
                        ? 'bg-gradient-to-r from-slate-100 to-slate-50 border-slate-300 text-slate-700'
                        : 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-700'
                    }`}>
                      {user.plan} MEMBER
                    </span>
                  </div>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/history">History</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/liked">Liked videos</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/watch-later">Watch later</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button
              className="flex items-center gap-2"
              onClick={handlegooglesignin}
            >
              <User className="w-4 h-4" />
              Sign in
            </Button>
          </>
        )}{" "}
      </div>
      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </header>
  );
};

export default Header;
