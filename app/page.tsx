import { DashboardClient } from "@/components/dashboard-client";
import { mockLeads } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let leads = mockLeads;

  try {
    const store = await import("@/lib/lead-store");
    leads = await store.getLeads();
  } catch (error) {
    console.error("Dashboard data load failed. Rendering mock leads.", error);
  }

  return <DashboardClient leads={leads} />;
}
