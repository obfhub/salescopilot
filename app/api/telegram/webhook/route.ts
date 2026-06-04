import { prisma } from "@/lib/prisma";
import { analyzeLeadMessage } from "@/lib/ai-analysis";
import { stageToDb, temperatureToDb } from "@/lib/db-mapping";

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    date: number;
    text?: string;
    from?: { id: number; is_bot: boolean; first_name: string; last_name?: string };
    chat: { id: number; type: string };
  };
};

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get("workspaceId");
    const update: TelegramUpdate = await request.json();

    const msg = update.message;
    if (!msg?.text || !msg?.from?.first_name || msg.from.is_bot) {
      return Response.json({ ok: true });
    }

    const fullName = msg.from.last_name 
      ? `${msg.from.first_name} ${msg.from.last_name}` 
      : msg.from.first_name;

    console.log(`[Telegram] ${new Date().toISOString()} - Message from ${fullName}: "${msg.text}"`);

    let workspace;
    try {
      console.log("[Telegram] Attempting to find workspace...");
      workspace = workspaceId
        ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
        : await prisma.workspace.findFirst({ where: { settings: { is: { telegramToken: { not: null } } } } });
      console.log("[Telegram] Workspace found:", workspace?.id);
    } catch (err) {
      console.error("[Telegram] Workspace query failed:", err instanceof Error ? err.message : err);
      console.error("[Telegram] Full error:", err);
      return Response.json({ ok: true });
    }

    if (!workspace) {
      console.warn("[Telegram] No workspace found in database");
      return Response.json({ ok: true });
    }

    const slug = fullName.toLowerCase().replace(/\s+/g, "-");
    const context = `Telegram message from ${fullName}. Workspace: ${workspace.name}.`;
    const analysis = await analyzeLeadMessage(msg.text, context);
    const stage = stageToDb(analysis.recommendedStage);
    const temperature = temperatureToDb(analysis.temperature);

    let lead;
    let createdLead = false;
    try {
      console.log("[Telegram] Finding lead with slug:", slug);
      lead = await prisma.lead.findFirst({
        where: { workspaceId: workspace.id, slug },
      });

      if (!lead) {
        console.log("[Telegram] Lead not found, creating new lead...");
        lead = await prisma.lead.create({
          data: {
            workspaceId: workspace.id,
            slug,
            name: fullName,
            company: "Telegram",
            position: "Telegram contact",
            email: "",
            phone: "",
            source: "Telegram",
            status: "New",
            pipelineStage: stage,
            interest: "Telegram inquiry",
            temperature,
            purchaseProbability: analysis.score,
            dealValue: 0,
            lastMessage: msg.text,
            lastContactDate: new Date(msg.date * 1000),
            messages: {
              create: [
                {
                  author: fullName,
                  sentAt: new Date(msg.date * 1000),
                  type: "customer",
                  text: msg.text
                },
                {
                  author: "AI Sales Copilot",
                  sentAt: new Date(),
                  type: "ai",
                  text: analysis.summary
                }
              ]
            },
            tasks: {
              create: [
                { label: "Reply in Telegram" },
                { label: "Qualify request" },
                { label: "Confirm budget" }
              ]
            },
            analysis: {
              create: {
                customerType: analysis.customerType,
                intent: analysis.intent,
                interestLevel: analysis.interestLevel,
                urgency: analysis.urgency,
                budgetReadiness: analysis.budgetReadiness,
                mainNeed: analysis.mainNeed,
                painPoint: analysis.painPoint,
                objection: analysis.objection,
                lossRisk: analysis.lossRisk,
                recommendedStage: stage,
                nextBestAction: analysis.nextBestAction,
                confidence: analysis.confidence,
                summary: analysis.summary,
                reply: analysis.reply,
                replyShort: analysis.replyOptions.short ?? "",
                replyProfessional: analysis.replyOptions.professional,
                replySales: analysis.replyOptions.sales ?? "",
                replyClosing: analysis.replyOptions.closing ?? "",
                modelProvider: analysis.provider,
                promptVersion: analysis.provider === "openai" ? "openai-v1" : "mock-v1"
              }
            }
          },
        });
        createdLead = true;
        console.log("[Telegram] Lead created:", lead.id);
      } else {
        console.log("[Telegram] Lead found:", lead.id);
      }
    } catch (err) {
      console.error("[Telegram] Lead operation failed:", err instanceof Error ? err.message : err);
      console.error("[Telegram] Full error:", err);
      return Response.json({ ok: true });
    }

    if (!lead) {
      return Response.json({ ok: true });
    }

    try {
      console.log("[Telegram] Creating lead message...");
      if (!createdLead) {
        await prisma.leadMessage.create({
          data: {
            leadId: lead.id,
            author: fullName,
            sentAt: new Date(msg.date * 1000),
            type: "customer",
            text: msg.text,
          },
        });
      }
      console.log("[Telegram] Message saved");
    } catch (err) {
      console.error("[Telegram] Message creation failed:", err instanceof Error ? err.message : err);
    }

    // Update lead
    try {
      console.log("[Telegram] Updating lead...");
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastMessage: msg.text,
          lastContactDate: new Date(msg.date * 1000),
          pipelineStage: stage,
          temperature,
          purchaseProbability: analysis.score,
        },
      });
      console.log("[Telegram] Lead updated");
    } catch (err) {
      console.error("[Telegram] Lead update failed:", err instanceof Error ? err.message : err);
    }

    console.log("[Telegram] Success - all operations completed");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Webhook error:", error instanceof Error ? error.message : error);
    console.error("[Telegram] Full error:", error);
    return Response.json({ ok: true });
  }
}
