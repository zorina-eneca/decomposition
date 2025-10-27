import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider, Toaster } from "@/hooks/use-toast";
import "./globals.css";

// Используем Inter как безопасную замену локальному Calibre,
// пробрасывая переменную --font-calibre, чтобы работали темы из globals.css
const calibre = Inter({
  variable: "--font-calibre",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${calibre.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
          <Toaster />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
