import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dream News",
  description: "AI-Powered News Aggregation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}