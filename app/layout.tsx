import type { Metadata, Viewport } from "next";
import {
  ThemeProvider,
  themeBootstrapScript,
} from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tide",
  description:
    "A reflection app: three prompts a day, a timeline of past entries, gentle pattern recognition.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tide",
    statusBarStyle: "black-translucent",
  },
  // Favicon + apple-touch-icon are auto-discovered from
  // app/icon.tsx and app/apple-icon.tsx (Next 15 file conventions).
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0F" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Sync theme before paint to avoid FOUC. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="min-h-dvh bg-tide-canvas text-tide-ink">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
