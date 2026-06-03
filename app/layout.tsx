import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";
import { ToastProvider } from "@/components/toast-provider";

export const metadata: Metadata = {
  title: "AI Sales Copilot",
  description: "Premium mock SaaS for AI-assisted sales teams"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Shell>{children}</Shell>
        </ToastProvider>
      </body>
    </html>
  );
}
