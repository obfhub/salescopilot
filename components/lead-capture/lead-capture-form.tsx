"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardList, Copy, MessageSquareText, Save, Send, Sparkles, UserRound } from "lucide-react";
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

type ChatMessage = {
  id: string;
  type: "customer" | "manager";
  author: string;
  text: string;
};

const sources = ["Manual", "Telegram", "WhatsApp", "Instagram", "Facebook", "Website", "Referral"];

const emptyProfile = {
  name: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  source: "Manual",
  interest: "Sales automation",
  dealValue: "0"
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTranscript(messages: ChatMessage[]) {
  return messages.map((message) => `${message.type === "customer" ? "Client" : "Sales manager"}: ${message.text}`).join("\n\n");
}

export function LeadCaptureForm() {
  const { notify } = useToast();
  const [isPending, startTransition] = useTransition();
  const [analysis, setAnalysis] = useState<CaptureAnalysis | null>(null);
  const [savedLeadId, setSavedLeadId] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [customerDraft, setCustomerDraft] = useState("");
  const [replyDraft, setReplyDraft] = useState("");

  const transcript = useMemo(() => formatTranscript(messages), [messages]);
  const canAnalyze = profile.name.trim().length >= 2 && messages.some((message) => message.type === "customer");
  const canSave = canAnalyze && messages.length > 0;
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

  function updateProfile(key: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [key]: value }));
    setSavedLeadId("");
  }

  function appendCustomerMessage() {
    const text = customerDraft.trim();
    if (!text) return;
    setMessages((current) => [...current, { id: newId(), type: "customer", author: profile.name.trim() || "Client", text }]);
    setCustomerDraft("");
    setAnalysis(null);
    setSavedLeadId("");
  }

  function appendManagerReply(text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;
    setMessages((current) => [...current, { id: newId(), type: "manager", author: "Sales manager", text: cleanText }]);
    setReplyDraft("");
    setSavedLeadId("");
    notify("Reply added to chat");
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    notify("Reply copied");
  }

  function buildPayload(nextMessages = messages) {
    const message = formatTranscript(nextMessages);
    return {
      ...profile,
      message,
      messages: nextMessages.map(({ type, author, text }) => ({ type, author, text }))
    };
  }

  async function post(url: string, nextMessages = messages) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(nextMessages))
    });
    return (await response.json()) as CaptureResult;
  }

  function analyze(nextMessages = messages) {
    setError("");
    setSavedLeadId("");
    startTransition(async () => {
      const payload = await post("/api/leads/preview", nextMessages);
      if (!payload.ok || !payload.analysis) {
        setAnalysis(null);
        setError(payload.error ?? "Could not analyze this conversation.");
        return;
      }
      setAnalysis(payload.analysis);
    });
  }

  function addCustomerAndAnalyze() {
    const text = customerDraft.trim();
    if (!text) return;
    const nextMessages = [...messages, { id: newId(), type: "customer" as const, author: profile.name.trim() || "Client", text }];
    setMessages(nextMessages);
    setCustomerDraft("");
    analyze(nextMessages);
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
      notify("Manual chat saved to CRM");
    });
  }

  function reset() {
    setProfile(emptyProfile);
    setMessages([]);
    setCustomerDraft("");
    setReplyDraft("");
    setAnalysis(null);
    setSavedLeadId("");
    setError("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Manual Chat Capture</h1>
              <p className="text-sm text-slate-400">Add the client profile once, then log the conversation turn by turn.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Client name</span>
              <Input placeholder="Client name" value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Company</span>
              <Input placeholder="Company or organization" value={profile.company} onChange={(event) => updateProfile("company", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Position</span>
              <Input placeholder="Owner, CEO, Sales Manager..." value={profile.position} onChange={(event) => updateProfile("position", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Contact source</span>
              <Select value={profile.source} onChange={(event) => updateProfile("source", event.target.value)}>
                {sources.map((source) => (
                  <option key={source}>{source}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Email</span>
              <Input placeholder="Optional" value={profile.email} onChange={(event) => updateProfile("email", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Phone</span>
              <Input placeholder="Optional" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Interest</span>
              <Input placeholder="What they asked about" value={profile.interest} onChange={(event) => updateProfile("interest", event.target.value)} />
            </label>
            <label className="space-y-1.5 text-sm text-slate-300">
              <span>Estimated value</span>
              <Input placeholder="0" value={profile.dealValue} onChange={(event) => updateProfile("dealValue", event.target.value)} />
            </label>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Conversation</h2>
              <p className="mt-1 text-sm text-slate-400">Log what the client says, send a reply, then analyze the next client message.</p>
            </div>
            {savedLeadId ? <Badge tone="green">Saved</Badge> : messages.length ? <Badge tone="cyan">{messages.length} turns</Badge> : null}
          </div>

          <div className="min-h-[260px] space-y-3 rounded-lg border border-line bg-slate-950/45 p-3">
            {messages.length === 0 ? (
              <div className="flex h-[230px] items-center justify-center text-center text-sm leading-6 text-slate-500">
                Add the first client message below. Analysis and suggested replies will update from the chat transcript.
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "manager" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-lg border px-4 py-3 text-sm leading-6 ${
                      message.type === "manager"
                        ? "border-cyan-300/25 bg-cyan-300/12 text-cyan-50"
                        : "border-line bg-white/6 text-slate-100"
                    }`}
                  >
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {message.type === "manager" ? "You" : message.author}
                    </div>
                    {message.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Textarea
              placeholder="Paste the client's next message..."
              value={customerDraft}
              onChange={(event) => setCustomerDraft(event.target.value)}
            />
            <div className="flex flex-col gap-3">
              <Button disabled={isPending || !customerDraft.trim() || profile.name.trim().length < 2} onClick={addCustomerAndAnalyze}>
                <Sparkles className="h-4 w-4" />
                Add and Analyze
              </Button>
              <Button variant="secondary" disabled={!customerDraft.trim()} onClick={appendCustomerMessage}>
                <MessageSquareText className="h-4 w-4" />
                Add Only
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
            <Textarea placeholder="Write your own reply..." value={replyDraft} onChange={(event) => setReplyDraft(event.target.value)} />
            <Button variant="secondary" disabled={!replyDraft.trim()} onClick={() => appendManagerReply(replyDraft)}>
              <Send className="h-4 w-4" />
              Send Reply
            </Button>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Button disabled={isPending || !canAnalyze} onClick={() => analyze()}>
              <Sparkles className="h-4 w-4" />
              Re-analyze Chat
            </Button>
            <Button variant="secondary" disabled={isPending || !canSave} onClick={saveLead}>
              <Save className="h-4 w-4" />
              Save Chat to CRM
            </Button>
            <Button variant="ghost" disabled={isPending} onClick={reset}>
              Clear
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">AI Analysis and Suggested Replies</h2>
            <p className="mt-1 text-sm text-slate-400">Suggestions are based on the full manual transcript.</p>
          </div>
          {analysis ? <Badge tone={analysis.provider === "openai" ? "green" : "amber"}>{analysis.provider === "openai" ? "Live AI" : "Fallback"}</Badge> : null}
        </div>

        {!analysis ? (
          <div className="mt-6 rounded-lg border border-line bg-white/5 p-6 text-sm leading-6 text-slate-400">
            <ClipboardList className="mb-3 h-5 w-5 text-cyan-300" />
            Add a client message and run analysis. Suggested replies will appear here, and you can add any of them directly into the chat.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone={analysis.temperature === "Hot" ? "rose" : analysis.temperature === "Warm" ? "amber" : "blue"}>{analysis.temperature}</Badge>
              <Badge tone="cyan">{analysis.score}% probability</Badge>
              <Badge tone="purple">{analysis.recommendedStage}</Badge>
              <Badge tone="blue">{analysis.confidence}% confidence</Badge>
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

            <div className="space-y-3">
              {replyEntries.map(([label, text]) => (
                <div key={label} className="rounded-lg border border-line bg-white/5 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-bold text-white">{label} reply</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copy(text)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-slate-300 transition hover:bg-white/8 hover:text-white"
                        aria-label={`Copy ${label} reply`}
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => appendManagerReply(text)}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/18"
                        aria-label={`Add ${label} reply to chat`}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
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
