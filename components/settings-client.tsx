"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { saveWorkspaceSettings } from "@/app/actions";
import type { Settings } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";

export function SettingsClient({ initialSettings, databaseReady }: { initialSettings: Settings; databaseReady: boolean }) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const { notify } = useToast();

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      try {
        await saveWorkspaceSettings(settings);
        notify(databaseReady ? "Settings saved" : "Configure DATABASE_URL to persist settings");
      } catch (error) {
        notify(error instanceof Error ? error.message : "Could not save settings");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-300">Configure the sales workspace and production integration placeholders.</p>
      </div>

      <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Integrations are disabled until provider credentials and webhooks are configured.
        </div>
        Database persistence is ready when `DATABASE_URL` is set and the Prisma schema has been pushed.
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Company name</span>
            <Input value={settings.companyName} onChange={(event) => update("companyName", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Sales manager name</span>
            <Input value={settings.managerName} onChange={(event) => update("managerName", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Reply tone</span>
            <Select value={settings.replyTone} onChange={(event) => update("replyTone", event.target.value as Settings["replyTone"])}>
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="confident">Confident</option>
              <option value="sales-focused">Sales-focused</option>
            </Select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Currency</span>
            <Select value={settings.currency} onChange={(event) => update("currency", event.target.value)}>
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </Select>
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Interface language</span>
            <Input value={settings.language} onChange={(event) => update("language", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Telegram Bot Token placeholder</span>
            <Input placeholder="Server-side secret in production" value={settings.telegramToken} onChange={(event) => update("telegramToken", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Supabase URL placeholder</span>
            <Input placeholder="Optional external integration" value={settings.supabaseUrl} onChange={(event) => update("supabaseUrl", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Claude API Key placeholder</span>
            <Input placeholder="Store server-side only" value={settings.claudeApiKey} onChange={(event) => update("claudeApiKey", event.target.value)} />
          </label>
        </div>
        <div className="mt-6">
          <Button disabled={isPending} onClick={save}>
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
