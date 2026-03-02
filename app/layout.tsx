import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shengji (升级)",
  description: "Multiplayer Shengji card game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-green-900 text-white min-h-screen">{children}</body>
    </html>
  );
}
