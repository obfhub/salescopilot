import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { analyzeLeadMessage } from "@/lib/ai-analysis";
import { sendEmail } from "@/lib/email";
import { sourceToDb, stageToDb, temperatureToDb } from "@/lib/db-mapping";
import { requireWorkspaceAccess } from "@/lib/auth";
import type { LeadSource } from "@/types";

export const leadCaptureSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().default(""),
  position: z.string().trim().max(120).optional().default("Decision maker"),
  email: z.union([z.string().trim().email(), z.literal("")]).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  source: z.enum(["Telegram", "Instagram", "Website", "Facebook", "Referral", "Manual", "WhatsApp"]).default("Manual"),
  interest: z.string().trim().min(2).max(160).default("Sales automation"),
  message: z.string().trim().min(10).max(4000),
  dealValue: z.coerce.number().int().min(0).max(10000000).optional().default(0)
});

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "lead"}-${Math.random().toString(36).slice(2, 8)}`;
}

async function getDefaultAssignee(workspaceId: string) {
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, role: { in: ["owner", "admin", "manager", "sales"] } },
    orderBy: { createdAt: "asc" },
    include: { user: true }
  });
  return member?.user ?? null;
}

export async function previewCapturedLead(input: unknown) {
  const data = leadCaptureSchema.parse(input);
  const company = data.company || "Unknown company";
  const context = `Name: ${data.name}. Company: ${company}. Position: ${data.position}. Interest: ${data.interest}. Source: ${data.source}.`;
  const analysis = await analyzeLeadMessage(data.message, context);
  return { data: { ...data, company }, analysis };
}

export async function createCapturedLead(input: unknown) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database is not configured.");
  }

  const { data, analysis } = await previewCapturedLead(input);
  const auth = await requireWorkspaceAccess("sales");
  const workspaceId = auth.workspaceId;
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error(`Workspace ${workspaceId} was not found.`);

  const assignee = (await prisma.user.findUnique({ where: { id: auth.userId } })) ?? (await getDefaultAssignee(workspaceId));
  const stage = analysis.recommendedStage;
  const now = new Date();

  const lead = await prisma.lead.create({
    data: {
      slug: slugify(`${data.name}-${data.company}`),
      workspaceId,
      assignedUserId: assignee?.id,
      name: data.name,
      company: data.company,
      position: data.position,
      email: data.email.toLowerCase(),
      phone: data.phone,
      source: sourceToDb(data.source as LeadSource),
      status: "New",
      pipelineStage: stageToDb(stage),
      interest: data.interest,
      temperature: temperatureToDb(analysis.temperature),
      purchaseProbability: analysis.score,
      dealValue: data.dealValue,
      lastMessage: data.message,
      lastContactDate: now,
      messages: {
        create: [
          { author: data.name, sentAt: now, type: "customer", text: data.message },
          { author: "AI Sales Copilot", sentAt: now, type: "ai", text: analysis.summary }
        ]
      },
      tasks: {
        create: [
          { label: "Call the client" },
          { label: "Send presentation" },
          { label: "Confirm pricing" },
          { label: "Schedule demo" },
          { label: "Follow up tomorrow" }
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
          recommendedStage: stageToDb(stage),
          nextBestAction: analysis.nextBestAction,
          confidence: analysis.confidence,
          summary: analysis.summary,
          reply: analysis.reply,
          replyShort: analysis.replyOptions?.short ?? "",
          replyProfessional: analysis.replyOptions?.professional ?? "",
          replySales: analysis.replyOptions?.sales ?? "",
          replyClosing: analysis.replyOptions?.closing ?? "",
          modelProvider: analysis.provider,
          promptVersion: analysis.provider === "openai" ? "openai-v1" : "mock-v1"
        }
      },
      events: {
        create: { toStage: stageToDb(stage), userId: assignee?.id }
      }
    }
  });

  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.LEAD_NOTIFICATION_EMAIL) {
    await sendEmail({
      to: process.env.LEAD_NOTIFICATION_EMAIL,
      subject: `New ${analysis.temperature} lead: ${data.name} from ${data.company}`,
      text: `${data.name} from ${data.company} submitted a lead.\n\nMessage:\n${data.message}\n\nAI summary:\n${analysis.summary}`,
      html: `<p><strong>${data.name}</strong> from <strong>${data.company}</strong> submitted a lead.</p><p>${data.message}</p><p><strong>AI summary:</strong> ${analysis.summary}</p>`
    }).catch((error) => console.error("Lead notification email failed.", error));
  }

  return { leadId: lead.slug, analysis };
}
