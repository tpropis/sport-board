import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/lib/auth";
import { ThemeApplier } from "@/components/ThemeApplier";
import { SessionProvider } from "@/lib/session";
import { AuthGate } from "@/components/AuthGate";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameBoard Pro — TV Command Board",
  description:
    "The daily TV command board for sports bars. One sheet tells every bartender what game is on which TV, what channel or app, which remote, and whether sound stays on music.",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <AuthProvider>
          <StoreProvider>
            <ThemeApplier />
            <SessionProvider>
              <AuthGate>
                <AppShell>{children}</AppShell>
              </AuthGate>
            </SessionProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
