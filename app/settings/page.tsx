import { SettingsClient } from "@/components/settings-client";
import type { Settings } from "@/types";

export const dynamic = "force-dynamic";

const fallbackSettings: Settings = {
  companyName: "Apex Revenue Systems",
  managerName: "Sarah Mitchell",
  replyTone: "professional",
  currency: "USD",
  language: "English",
  telegramToken: "",
  supabaseUrl: "",
  claudeApiKey: ""
};

export default async function SettingsPage() {
  let settings = fallbackSettings;
  let databaseReady = Boolean(process.env.DATABASE_URL);

  try {
    const [settingsStore, leadStore] = await Promise.all([import("@/lib/settings-store"), import("@/lib/lead-store")]);
    settings = await settingsStore.getSettings();
    databaseReady = leadStore.databaseConfigured();
  } catch (error) {
    console.error("Settings data load failed. Rendering defaults.", error);
  }

  return <SettingsClient initialSettings={settings} databaseReady={databaseReady} />;
}
