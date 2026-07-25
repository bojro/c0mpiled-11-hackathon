import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/lib/hexclave/server";
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
  title: "Debrief",
  description:
    "AI-native applicant screening — a voice agent interviews the candidate, verifies claims against outside evidence, and delivers a bullet-by-bullet report.",
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
      <body className="min-h-full flex flex-col">
        <HexclaveProvider app={hexclaveServerApp}>
          <HexclaveTheme>
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <span className="font-mono text-xs tracking-widest text-ink-muted uppercase">
                    loading
                  </span>
                </div>
              }
            >
              {children}
            </Suspense>
          </HexclaveTheme>
        </HexclaveProvider>
      </body>
    </html>
  );
}
