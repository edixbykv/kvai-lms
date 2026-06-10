import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://learn.kvai.in";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "KVAI LMS — Learn. Grow. Get Certified.",
    template: "%s · KVAI LMS",
  },
  description:
    "KVAI LMS is a professional online education platform for students, training institutes, skill councils and corporates. Learn from expert-led courses and earn verifiable certificates.",
  keywords: ["online courses", "e-learning", "LMS", "certification", "KVAI", "training"],
  authors: [{ name: "KVAI Solutions" }],
  openGraph: {
    type: "website",
    siteName: "KVAI LMS",
    title: "KVAI LMS — Learn. Grow. Get Certified.",
    description: "Professional online learning platform by KVAI Solutions.",
    url: appUrl,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
