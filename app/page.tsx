import { DashboardClient } from "@/components/dashboard-client";
import { getLeads } from "@/lib/lead-store";

export default async function DashboardPage() {
  const leads = await getLeads();
  return <DashboardClient leads={leads} />;
}
