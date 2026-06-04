import { prisma } from "@/lib/prisma";
import { getRequestedWorkspaceId } from "@/lib/auth";
import { QueryMode } from "@prisma/client";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

type TelegramMessage = {
  message_id: number;
  date: number;
  chat: {
    id: number;
    type: string;
    title?: string;
  };
  from?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
};

type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

function parseLeadNameFromMessage(text: string): { name?: string; phone?: string } {
  const phoneMatch = text.match(/\+?[\d\s\-()]{7,}/);
  const nameMatch = text.match(/^([A-Za-z\s]+)(?:\s|:|$)/);

  return {
    name: nameMatch?.[1]?.trim(),
    phone: phoneMatch?.[0]?.replace(/\D/g, "").slice(-10)
  };
}

async function findOrCreateLead(
  workspaceId: string,
  telegramUserId: number,
  firstName: string,
  lastName?: string,
  text?: string
) {
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const slug = fullName.toLowerCase().replace(/\s+/g, "-");

  const { name, phone } = parseLeadNameFromMessage(text || "");

  const orConditions = [
    { slug },
    { name: { contains: firstName, mode: QueryMode.insensitive } },
    ...(phone ? [{ phone }] : [])
  ];

  let lead = await prisma.lead.findFirst({
    where: {
      workspaceId,
      ...(orConditions.length > 0 ? { OR: orConditions } : {})
    }
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
        pipelineStage: "New Lead",
        interest: "",
        temperature: "Warm",
        purchaseProbability: 50,
        dealValue: 0,
        lastMessage: text || "",
        lastContactDate: new Date()
      }
    });
  }

  return lead;
}

export async function POST(request: Request) {
  if (!BOT_TOKEN) {
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await request.json();

    if (!update.message || !update.message.text) {
      return Response.json({ ok: true });
    }

    const msg = update.message;
    if (!msg.from || msg.from.is_bot) {
      return Response.json({ ok: true });
    }

    const workspaceId = getRequestedWorkspaceId();

    const lead = await findOrCreateLead(
      workspaceId,
      msg.from.id,
      msg.from.first_name,
      msg.from.last_name,
      msg.text
    );

    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        author: `${msg.from.first_name}${msg.from.last_name ? ` ${msg.from.last_name}` : ""}`,
        sentAt: new Date(msg.date * 1000),
        type: "customer",
        text: msg.text || ""
      }
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastMessage: msg.text,
        lastContactDate: new Date(msg.date * 1000)
      }
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
