import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
    return [
      {
        source: "/video/:path*",
        destination: `${backendUrl}/video/:path*`,
      },
      {
        source: "/user/:path*",
        destination: `${backendUrl}/user/:path*`,
      },
      {
        source: "/comment/:path*",
        destination: `${backendUrl}/comment/:path*`,
      },
      {
        source: "/like/:path*",
        destination: `${backendUrl}/like/:path*`,
      },
      {
        source: "/history/:path*",
        destination: `${backendUrl}/history/:path*`,
      },
      {
        source: "/download/:path*",
        destination: `${backendUrl}/download/:path*`,
      },
      {
        source: "/payment/:path*",
        destination: `${backendUrl}/payment/:path*`,
      },
      {
        source: "/otp/:path*",
        destination: `${backendUrl}/otp/:path*`,
      },
      {
        source: "/theme/:path*",
        destination: `${backendUrl}/theme/:path*`,
      },
      {
        source: "/api/friends",
        destination: `${backendUrl}/friends`,
      },
    ];
  },
};

export default nextConfig;
