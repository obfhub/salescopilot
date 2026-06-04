"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Check, Copy, PenLine, Scissors, Send, Loader } from "lucide-react";
import { addLeadNote, updateTaskState } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";
import type { AiAnalysis, Lead, Note, Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { ProbabilityBar } from "@/components/progress-ring";
import { useToast } from "@/components/toast-provider";
import { useAiAnalysis } from "@/hooks/use-ai-analysis";

type ReplyKey = keyof AiAnalysis["replyOptions"];

export function LeadDetailsClient({ lead, databaseReady }: { lead?: Lead; databaseReady: boolean }) {
  const { notify } = useToast();
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<Note[]>(lead?.notes ?? []);
  const [tasks, setTasks] = useState<Task[]>(lead?.tasks ?? []);
  const [isPending, startTransition] = useTransition();
  
  // Use real AI analysis
  const { analysis, isLoading: aiLoading } = useAiAnalysis(
    lead ? {
      leadName: lead.name,
      company: lead.company,
      position: lead.position,
      interest: lead.interest,
      temperature: lead.temperature,
      lastMessage: lead.lastMessage,
    } : undefined
  );
  
  const [replyOptions, setReplyOptions] = useState<AiAnalysis["replyOptions"] | undefined>(
    analysis?.replyOptions ?? lead?.aiAnalysis.replyOptions
  );

  if (!lead || !replyOptions) {
    return (
      <Card>
        <h1 className="text-xl font-bold text-white">Lead not found</h1>
        <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-cyan-200">
          Back to dashboard
        </Link>
      </Card>
    );
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    notify("Reply copied to clipboard");
  }

  function saveNote() {
    const text = noteText.trim();
    if (!lead || !text) return;
    const optimisticNote: Note = {
      id: `optimistic-${Date.now()}`,
      text,
      createdAt: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    };
    setNotes((current) => [
      optimisticNote,
      ...current
    ]);
    setNoteText("");
    startTransition(async () => {
      try {
        await addLeadNote({ leadSlug: lead.id, text });
        notify(databaseReady ? "Note saved" : "Configure DATABASE_URL to persist notes");
      } catch (error) {
        setNotes((current) => current.filter((note) => note.id !== optimisticNote.id));
        notify(error instanceof Error ? error.message : "Could not save note");
      }
    });
  }

  function toggleTask(task: Task) {
    const completed = !task.completed;
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed } : item)));
    startTransition(async () => {
      try {
        await updateTaskState({ taskId: task.id, completed });
        notify(databaseReady ? "Task updated" : "Configure DATABASE_URL to persist tasks");
      } catch (error) {
        setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, completed: task.completed } : item)));
        notify(error instanceof Error ? error.message : "Could not update task");
      }
    });
  }

  function improveTone(key: ReplyKey) {
    if (!replyOptions) return;
    setReplyOptions((current) => ({
      ...current!,
      [key]: `${current![key]} I will keep the next step clear, practical, and tailored to your team's workflow.`
    }));
    notify("Tone improved");
  }

  function makeShorter(key: ReplyKey) {
    if (!replyOptions) return;
    setReplyOptions((current) => ({
      ...current!,
      [key]: current![key].split(".").slice(0, 2).join(".").trim() + "."
    }));
    notify("Reply shortened");
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{lead.name}</h1>
              <p className="mt-1 text-slate-300">
                {lead.position}, {lead.company}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="cyan">{lead.source}</Badge>
                <Badge tone="blue">{lead.status}</Badge>
                <Badge tone={lead.temperature === "Hot" ? "rose" : lead.temperature === "Warm" ? "amber" : "blue"}>{lead.temperature}</Badge>
              </div>
            </div>
            <div className="min-w-52 rounded-lg border border-line bg-white/5 p-4">
              <div className="text-xs uppercase text-slate-500">Purchase probability</div>
              <div className="mt-3">
                <ProbabilityBar value={lead.purchaseProbability} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Pipeline stage", lead.pipelineStage],
              ["Deal value", formatCurrency(lead.dealValue)],
              ["Last contact", lead.lastContactDate],
              ["Manager", lead.assignedManager],
              ["Email", lead.email],
              ["Phone", lead.phone],
              ["Interest", lead.interest],
              ["AI confidence", `${analysis?.confidence ?? lead.aiAnalysis.confidence}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-white/5 p-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-white">Lead Tasks</h2>
          <div className="mt-4 space-y-2">
            {tasks.map((task) => (
              <label key={task.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line bg-white/5 p-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  disabled={isPending}
                  checked={task.completed}
                  onChange={() => toggleTask(task)}
                />
                <span className={task.completed ? "text-slate-500 line-through" : ""}>{task.label}</span>
              </label>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-bold text-white">Message History</h2>
          <div className="mt-4 space-y-3">
            {lead.messageHistory.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border p-4 ${
                  message.type === "customer"
                    ? "border-blue-300/20 bg-blue-300/8"
                    : message.type === "manager"
                      ? "border-cyan-300/20 bg-cyan-300/8"
                      : "border-fuchsia-300/20 bg-fuchsia-300/8"
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">{message.author}</span>
                  <span>{message.time}</span>
                </div>
                <p className="text-sm leading-6 text-slate-200">{message.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-white">AI Sales Copilot Analysis</h2>
          <div className="mt-3 rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-cyan-50">
            {aiLoading ? (
              <div className="flex items-center gap-2 text-slate-400">
                <Loader className="h-4 w-4 animate-spin" />
                Analyzing lead with AI...
              </div>
            ) : (
              <p>{analysis?.summary ?? lead.aiAnalysis.summary}</p>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Opportunity", analysis?.opportunity ?? lead.aiAnalysis.intent],
              ["Interest level", lead.aiAnalysis.interestLevel],
              ["Urgency", lead.aiAnalysis.urgency],
              ["Budget readiness", lead.aiAnalysis.budgetReadiness],
              ["Main need", lead.aiAnalysis.mainNeed],
              ["Pain point", lead.aiAnalysis.painPoint],
              ["Possible objection", lead.aiAnalysis.objection],
              ["Lead loss risk", lead.aiAnalysis.lossRisk],
              ["Recommended next step", lead.aiAnalysis.nextBestAction],
              ["AI confidence score", `${analysis?.confidence ?? lead.aiAnalysis.confidence}%`]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-white/5 p-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="mt-1 text-sm text-slate-100">{value}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-bold text-white">AI Reply Options</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(Object.entries(replyOptions) as Array<[ReplyKey, string]>).map(([key, text]) => (
            <div key={key} className="rounded-lg border border-line bg-white/5 p-4">
              <div className="mb-3 text-sm font-bold capitalize text-white">{key === "sales" ? "Sales-focused" : key} reply</div>
              <p className="min-h-24 text-sm leading-6 text-slate-300">{text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => copy(text)}>
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button variant="secondary" onClick={() => notify("Reply inserted into mock composer")}>
                  <Send className="h-4 w-4" />
                  Use
                </Button>
                <Button variant="ghost" onClick={() => improveTone(key)}>
                  <PenLine className="h-4 w-4" />
                  Improve Tone
                </Button>
                <Button variant="ghost" onClick={() => makeShorter(key)}>
                  <Scissors className="h-4 w-4" />
                  Make Shorter
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Manager Notes</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <Textarea placeholder="Add context, decision maker notes, pricing concerns..." value={noteText} onChange={(event) => setNoteText(event.target.value)} />
          <Button className="h-auto min-h-10" disabled={isPending} onClick={saveNote}>
            <Check className="h-4 w-4" />
            Save Note
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-line bg-white/5 p-4">
              <div className="text-xs text-slate-500">{note.createdAt}</div>
              <div className="mt-2 text-sm text-slate-200">{note.text}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
