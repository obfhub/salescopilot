import { PipelineClient } from "@/components/pipeline-client";
import { mockLeads } from "@/lib/mock-data";
import { isDemoSearch, type SearchParams } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function PipelinePage({ searchParams }: { searchParams: SearchParams }) {
  const demoMode = await isDemoSearch(searchParams);
  let leads = demoMode ? mockLeads : [];
  let databaseReady = false;

  if (!demoMode) {
    try {
      const store = await import("@/lib/lead-store");
      databaseReady = store.databaseConfigured();
      leads = await store.getLeads();
    } catch (error) {
      console.error("Pipeline data load failed.", error);
    }
  }

  return <PipelineClient initialLeads={leads} databaseReady={databaseReady} />;
}
