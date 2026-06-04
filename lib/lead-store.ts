import { unstable_noStore as noStore } from "next/cache";
import type { Lead, Message, Note, Task } from "@/types";
import { prisma } from "@/lib/prisma";
import { analyzeMessage } from "@/lib/analyze-message";
import { messageTypeFromDb, sourceFromDb, stageFromDb, statusFromDb, temperatureFromDb } from "@/lib/db-mapping";
import { getRequestedWorkspaceId, requireWorkspaceAccess } from "@/lib/auth";

const leadInclude = {
  assignedUser: true,
  messages: { orderBy: { sentAt: "asc" as const } },
  analysis: true,
  tasks: { orderBy: { createdAt: "asc" as const } },
  notes: { orderBy: { createdAt: "desc" as const } }
};

type DbLead = Awaited<ReturnType<typeof prisma.lead.findFirst<{ include: typeof leadInclude }>>>;
type NonNullDbLead = NonNullable<DbLead>;

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getWorkspaceId() {
  return getRequestedWorkspaceId();
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(date);
}

function mapLead(row: NonNullDbLead): Lead {
  const analysis = row.analysis;
  const fallbackAnalysis = analyzeMessage(row.lastMessage);

  return {
    id: row.slug,
    name: row.name,
    company: row.company,
    position: row.position,
    email: row.email,
    phone: row.phone,
    source: sourceFromDb(row.source),
    status: statusFromDb(row.status),
    pipelineStage: stageFromDb(row.pipelineStage),
    interest: row.interest,
    temperature: temperatureFromDb(row.temperature),
    purchaseProbability: row.purchaseProbability,
    dealValue: row.dealValue,
    lastMessage: row.lastMessage,
    lastContactDate: row.lastContactDate.toISOString().slice(0, 10),
    assignedManager: row.assignedUser?.name ?? "Unassigned",
    messageHistory: row.messages.map<Message>((message) => ({
      id: message.id,
      author: message.author,
      time: formatTime(message.sentAt),
      type: messageTypeFromDb(message.type),
      text: message.text
    })),
    aiAnalysis: analysis
      ? {
          customerType: analysis.customerType,
          intent: analysis.intent,
          interestLevel: analysis.interestLevel,
          urgency: analysis.urgency as Lead["aiAnalysis"]["urgency"],
          budgetReadiness: analysis.budgetReadiness,
          mainNeed: analysis.mainNeed,
          painPoint: analysis.painPoint,
          objection: analysis.objection,
          lossRisk: analysis.lossRisk,
          recommendedStage: stageFromDb(analysis.recommendedStage),
          nextBestAction: analysis.nextBestAction,
          confidence: analysis.confidence,
          summary: analysis.summary,
          reply: analysis.reply,
          replyOptions: {
            short: analysis.replyShort,
            professional: analysis.replyProfessional,
            sales: analysis.replySales,
            closing: analysis.replyClosing
          }
        }
      : fallbackAnalysis,
    tasks: row.tasks.map<Task>((task) => ({
      id: task.id,
      label: task.label,
      completed: task.completed
    })),
    notes: row.notes.map<Note>((note) => ({
      id: note.id,
      text: note.text,
      createdAt: note.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })
    }))
  };
}

export async function getLeads(): Promise<Lead[]> {
  noStore();
  if (!databaseConfigured()) return [];

  try {
    const auth = await requireWorkspaceAccess("sales");
    const rows = await prisma.lead.findMany({
      where: { workspaceId: auth.workspaceId },
      include: leadInclude,
      orderBy: { purchaseProbability: "desc" }
    });

    return rows.map(mapLead);
  } catch (error) {
    console.error("Database lead list read failed.", error);
    return [];
  }
}

export async function getLeadBySlug(slug: string): Promise<Lead | undefined> {
  noStore();
  if (!databaseConfigured()) return undefined;

  try {
    const auth = await requireWorkspaceAccess("sales");
    const row = await prisma.lead.findFirst({
      where: { workspaceId: auth.workspaceId, slug },
      include: leadInclude
    });

    return row ? mapLead(row) : undefined;
  } catch (error) {
    console.error(`Database lead read failed for ${slug}.`, error);
    return undefined;
  }
}
