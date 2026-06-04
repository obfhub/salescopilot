import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type TelegramMessage = {
  message_id: number;
  date: number;
  chat: { id: number; type: string };
  from?: { id: number; is_bot: boolean; first_name: string; last_name?: string };
  text?: string;
};

type TelegramUpdate = { update_id: number; message?: TelegramMessage };

function parseLeadNameFromMessage(text: string) {
  const phoneMatch = text.match(/\+?[\d\s\-()]{7,}/);
  const nameMatch = text.match(/^([A-Za-z\s]+)(?:\s|:|$)/);
  return {
    name: nameMatch?.[1]?.trim(),
    phone: phoneMatch?.[0]?.replace(/\D/g, "").slice(-10),
  };
}

async function findOrCreateLead(
  workspaceId: string,
  firstName: string,
  lastName: string | undefined,
  text: string | undefined
) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const slug = fullName.toLowerCase().replace(/\s+/g, "-");
  const { name, phone } = parseLeadNameFromMessage(text || "");

  let lead = await prisma.lead.findFirst({
    where: {
      workspaceId,
      OR: [
        { slug },
        { name: { contains: firstName, mode: "insensitive" as const } },
        ...(phone ? [{ phone }] : []),
      ],
    },
  });

  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        slug,
        workspaceId,
        name: name || fullName,
        company: "",
        position: "",
        email: "",
        phone: phone || "",
        source: "Telegram",
        status: "New",
        pipelineStage: "NewLead",
        interest: "",
        temperature: "Warm",
        purchaseProbability: 50,
        dealValue: 0,
        lastMessage: text || "",
        lastContactDate: new Date(),
      },
    });
  }

  return lead;
}

export async function POST(request: Request) {
  console.log("[Telegram] Webhook received");

  if (!BOT_TOKEN) {
    console.error("[Telegram] No BOT_TOKEN");
    return Response.json({ error: "No token" }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    console.log("[Telegram] Update:", update.update_id);

    const msg = update.message;
    if (!msg?.text || !msg?.from || msg.from.is_bot) {
      return Response.json({ ok: true });
    }

    console.log(`[Telegram] Message from ${msg.from.first_name}: ${msg.text}`);

    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      console.error("[Telegram] No workspace");
      return Response.json({ error: "No workspace" }, { status: 400 });
    }

    const lead = await findOrCreateLead(
      workspace.id,
      msg.from.first_name,
      msg.from.last_name,
      msg.text
    );
    console.log(`[Telegram] Lead: ${lead.id}`);

    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        author: `${msg.from.first_name}${msg.from.last_name ? ` ${msg.from.last_name}` : ""}`,
        sentAt: new Date(msg.date * 1000),
        type: "customer",
        text: msg.text,
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { lastMessage: msg.text, lastContactDate: new Date(msg.date * 1000) },
    });

    console.log("[Telegram] Success");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
