"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Building2, Copy, Save, MessageCircle, Loader2 } from "lucide-react";
import { saveWorkspaceSettings } from "@/app/actions";
import { registerTelegramWebhook } from "@/app/auth-actions";
import type { Settings } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/toast-provider";

export function SettingsClient({
  initialSettings,
  databaseReady,
  companyId
}: {
  initialSettings: Settings;
  databaseReady: boolean;
  companyId: string;
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
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

  function copyCompanyId() {
    if (!companyId) return;
    navigator.clipboard.writeText(companyId);
    notify("Company ID copied");
  }

  function setupTelegram() {
    if (!settings.telegramToken) {
      notify("Please enter a Telegram bot token first");
      return;
    }

    setIsTelegramLoading(true);
    startTransition(async () => {
      try {
        const result = await registerTelegramWebhook(settings.telegramToken);
        if (result.ok) {
          notify(result.message || "Telegram webhook registered successfully");
          await saveWorkspaceSettings(settings);
        } else {
          notify(result.error || "Failed to register Telegram webhook");
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Error setting up Telegram");
      } finally {
        setIsTelegramLoading(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-300">Configure your real sales workspace, reply style, and integrations.</p>
      </div>

      <div className="rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-50">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4" />
          Integrations are disabled until provider credentials and webhooks are configured.
        </div>
        Add your provider credentials before turning on external integrations.
      </div>

      <Card>
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-300" />
              <h2 className="text-lg font-bold text-white">Company Account</h2>
            </div>
            <p className="text-sm text-slate-400">Share this Company ID with employees so they can join this workspace during registration.</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Input readOnly value={companyId || "Sign in to view your Company ID"} />
          <Button variant="secondary" disabled={!companyId} onClick={copyCompanyId}>
            <Copy className="h-4 w-4" />
            Copy Company ID
          </Button>
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Company name</span>
            <Input placeholder="Your company" value={settings.companyName} onChange={(event) => update("companyName", event.target.value)} />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Sales manager name</span>
            <Input placeholder="Your name" value={settings.managerName} onChange={(event) => update("managerName", event.target.value)} />
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
            <Input autoComplete="off" value={settings.language} onChange={(event) => update("language", event.target.value)} />
          </label>
        </div>
        <div className="mt-6">
          <Button disabled={isPending} onClick={save}>
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-cyan-300" />
              <h3 className="text-lg font-bold text-white">Telegram Integration</h3>
            </div>
            <p className="text-sm text-slate-400">
              Connect your Telegram bot to receive customer messages and sync them as leads. Messages will be matched to existing leads by name or phone number.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <label className="block space-y-1.5 text-sm text-slate-300">
            <span className="font-semibold">Bot Token</span>
            <Input
              type="password"
              name="telegram-bot-token"
              id="telegram-bot-token"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              spellCheck={false}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              value={settings.telegramToken}
              onChange={(event) => update("telegramToken", event.target.value)}
            />
            <span className="text-xs text-slate-500">Create a bot at @BotFather on Telegram</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            disabled={isTelegramLoading || !settings.telegramToken || !databaseReady}
            onClick={setupTelegram}
            variant="primary"
          >
            {isTelegramLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            Register Webhook
          </Button>
          <Button disabled={isPending} onClick={save} variant="secondary">
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>

        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-400">
          <div className="mb-2 font-semibold text-slate-300">How it works:</div>
          <ol className="space-y-1 pl-4 list-decimal">
            <li>Users message your Telegram bot</li>
            <li>Messages are synced as lead messages</li>
            <li>New leads are auto-created if no match found</li>
            <li>Messages appear in the lead detail view</li>
          </ol>
        </div>
      </Card>

      <Card>
        <div>
          <h3 className="text-lg font-bold text-white">Optional Provider Settings</h3>
          <p className="mt-1 text-sm text-slate-400">These values are optional and are not used for login.</p>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Supabase project URL</span>
            <Input
              name="supabase-project-url"
              id="supabase-project-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="https://your-project.supabase.co"
              value={settings.supabaseUrl}
              onChange={(event) => update("supabaseUrl", event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Claude provider key</span>
            <Input
              name="provider-secret-token"
              id="provider-secret-token"
              type="password"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              spellCheck={false}
              placeholder="sk-..."
              value={settings.claudeApiKey}
              onChange={(event) => update("claudeApiKey", event.target.value)}
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
