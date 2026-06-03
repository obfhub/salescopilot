"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { analyzeMessage } from "@/lib/analyze-message";
import type { AiAnalysis, Temperature } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { ProbabilityBar } from "@/components/progress-ring";

type Result = AiAnalysis & { score: number; temperature: Temperature; objections: string[] };

export default function SimulatorPage() {
  const [message, setMessage] = useState(
    "We need a Telegram bot integration quickly. Can you show us a demo and send pricing for five sales managers today?"
  );
  const [result, setResult] = useState<Result | null>(null);

  function runAnalysis() {
    setResult(analyzeMessage(message));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Incoming Message Simulator</h1>
        <p className="mt-2 text-sm text-slate-300">Paste a customer message and test how the mock AI classifies sales intent.</p>
      </div>

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
          <Button className="h-auto min-h-12" onClick={runAnalysis}>
            <Sparkles className="h-4 w-4" />
            Analyze
          </Button>
        </div>
      </Card>

      {result ? (
        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-slate-950">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">AI Result</h2>
                <p className="text-sm text-slate-400">Mock classification output</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs uppercase text-slate-500">Purchase probability</div>
                <ProbabilityBar value={result.score} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={result.temperature === "Hot" ? "rose" : result.temperature === "Warm" ? "amber" : "blue"}>{result.temperature}</Badge>
                <Badge tone="cyan">{result.intent}</Badge>
                <Badge tone={result.urgency === "High" ? "rose" : "slate"}>{result.urgency} urgency</Badge>
              </div>
              <p className="rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-cyan-50">{result.summary}</p>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-white">Analysis Details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Customer type", result.customerType],
                ["Intent", result.intent],
                ["Lead temperature", result.temperature],
                ["Urgency", result.urgency],
                ["Purchase probability", `${result.score}%`],
                ["Objections", result.objections.length ? result.objections.join(", ") : "None detected"],
                ["Customer need", result.mainNeed],
                ["Recommended pipeline stage", result.recommendedStage],
                ["Next best action", result.nextBestAction],
                ["AI-generated reply", result.reply]
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-white/5 p-3">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-100">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      ) : (
        <Card className="py-12 text-center">
          <div className="text-lg font-semibold text-white">Ready to analyze</div>
          <p className="mt-2 text-sm text-slate-400">The result will appear here after you press Analyze.</p>
        </Card>
      )}
    </div>
  );
}
