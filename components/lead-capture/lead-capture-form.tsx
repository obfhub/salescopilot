"use client";

import { useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CaptureResult = {
  ok: boolean;
  error?: string;
  leadId?: string;
  analysis?: {
    temperature: string;
    score: number;
    intent: string;
    recommendedStage: string;
    nextBestAction: string;
    reply: string;
  };
};

const sources = ["Website", "Telegram", "Instagram", "Facebook", "Referral", "Manual", "WhatsApp"];

export function LeadCaptureForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [form, setForm] = useState({
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    source: "Website",
    interest: "Sales automation",
    dealValue: "0",
    message: ""
  });

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as CaptureResult;
      setResult(payload);
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Capture a New Lead</h1>
            <p className="text-sm text-slate-400">Submit a customer message and let AI Sales Copilot qualify it.</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input placeholder="Client name" value={form.name} onChange={(event) => update("name", event.target.value)} />
          <Input placeholder="Company" value={form.company} onChange={(event) => update("company", event.target.value)} />
          <Input placeholder="Position" value={form.position} onChange={(event) => update("position", event.target.value)} />
          <Input placeholder="Email" value={form.email} onChange={(event) => update("email", event.target.value)} />
          <Input placeholder="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          <Select value={form.source} onChange={(event) => update("source", event.target.value)}>
            {sources.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </Select>
          <Input placeholder="Interest" value={form.interest} onChange={(event) => update("interest", event.target.value)} />
          <Input placeholder="Estimated deal value" value={form.dealValue} onChange={(event) => update("dealValue", event.target.value)} />
        </div>

        <Textarea className="mt-3" placeholder="Customer message..." value={form.message} onChange={(event) => update("message", event.target.value)} />

        <Button className="mt-4" disabled={isPending} onClick={submit}>
          <Send className="h-4 w-4" />
          Submit Lead
        </Button>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Result</h2>
        {!result ? (
          <p className="mt-3 text-sm leading-6 text-slate-400">The created lead and AI analysis will appear here after submission.</p>
        ) : result.ok && result.analysis ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={result.analysis.temperature === "Hot" ? "rose" : result.analysis.temperature === "Warm" ? "amber" : "blue"}>
                {result.analysis.temperature}
              </Badge>
              <Badge tone="cyan">{result.analysis.score}% probability</Badge>
              <Badge tone="purple">{result.analysis.recommendedStage}</Badge>
            </div>
            <div className="rounded-lg border border-line bg-white/5 p-4">
              <div className="text-xs text-slate-500">Intent</div>
              <div className="mt-1 text-sm text-slate-100">{result.analysis.intent}</div>
            </div>
            <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-cyan-50">{result.analysis.nextBestAction}</div>
            <div className="rounded-lg border border-line bg-white/5 p-4">
              <div className="text-xs text-slate-500">Suggested reply</div>
              <div className="mt-2 text-sm leading-6 text-slate-200">{result.analysis.reply}</div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-rose-200">{result.error ?? "Could not submit lead."}</p>
        )}
      </Card>
    </div>
  );
}
