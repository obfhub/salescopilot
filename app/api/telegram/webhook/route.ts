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

    // Get workspace
    let workspace;
    try {
      workspace = await prisma.workspace.findFirst();
    } catch (err) {
      console.error("[Telegram] DB error:", err);
      return Response.json({ ok: true });
    }

    if (!workspace) {
      return Response.json({ ok: true });
    }

    // Create lead
    const fullName = msg.from.last_name 
      ? `${msg.from.first_name} ${msg.from.last_name}` 
      : msg.from.first_name;
    const slug = fullName.toLowerCase().replace(/\s+/g, "-");

    let lead;
    try {
      lead = await prisma.lead.findFirst({
        where: { workspaceId: workspace.id, slug },
      });

      if (!lead) {
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
      }
    } catch (err) {
      console.error("[Telegram] Lead error:", err);
      return Response.json({ ok: true });
    }

    // Save message
    try {
      await prisma.leadMessage.create({
        data: {
          leadId: lead.id,
          author: fullName,
          sentAt: new Date(msg.date * 1000),
          type: "customer",
          text: msg.text,
        },
      });
    } catch (err) {
      console.error("[Telegram] Message error:", err);
    }

    // Update lead
    try {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          lastMessage: msg.text,
          lastContactDate: new Date(msg.date * 1000),
        },
      });
    } catch (err) {
      console.error("[Telegram] Update error:", err);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
