import { z } from "zod";
import { analyzeLeadMessage } from "@/lib/ai-analysis";

const analysisRequestSchema = z.object({
  leadName: z.string().trim().min(1, "leadName required"),
  company: z.string().trim().min(1).default("Unknown company"),
  position: z.string().trim().min(1).default("Decision maker"),
  lastMessage: z.string().trim().optional().default("No message"),
  interest: z.string().trim().optional().default("General"),
  temperature: z.string().trim().optional()
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  const parsed = analysisRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid lead data." }, { status: 400 });
  }

  try {
    const lead = parsed.data;
    const context = [
      `Lead: ${lead.leadName}`,
      `Company: ${lead.company}`,
      `Position: ${lead.position}`,
      `Interest: ${lead.interest}`,
      lead.temperature ? `Current temperature: ${lead.temperature}` : null
    ]
      .filter(Boolean)
      .join(". ");

    const analysis = await analyzeLeadMessage(lead.lastMessage, context);

    return Response.json({
      summary: analysis.summary,
      opportunity: analysis.intent,
      confidence: analysis.confidence,
      replyOptions: {
        professional: analysis.replyOptions.professional,
        casual: analysis.replyOptions.sales ?? analysis.replyOptions.professional,
        brief: analysis.replyOptions.short ?? analysis.reply
      }
    });
  } catch (error) {
    console.error("[AI Analysis] Request error:", error);
    return Response.json({ error: "Failed to analyze lead" }, { status: 500 });
  }
}
