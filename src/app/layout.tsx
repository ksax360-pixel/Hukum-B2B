import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic, Mulish, Tajawal, Quicksand } from "next/font/google";
import "./globals.css";
import { siteOrigin } from "@/modules/seo/engine";
import { DEFAULT_SHARE_IMAGE, bilingualOg } from "@/modules/seo/page-seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
  preload: true,
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const homeOg = bilingualOg("home");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#17634B",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "Hukum | حكم — Find verified suppliers in Saudi Arabia",
    template: "%s",
  },
  description: homeOg.description,
  applicationName: "Hukum",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/brand/hukum-favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    siteName: "Hukum | حكم",
    title: homeOg.title,
    description: homeOg.description,
    images: [
      {
        url: DEFAULT_SHARE_IMAGE,
        width: 1200,
        height: 630,
        alt: "Hukum — Connecting Saudi businesses | حكم — ربط الشركات السعودية",
      },
    ],
    locale: "en_US",
    alternateLocale: ["ar_SA"],
  },
  twitter: {
    card: "summary_large_image",
    title: homeOg.title,
    description: homeOg.description,
    images: [DEFAULT_SHARE_IMAGE],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="kt-public">
      <body
        className={`${inter.variable} ${ibmPlexArabic.variable} ${mulish.variable} ${tajawal.variable} ${quicksand.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
