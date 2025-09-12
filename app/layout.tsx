import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "SIH 2025 Registration - MCAS",
  description:
    "Smart India Hackathon 2025 - MCAS Internal Selection & Team Formation Portal",
  keywords: [
    "Smart India Hackathon",
    "SIH 2025",
    "MCAS",
    "Hackathon Registration",
    "Team Formation",
    "Innovation",
    "Technology",
  ],
  authors: [{ name: "MCAS SIH Team" }],
  creator: "MCAS SIH Committee",
  publisher: "MCAS",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sih2025.mcas.edu.in",
    title: "SIH 2025 Registration - MCAS",
    description:
      "Smart India Hackathon 2025 - MCAS Internal Selection & Team Formation Portal",
    siteName: "SIH 2025 MCAS",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIH 2025 Registration - MCAS",
    description:
      "Smart India Hackathon 2025 - MCAS Internal Selection & Team Formation Portal",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/android-chrome-512x512.png" },
    ],
  },
  manifest: "/site.webmanifest",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased selection:bg-blue-200 selection:text-blue-900`}
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-xl animate-float"></div>
          <div
            className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-indigo-400/20 to-pink-600/20 rounded-full blur-xl animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full blur-xl animate-float"
            style={{ animationDelay: "4s" }}
          ></div>

          {/* Main Content */}
          <div className="relative z-10">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
