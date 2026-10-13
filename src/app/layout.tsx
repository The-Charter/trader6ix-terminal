import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { THEME_BOOTSTRAP } from "@/lib/theme-bootstrap";
import { ARC_CHAIN_NAME } from "@/lib/arc-network";
import "./globals.css";

const TITLE = `Trader6ix — Spot & Perps on ${ARC_CHAIN_NAME}`;

export const metadata: Metadata = {
  title: TITLE,
  description:
    "Real-time trading intelligence, analytics, and portfolio performance tools from Trader6ix.",
  openGraph: {
    title: TITLE,
    description: "Trade smarter with Trader6ix analytics and portfolio tools.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [{ url: "/favicon.png?v=2" }],
    apple: [{ url: "/apple-touch-icon.png?v=2" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
