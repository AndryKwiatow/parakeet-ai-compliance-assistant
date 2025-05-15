import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/nav/main-nav";
import { CostDisplay } from '@/components/cost-display';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parakeet AI Compliance Assistant",
  description: "AI-powered compliance and PII detection assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <MainNav />
          <main className="flex-1">
            {children}
          </main>
        </div>
        <CostDisplay />
      </body>
    </html>
  );
}
