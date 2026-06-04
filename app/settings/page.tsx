import { SettingsClient } from "@/components/settings-client";
import { defaultSettings } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = defaultSettings;
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
