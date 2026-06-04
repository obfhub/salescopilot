import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { Shell } from "@/components/shell";
import { ToastProvider } from "@/components/toast-provider";
import { DemoModeProvider } from "@/contexts/demo-mode-context";

export const metadata: Metadata = {
  title: "AI Sales Copilot",
  description: "Premium mock SaaS for AI-assisted sales teams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <DemoModeProvider>
            <ToastProvider>
              <Shell>{children}</Shell>
            </ToastProvider>
          </DemoModeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
