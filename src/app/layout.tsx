import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monet — Claude IDE",
  description: "A web-based IDE specialized for Claude AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
