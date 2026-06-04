import { prisma } from "@/lib/prisma";

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
    const update: TelegramUpdate = await request.json();

    const msg = update.message;
    if (!msg?.text || !msg?.from?.first_name || msg.from.is_bot) {
      return Response.json({ ok: true });
    }

    const fullName = msg.from.last_name 
      ? `${msg.from.first_name} ${msg.from.last_name}` 
      : msg.from.first_name;

    console.log(`[Telegram] ${new Date().toISOString()} - Message from ${fullName}: "${msg.text}"`);

    // Get workspace
    let workspace;
    try {
      console.log("[Telegram] Attempting to find workspace...");
      workspace = await prisma.workspace.findFirst();
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

    // Create lead
    const slug = fullName.toLowerCase().replace(/\s+/g, "-");

    let lead;
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
            company: "",
            position: "",
            email: "",
            phone: "",
            source: "Telegram",
            status: "New",
            pipelineStage: "NewLead",
            interest: "",
            temperature: "Warm",
            purchaseProbability: 50,
            dealValue: 0,
            lastMessage: msg.text,
            lastContactDate: new Date(msg.date * 1000),
          },
        });
        console.log("[Telegram] Lead created:", lead.id);
      } else {
        console.log("[Telegram] Lead found:", lead.id);
      }
    } catch (err) {
      console.error("[Telegram] Lead operation failed:", err instanceof Error ? err.message : err);
      console.error("[Telegram] Full error:", err);
      return Response.json({ ok: true });
    }

    // Save message
    try {
      console.log("[Telegram] Creating lead message...");
      await prisma.leadMessage.create({
        data: {
          leadId: lead.id,
          author: fullName,
          sentAt: new Date(msg.date * 1000),
          type: "customer",
          text: msg.text,
        },
      });
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
