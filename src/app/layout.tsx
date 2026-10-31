import type { Metadata } from "next";
import { Mulish, Tajawal, Quicksand } from "next/font/google";
import "./globals.css";

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700", "800"],
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kingdomtrade.sa"),
  title: {
    default: "Hukum | B2B Marketplace",
    template: "%s | Hukum",
  },
  description: "Hukum — Saudi AI-powered B2B marketplace and procurement infrastructure",
  icons: {
    icon: [{ url: "/brand/hukum-logo.png", type: "image/png" }],
    apple: "/brand/hukum-logo.png",
  },
  openGraph: {
    type: "website",
    siteName: "Hukum",
    title: "Hukum | B2B Marketplace",
    description: "Hukum — Saudi AI-powered B2B marketplace and procurement infrastructure",
    images: [
      {
        url: "/brand/hukum-logo.png",
        width: 500,
        height: 500,
        alt: "Hukum",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hukum | B2B Marketplace",
    description: "Hukum — Saudi AI-powered B2B marketplace and procurement infrastructure",
    images: ["/brand/hukum-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="kt-public">
      <body className={`${mulish.variable} ${tajawal.variable} ${quicksand.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
