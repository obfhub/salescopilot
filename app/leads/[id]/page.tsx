import { LeadDetailsClient } from "@/components/lead-details-client";
import { mockLeads } from "@/lib/mock-data";
import { isDemoSearch, type SearchParams } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function LeadDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const demoMode = await isDemoSearch(searchParams);
  let lead = demoMode ? mockLeads.find((item) => item.id === id) : undefined;
  let databaseReady = !demoMode && Boolean(process.env.DATABASE_URL);

  if (!demoMode) {
    try {
      const store = await import("@/lib/lead-store");
      lead = await store.getLeadBySlug(id);
      databaseReady = store.databaseConfigured();
    } catch (error) {
      console.error(`Lead detail data load failed for ${id}.`, error);
    }
  }

  return <LeadDetailsClient lead={lead} databaseReady={databaseReady} />;
}
