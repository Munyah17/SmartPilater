import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SmartPilater — Digital fare collection for kombis",
    template: "%s · SmartPilater",
  },
  description:
    "SmartPilater replaces cash on Zimbabwean kombis with tap-to-fare QR payments, offline-first terminals and a fleet dashboard built for operators. Seke 1 & 2 paElo.",
  applicationName: "SmartPilater",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SmartPilater",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#14161f" },
  ],
  width: "device-width",
  initialScale: 1,
  // Terminals run in kiosk mode; pinch zoom off keeps the fare grid stable.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
