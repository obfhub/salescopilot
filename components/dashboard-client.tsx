"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Search, Zap } from "lucide-react";
import { leadSources } from "@/lib/demo-data";
import { formatCurrency } from "@/lib/utils";
import type { Lead, LeadSource, LeadStatus, Temperature } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { ProbabilityBar } from "@/components/progress-ring";
import { useDemoMode } from "@/contexts/demo-mode-context";

const statusOptions: Array<LeadStatus | "All"> = ["All", "New", "Contacted", "Qualified", "Won", "Lost", "Waiting"];
const tempOptions: Array<Temperature | "All"> = ["All", "Hot", "Warm", "Cold"];
const sourceOptions: Array<LeadSource | "All"> = ["All", ...leadSources];

const toneForTemp = (temperature: Temperature) => (temperature === "Hot" ? "rose" : temperature === "Warm" ? "amber" : "blue");
const toneForStatus = (status: LeadStatus) => (status === "Won" ? "green" : status === "Waiting" ? "amber" : status === "Lost" ? "rose" : "cyan");

export function DashboardClient({ leads }: { leads: Lead[] }) {
  const { isDemoMode } = useDemoMode();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "All">("All");
  const [temperature, setTemperature] = useState<Temperature | "All">("All");
  const [source, setSource] = useState<LeadSource | "All">("All");
  const [desc, setDesc] = useState(true);

  const filtered = useMemo(() => {
    return leads
      .filter((lead) => {
        const haystack = `${lead.name} ${lead.company} ${lead.interest} ${lead.lastMessage}`.toLowerCase();
        return (
          haystack.includes(search.toLowerCase()) &&
          (status === "All" || lead.status === status) &&
          (temperature === "All" || lead.temperature === temperature) &&
          (source === "All" || lead.source === source)
        );
      })
      .sort((a, b) => (desc ? b.purchaseProbability - a.purchaseProbability : a.purchaseProbability - b.purchaseProbability));
  }, [leads, search, status, temperature, source, desc]);

  const hot = leads.filter((lead) => lead.temperature === "Hot").length;
  const activeDeals = leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length;
  const waiting = leads.filter((lead) => lead.status === "Waiting").length;
  const won = leads.filter((lead) => lead.status === "Won").length;
  const revenue = leads.reduce((sum, lead) => sum + lead.dealValue, 0);
  const hasLeads = leads.length > 0;

  const kpis = [
    ["Total Leads", leads.length.toString(), "Across seven acquisition sources"],
    ["Hot Leads", hot.toString(), "High probability opportunities"],
    ["Active Deals", activeDeals.toString(), "Open pipeline conversations"],
    ["Waiting for Reply", waiting.toString(), "Need manager attention"],
    ["Conversion Rate", `${Math.round((won / Math.max(leads.length, 1)) * 100)}%`, "Won from current dataset"],
    ["Potential Revenue", formatCurrency(revenue), "Weighted pipeline opportunity"],
    ["Average Response Time", hasLeads ? "11m" : "N/A", "Reply drafting speed"],
    ["AI Recommendations Today", hasLeads ? String(Math.max(leads.length * 3, hot)) : "0", "Next actions generated"]
  ];
  const leadHref = (id: string) => (isDemoMode ? `/leads/${id}?demo=1` : `/leads/${id}`);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Manager Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Analyze intent, prioritize deals, and turn incoming customer messages into confident next steps.
          </p>
        </div>
        <Badge tone="cyan" className="w-fit gap-2">
          <Zap className="h-3.5 w-3.5" />
          Live workspace
        </Badge>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, detail]) => (
          <Card key={label} className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-400">{label}</div>
            <div className="mt-3 text-2xl font-bold text-white">{value}</div>
            <div className="mt-2 text-xs text-slate-400">{detail}</div>
          </Card>
        ))}
      </section>

      <Card className="p-0">
        <div className="border-b border-line p-4">
          <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input className="pl-9" placeholder="Search leads, companies, messages..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={status} onChange={(event) => setStatus(event.target.value as LeadStatus | "All")}>
              {statusOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
            <Select value={temperature} onChange={(event) => setTemperature(event.target.value as Temperature | "All")}>
              {tempOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
            <Select value={source} onChange={(event) => setSource(event.target.value as LeadSource | "All")}>
              {sourceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
            <Button variant="secondary" onClick={() => setDesc((value) => !value)}>
              <ArrowDownWideNarrow className="h-4 w-4" />
              Probability
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                {["Client", "Source", "Status", "Pipeline Stage", "Interest", "Temperature", "Purchase Probability", "Last Message", "AI Recommendation", "Action"].map((head) => (
                  <th key={head} className="px-4 py-3 font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-t border-line align-top transition hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">{lead.name}</div>
                    <div className="text-xs text-slate-400">{lead.company}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{lead.source}</td>
                  <td className="px-4 py-4">
                    <Badge tone={toneForStatus(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{lead.pipelineStage}</td>
                  <td className="px-4 py-4 text-slate-300">{lead.interest}</td>
                  <td className="px-4 py-4">
                    <Badge tone={toneForTemp(lead.temperature)}>{lead.temperature}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <ProbabilityBar value={lead.purchaseProbability} />
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-300">{lead.lastMessage}</td>
                  <td className="max-w-xs px-4 py-4 text-slate-300">{lead.aiAnalysis.nextBestAction}</td>
                  <td className="px-4 py-4">
                    <Link
                      href={leadHref(lead.id)}
                      className="inline-flex h-9 items-center justify-center rounded-lg border border-line bg-white/8 px-3 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/12"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!filtered.length ? (
          <div className="p-12 text-center">
            <div className="text-lg font-semibold text-white">{leads.length ? "No leads match these filters" : "No leads yet"}</div>
            <p className="mt-2 text-sm text-slate-400">
              {leads.length ? "Try clearing one filter or searching for another customer signal." : "Create your first lead from Capture, or enable Demo for a guided preview."}
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
