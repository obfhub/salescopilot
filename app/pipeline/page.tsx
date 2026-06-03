import { PipelineClient } from "@/components/pipeline-client";
import { databaseConfigured, getLeads } from "@/lib/lead-store";

export default async function PipelinePage() {
  const leads = await getLeads();
  return <PipelineClient initialLeads={leads} databaseReady={databaseConfigured()} />;
}
