import type { NextConfig } from "next";

// Basic security headers: stop other sites framing the sign-in page (clickjacking),
// stop MIME sniffing and keep the referrer short. No CSP yet, so nothing on the page can break.
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "**.kvai.in" },
    ],
  },
  serverExternalPackages: ["@prisma/adapter-pg", "pg"],
} satisfies NextConfig;

export default nextConfig;
