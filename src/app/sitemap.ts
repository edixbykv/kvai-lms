import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://learn.kvai.in";

// The public marketing pages only. Course and blog pages come from the database
// and are found through the links on /courses and /blog.
const PAGES: [path: string, priority: number][] = [
  ["", 1],
  ["/courses", 0.9],
  ["/about", 0.6],
  ["/blog", 0.6],
  ["/success-stories", 0.5],
  ["/faq", 0.5],
  ["/contact", 0.5],
  ["/verify", 0.4],
  ["/privacy", 0.2],
  ["/terms", 0.2],
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map(([path, priority]) => ({ url: `${appUrl}${path}`, lastModified: now, changeFrequency: "weekly", priority }));
}
