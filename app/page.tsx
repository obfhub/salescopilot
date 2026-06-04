import { DashboardClient } from "@/components/dashboard-client";
import { mockLeads } from "@/lib/mock-data";
import { isDemoSearch, type SearchParams } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const demoMode = await isDemoSearch(searchParams);
  let leads = demoMode ? mockLeads : [];

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
