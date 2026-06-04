"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardList, Copy, MessageSquareText, Save, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/toast-provider";

type ReplyOptions = {
  short?: string;
  professional?: string;
  sales?: string;
  closing?: string;
};

type CaptureAnalysis = {
  provider?: "mock" | "openai";
  temperature: string;
  score: number;
  summary: string;
  intent: string;
  urgency: string;
  interestLevel: string;
  budgetReadiness: string;
  mainNeed: string;
  painPoint: string;
  objection: string;
  lossRisk: string;
  recommendedStage: string;
  nextBestAction: string;
  confidence: number;
  reply: string;
  replyOptions: ReplyOptions;
};

type CaptureResult = {
  ok: boolean;
  error?: string;
  leadId?: string;
  analysis?: CaptureAnalysis;
};

const sources = ["Manual", "Telegram", "WhatsApp", "Instagram", "Facebook", "Website", "Referral"];

const emptyForm = {
  name: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  source: "Manual",
  interest: "Sales automation",
  dealValue: "0",
  message: ""
};

export function LeadCaptureForm() {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<CaptureAnalysis | null>(null);
  const [savedLeadId, setSavedLeadId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const canAnalyze = form.name.trim().length >= 2 && form.message.trim().length >= 10;
  const replyEntries = useMemo(() => {
    if (!analysis) return [];
    const options = analysis.replyOptions || {};
    return [
      ["Professional", options.professional || analysis.reply],
      ["Short", options.short],
      ["Sales", options.sales],
      ["Closing", options.closing]
    ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  }, [analysis]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setSavedLeadId("");
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    notify("Reply copied");
  }

  async function post(url: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    return (await response.json()) as CaptureResult;
  }

  function analyze() {
    setError("");
    setSavedLeadId("");
    startTransition(async () => {
      const payload = await post("/api/leads/preview");
      if (!payload.ok || !payload.analysis) {
        setAnalysis(null);
        setError(payload.error ?? "Could not analyze this conversation.");
        return;
      }
      setAnalysis(payload.analysis);
    });
  }

  function saveLead() {
    setError("");
    startTransition(async () => {
      const payload = await post("/api/leads");
      if (!payload.ok) {
        setError(payload.error ?? "Could not save lead.");
        return;
      }
      setSavedLeadId(payload.leadId ?? "");
      setAnalysis(payload.analysis ?? analysis);
      notify("Conversation saved to CRM");
    });
  }

  function reset() {
    setForm(emptyForm);
    setAnalysis(null);
    setSavedLeadId("");
    setError("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
            <MessageSquareText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manual Conversation Capture</h1>
            <p className="text-sm text-slate-400">Log a customer message, analyze it, copy a reply, then save the conversation to CRM.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Client name</span>
            <Input placeholder="Client name" value={form.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Company</span>
            <Input placeholder="Company or organization" value={form.company} onChange={(event) => update("company", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Position</span>
            <Input placeholder="Owner, CEO, Sales Manager..." value={form.position} onChange={(event) => update("position", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Contact source</span>
            <Select value={form.source} onChange={(event) => update("source", event.target.value)}>
              {sources.map((source) => (
                <option key={source}>{source}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Email</span>
            <Input placeholder="Optional" value={form.email} onChange={(event) => update("email", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Phone</span>
            <Input placeholder="Optional" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Interest</span>
            <Input placeholder="What they asked about" value={form.interest} onChange={(event) => update("interest", event.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm text-slate-300">
            <span>Estimated value</span>
            <Input placeholder="0" value={form.dealValue} onChange={(event) => update("dealValue", event.target.value)} />
          </label>
        </div>

        <label className="mt-3 block space-y-1.5 text-sm text-slate-300">
          <span>What they messaged you</span>
          <Textarea
            placeholder="Paste or type the customer message here..."
            value={form.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </label>

        {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <Button disabled={isPending || !canAnalyze} onClick={analyze}>
            <Sparkles className="h-4 w-4" />
            Analyze Conversation
          </Button>
          <Button variant="secondary" disabled={isPending || !analysis} onClick={saveLead}>
            <Save className="h-4 w-4" />
            Save to CRM
          </Button>
          <Button variant="ghost" disabled={isPending} onClick={reset}>
            Clear
          </Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Analysis and Replies</h2>
            <p className="mt-1 text-sm text-slate-400">Review the AI output before saving the manual conversation.</p>
          </div>
          {savedLeadId ? <Badge tone="green">Saved</Badge> : analysis ? <Badge tone="cyan">Preview</Badge> : null}
        </div>

        {!analysis ? (
          <div className="mt-6 rounded-lg border border-line bg-white/5 p-6 text-sm leading-6 text-slate-400">
            <ClipboardList className="mb-3 h-5 w-5 text-cyan-300" />
            Add the client details and message, then run analysis. Suggested replies will appear here before you save the lead.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={analysis.temperature === "Hot" ? "rose" : analysis.temperature === "Warm" ? "amber" : "blue"}>{analysis.temperature}</Badge>
              <Badge tone="cyan">{analysis.score}% probability</Badge>
              <Badge tone="purple">{analysis.recommendedStage}</Badge>
              <Badge tone={analysis.provider === "openai" ? "green" : "amber"}>{analysis.provider === "openai" ? "Live AI" : "Fallback"}</Badge>
            </div>

            <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-cyan-50">{analysis.summary}</div>

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Intent", analysis.intent],
                ["Urgency", analysis.urgency],
                ["Budget", analysis.budgetReadiness],
                ["Main need", analysis.mainNeed],
                ["Pain point", analysis.painPoint],
                ["Next step", analysis.nextBestAction]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-white/5 p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-1 text-sm text-slate-100">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {replyEntries.map(([label, text]) => (
                <div key={label} className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-white">{label} reply</div>
                    <button
                      type="button"
                      onClick={() => copy(text)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-line text-slate-300 transition hover:bg-white/8 hover:text-white"
                      aria-label={`Copy ${label} reply`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>

            {savedLeadId ? (
              <a
                href={`/leads/${savedLeadId}`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-white/8 px-4 text-sm font-semibold text-slate-100 transition hover:bg-white/12"
              >
                <Send className="h-4 w-4" />
                Open saved lead
              </a>
            ) : null}
          </div>
        )}
      </Card>
    </div>
  );
}
