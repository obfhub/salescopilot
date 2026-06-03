import { unstable_noStore as noStore } from "next/cache";
import type { Settings } from "@/types";
import { prisma } from "@/lib/prisma";
import { databaseConfigured } from "@/lib/lead-store";
import { requireWorkspaceAccess } from "@/lib/auth";

export const defaultSettings: Settings = {
  companyName: "Apex Revenue Systems",
  managerName: "Sarah Mitchell",
  replyTone: "professional",
  currency: "USD",
  language: "English",
  telegramToken: "",
  supabaseUrl: "",
  claudeApiKey: ""
};

export async function getSettings(): Promise<Settings> {
  noStore();
  if (!databaseConfigured()) return defaultSettings;
  const auth = await requireWorkspaceAccess("sales");

  const settings = await prisma.workspaceSetting.findUnique({
    where: { workspaceId: auth.workspaceId }
  });

  if (!settings) return defaultSettings;

  return {
    companyName: settings.companyName,
    managerName: settings.managerName,
    replyTone: settings.replyTone as Settings["replyTone"],
    currency: settings.currency,
    language: settings.language,
    telegramToken: settings.telegramToken ?? "",
    supabaseUrl: settings.supabaseUrl ?? "",
    claudeApiKey: settings.claudeApiKey ?? ""
  };
}
