import { SettingsClient } from "@/components/settings-client";
import { databaseConfigured } from "@/lib/lead-store";
import { getSettings } from "@/lib/settings-store";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient initialSettings={settings} databaseReady={databaseConfigured()} />;
}
