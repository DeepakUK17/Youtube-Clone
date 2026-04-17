import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { ThemeProvider } from "../lib/ThemeContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <ThemeProvider>
        {/* Theme applied via data-theme attribute on <html> by ThemeContext */}
        <div className="min-h-screen transition-colors duration-300">
          <title>YourTube Clone</title>
          <Header />
          <Toaster />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 w-full min-w-0">
              <Component {...pageProps} />
            </main>
          </div>
        </div>
      </ThemeProvider>
    </UserProvider>
  );
}
