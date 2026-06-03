import { PipelineClient } from "@/components/pipeline-client";
import { mockLeads } from "@/lib/mock-data";

export default function PipelinePage() {
  return <PipelineClient initialLeads={mockLeads} databaseReady={false} />;
}
