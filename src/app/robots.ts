import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://learn.kvai.in";

// Sign-in, dashboard and admin screens have nothing for Google to show.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email"],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
