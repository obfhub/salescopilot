import { LeadDetailsClient } from "@/components/lead-details-client";
import { mockLeads } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lead = mockLeads.find((item) => item.id === id);
  let databaseReady = Boolean(process.env.DATABASE_URL);

  try {
    const store = await import("@/lib/lead-store");
    lead = await store.getLeadBySlug(id);
    databaseReady = store.databaseConfigured();
  } catch (error) {
    console.error(`Lead detail data load failed for ${id}. Rendering mock lead.`, error);
  }

  return <LeadDetailsClient lead={lead} databaseReady={databaseReady} />;
}
