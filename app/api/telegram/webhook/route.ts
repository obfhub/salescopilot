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
    console.log("[Telegram] POST received");
    const update: TelegramUpdate = await request.json();

    const msg = update.message;
    if (!msg?.text || !msg?.from?.first_name || msg.from.is_bot) {
      console.log("[Telegram] Skipping - invalid message");
      return Response.json({ ok: true });
    }

    console.log(`[Telegram] Processing: ${msg.from.first_name} - ${msg.text}`);

    // Get workspace
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      console.log("[Telegram] No workspace");
      return Response.json({ ok: true });
    }

    // Create/find lead
    const fullName = msg.from.last_name 
      ? `${msg.from.first_name} ${msg.from.last_name}` 
      : msg.from.first_name;
    const slug = fullName.toLowerCase().replace(/\s+/g, "-");

    let lead = await prisma.lead.findFirst({
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
      console.log(`[Telegram] Created lead: ${lead.id}`);
    } else {
      console.log(`[Telegram] Found existing lead: ${lead.id}`);
    }

    // Save message
    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        author: fullName,
        sentAt: new Date(msg.date * 1000),
        type: "customer",
        text: msg.text,
      },
    });

    // Update lead
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastMessage: msg.text,
        lastContactDate: new Date(msg.date * 1000),
      },
    });

    console.log("[Telegram] Success");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Error:", error);
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
