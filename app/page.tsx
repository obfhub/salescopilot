import { DashboardClient } from "@/components/dashboard-client";
import { demoLeads } from "@/lib/demo-data";
import { isDemoSearch, type SearchParams } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const demoMode = await isDemoSearch(searchParams);
  let leads = demoMode ? demoLeads : [];

  if (!demoMode) {
    try {
      const store = await import("@/lib/lead-store");
      leads = await store.getLeads();
    } catch (error) {
      console.error("Dashboard data load failed.", error);
    }
  }

  return <DashboardClient leads={leads} />;
}
