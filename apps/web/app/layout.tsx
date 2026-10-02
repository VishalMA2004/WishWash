import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/service-worker";

export const metadata: Metadata = {
  title: "WishWash — laundry, timed with the weather",
  description: "Plan laundry around the weather and get a heads-up when rain threatens clothes that are drying.",
  applicationName: "WishWash",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#f6f8f5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><ServiceWorkerRegistration />{children}</body></html>;
}
