// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // ✅ Load Inter from Google Fonts
import "./globals.css";
import ClientLayout from "@/components/layout/client-layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LEXIE",
  description: "Enterprise Resource Planner",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-background text-foreground`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
