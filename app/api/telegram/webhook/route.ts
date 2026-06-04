import { prisma } from "@/lib/prisma";
import { getRequestedWorkspaceId } from "@/lib/auth";

export async function HEAD() {
  console.log("[Telegram] HEAD request - webhook is accessible");
  return new Response(null, { status: 200 });
}

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
    { name: { contains: firstName, mode: "insensitive" as const } },
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
        pipelineStage: "NewLead",
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
  console.log("[Telegram] Webhook received");
  
  if (!BOT_TOKEN) {
    console.error("[Telegram] BOT_TOKEN not configured");
    return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  try {
    const update: TelegramUpdate = await request.json();
    console.log("[Telegram] Update received:", JSON.stringify(update, null, 2));

    if (!update.message || !update.message.text) {
      console.log("[Telegram] No message or text, skipping");
      return Response.json({ ok: true });
    }

    const msg = update.message;
    if (!msg.from || msg.from.is_bot) {
      console.log("[Telegram] Message from bot or no sender, skipping");
      return Response.json({ ok: true });
    }

    console.log(`[Telegram] Processing message from ${msg.from.first_name}: "${msg.text}"`);

    let workspaceId: string;
    try {
      workspaceId = getRequestedWorkspaceId();
      console.log(`[Telegram] Workspace ID from context: ${workspaceId}`);
    } catch (err) {
      console.error("[Telegram] Failed to get workspace ID from context:", err);
      
      // If no context, try to get the first workspace from database
      try {
        const workspace = await prisma.workspace.findFirst();
        if (!workspace) {
          console.error("[Telegram] No workspace found in database");
          return Response.json({ ok: false, error: "No workspace found" }, { status: 400 });
        }
        workspaceId = workspace.id;
        console.log(`[Telegram] Using first workspace: ${workspaceId}`);
      } catch (dbErr) {
        console.error("[Telegram] Database error finding workspace:", dbErr);
        return Response.json({ ok: false, error: "Database error" }, { status: 500 });
      }
    }

    const lead = await findOrCreateLead(
      workspaceId,
      msg.from.id,
      msg.from.first_name,
      msg.from.last_name,
      msg.text
    );
    console.log(`[Telegram] Lead created/found: ${lead.id}`);

    await prisma.leadMessage.create({
      data: {
        leadId: lead.id,
        author: `${msg.from.first_name}${msg.from.last_name ? ` ${msg.from.last_name}` : ""}`,
        sentAt: new Date(msg.date * 1000),
        type: "customer",
        text: msg.text || ""
      }
    });
    console.log(`[Telegram] Message saved to lead`);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        lastMessage: msg.text,
        lastContactDate: new Date(msg.date * 1000)
      }
    });
    console.log(`[Telegram] Lead updated successfully`);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[Telegram] Webhook error:", error);
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
