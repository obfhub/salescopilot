import { SettingsClient } from "@/components/settings-client";
import { defaultSettings } from "@/lib/settings-store";
import { requireWorkspaceAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = defaultSettings;
  let databaseReady = Boolean(process.env.DATABASE_URL);
  let companyId = "";

  try {
    const [settingsStore, leadStore] = await Promise.all([import("@/lib/settings-store"), import("@/lib/lead-store")]);
    settings = await settingsStore.getSettings();
    databaseReady = leadStore.databaseConfigured();
    const auth = await requireWorkspaceAccess("sales");
    companyId = auth.workspaceId;
  } catch (error) {
    console.error("Settings data load failed. Rendering defaults.", error);
  }

  return <SettingsClient initialSettings={settings} databaseReady={databaseReady} companyId={companyId} />;
}
