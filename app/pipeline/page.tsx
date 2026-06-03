import { PipelineClient } from "@/components/pipeline-client";
import { mockLeads } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  let leads = mockLeads;
  let databaseReady = Boolean(process.env.DATABASE_URL);

  try {
    const store = await import("@/lib/lead-store");
    leads = await store.getLeads();
    databaseReady = store.databaseConfigured();
  } catch (error) {
    console.error("Pipeline data load failed. Rendering mock leads.", error);
  }

  return <PipelineClient initialLeads={leads} databaseReady={databaseReady} />;
}
