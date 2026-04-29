import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const font = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Jurnal Trading Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${font.variable} dark`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
