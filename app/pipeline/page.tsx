import { PipelineClient } from "@/components/pipeline-client";
import { mockLeads } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  let leads = mockLeads;
  let databaseReady = false;

  try {
    const store = await import("@/lib/lead-store");
    databaseReady = store.databaseConfigured();
    leads = await store.getLeads();
  } catch (error) {
    console.error("Pipeline data load failed. Rendering mock leads.", error);
  }

  return <PipelineClient initialLeads={leads} databaseReady={databaseReady} />;
}
