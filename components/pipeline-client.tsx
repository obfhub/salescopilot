"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb } from "lucide-react";
import { pipelineStages } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import type { Lead, PipelineStage } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { ProbabilityBar } from "@/components/progress-ring";
import { useToast } from "@/components/toast-provider";
import { updateLeadStage } from "@/app/actions";

export function PipelineClient({ initialLeads, databaseReady }: { initialLeads: Lead[]; databaseReady: boolean }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isPending, startTransition] = useTransition();
  const { notify } = useToast();

  const grouped = useMemo(
    () =>
      pipelineStages.map((stage) => ({
        stage,
        leads: leads.filter((lead) => lead.pipelineStage === stage)
      })),
    [leads]
  );

  function changeStage(id: string, stage: PipelineStage) {
    const previous = leads.find((lead) => lead.id === id)?.pipelineStage;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, pipelineStage: stage } : lead)));

    if (!databaseReady) {
      notify("Configure DATABASE_URL to persist pipeline changes");
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateLeadStage({ leadSlug: id, stage });
        notify(result.persisted ? "Pipeline stage saved" : `Not saved: ${result.reason ?? "unknown reason"}`);
      } catch (error) {
        console.error("Failed to persist pipeline stage change.", error);
        notify("Could not save stage. Reverting change.");
        setLeads((current) => current.map((lead) => (lead.id === id && previous ? { ...lead, pipelineStage: previous } : lead)));
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Sales Pipeline</h1>
        <p className="mt-2 text-sm text-slate-300">Move leads through the CRM with AI tips attached to every opportunity.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {grouped.map(({ stage, leads: stageLeads }) => (
          <section key={stage} className="min-h-80 rounded-lg border border-line bg-slate-950/28 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">{stage}</h2>
              <Badge tone="slate">{stageLeads.length}</Badge>
            </div>
            <div className="space-y-3">
              {stageLeads.map((lead) => (
                <Card key={lead.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="font-semibold text-white hover:text-cyan-200">
                        {lead.name}
                      </Link>
                      <div className="text-xs text-slate-400">{lead.company}</div>
                    </div>
                    <Badge tone={lead.temperature === "Hot" ? "rose" : lead.temperature === "Warm" ? "amber" : "blue"}>{lead.temperature}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-400">
                    <div>
                      <div>Interest</div>
                      <div className="mt-1 font-semibold text-slate-200">{lead.interest}</div>
                    </div>
                    <div>
                      <div>Deal value</div>
                      <div className="mt-1 font-semibold text-slate-200">{formatCurrency(lead.dealValue)}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProbabilityBar value={lead.purchaseProbability} />
                  </div>
                  <div className="mt-4 rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-3 text-xs leading-5 text-cyan-50">
                    <div className="mb-1 flex items-center gap-2 font-semibold">
                      <Lightbulb className="h-3.5 w-3.5" />
                      AI tip
                    </div>
                    {lead.aiAnalysis.nextBestAction}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Select disabled={isPending} value={lead.pipelineStage} onChange={(event) => changeStage(lead.id, event.target.value as PipelineStage)}>
                      {pipelineStages.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </Select>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
