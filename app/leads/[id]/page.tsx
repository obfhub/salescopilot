import { LeadDetailsClient } from "@/components/lead-details-client";
import { databaseConfigured, getLeadBySlug } from "@/lib/lead-store";

export default async function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await getLeadBySlug(id);
  return <LeadDetailsClient lead={lead} databaseReady={databaseConfigured()} />;
}
