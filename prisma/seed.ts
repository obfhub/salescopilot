import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mockLeads } from "../lib/mock-data";
import { messageTypeToDb, sourceToDb, stageToDb, statusToDb, temperatureToDb } from "../lib/db-mapping";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: process.env.DEMO_WORKSPACE_ID || "demo-workspace" },
    update: { name: "Apex Revenue Systems" },
    create: {
      id: process.env.DEMO_WORKSPACE_ID || "demo-workspace",
      name: "Apex Revenue Systems",
      settings: {
        create: {
          companyName: "Apex Revenue Systems",
          managerName: "Sarah Mitchell",
          replyTone: "professional",
          currency: "USD",
          language: "English"
        }
      },
      integrations: {
        create: [
          { provider: "telegram", status: "disabled" },
          { provider: "whatsapp", status: "disabled" },
          { provider: "openai", status: "disabled" },
          { provider: "stripe", status: "disabled" }
        ]
      }
    }
  });

  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const sarah = await prisma.user.upsert({
    where: { email: "sarah.mitchell@example.com" },
    update: { name: "Sarah Mitchell", password: demoPasswordHash },
    create: { name: "Sarah Mitchell", email: "sarah.mitchell@example.com", password: demoPasswordHash }
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex.morgan@example.com" },
    update: { name: "Alex Morgan", password: demoPasswordHash },
    create: { name: "Alex Morgan", email: "alex.morgan@example.com", password: demoPasswordHash }
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: sarah.id } },
    update: { role: "owner" },
    create: { workspaceId: workspace.id, userId: sarah.id, role: "owner" }
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: alex.id } },
    update: { role: "manager" },
    create: { workspaceId: workspace.id, userId: alex.id, role: "manager" }
  });

  const demoEmail = process.env.DEMO_USER_EMAIL;
  if (demoEmail && demoEmail !== sarah.email && demoEmail !== alex.email) {
    const demoUser = await prisma.user.upsert({
      where: { email: demoEmail },
      update: { password: demoPasswordHash },
      create: { name: demoEmail.split("@")[0], email: demoEmail, password: demoPasswordHash }
    });

    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: demoUser.id } },
      update: { role: "owner" },
      create: { workspaceId: workspace.id, userId: demoUser.id, role: "owner" }
    });
  }

  for (const lead of mockLeads) {
    const assignedUserId = lead.assignedManager === "Sarah Mitchell" ? sarah.id : alex.id;

    await prisma.lead.upsert({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: lead.id } },
      update: {
        assignedUserId,
        name: lead.name,
        company: lead.company,
        position: lead.position,
        email: lead.email,
        phone: lead.phone,
        source: sourceToDb(lead.source),
        status: statusToDb(lead.status),
        pipelineStage: stageToDb(lead.pipelineStage),
        interest: lead.interest,
        temperature: temperatureToDb(lead.temperature),
        purchaseProbability: lead.purchaseProbability,
        dealValue: lead.dealValue,
        lastMessage: lead.lastMessage,
        lastContactDate: new Date(`${lead.lastContactDate}T09:00:00.000Z`)
      },
      create: {
        slug: lead.id,
        workspaceId: workspace.id,
        assignedUserId,
        name: lead.name,
        company: lead.company,
        position: lead.position,
        email: lead.email,
        phone: lead.phone,
        source: sourceToDb(lead.source),
        status: statusToDb(lead.status),
        pipelineStage: stageToDb(lead.pipelineStage),
        interest: lead.interest,
        temperature: temperatureToDb(lead.temperature),
        purchaseProbability: lead.purchaseProbability,
        dealValue: lead.dealValue,
        lastMessage: lead.lastMessage,
        lastContactDate: new Date(`${lead.lastContactDate}T09:00:00.000Z`),
        messages: {
          create: lead.messageHistory.map((message, index) => ({
            author: message.author,
            sentAt: new Date(`2026-05-30T09:${String(20 + index * 7).padStart(2, "0")}:00.000Z`),
            type: messageTypeToDb(message.type),
            text: message.text
          }))
        },
        tasks: {
          create: lead.tasks.map((task) => ({
            label: task.label,
            completed: task.completed,
            completedAt: task.completed ? new Date("2026-05-30T14:00:00.000Z") : null
          }))
        },
        notes: {
          create: lead.notes.map((note) => ({
            authorId: assignedUserId,
            text: note.text,
            createdAt: new Date("2026-05-30T10:15:00.000Z")
          }))
        },
        analysis: {
          create: {
            customerType: lead.aiAnalysis.customerType,
            intent: lead.aiAnalysis.intent,
            interestLevel: lead.aiAnalysis.interestLevel,
            urgency: lead.aiAnalysis.urgency,
            budgetReadiness: lead.aiAnalysis.budgetReadiness,
            mainNeed: lead.aiAnalysis.mainNeed,
            painPoint: lead.aiAnalysis.painPoint,
            objection: lead.aiAnalysis.objection,
            lossRisk: lead.aiAnalysis.lossRisk,
            recommendedStage: stageToDb(lead.aiAnalysis.recommendedStage),
            nextBestAction: lead.aiAnalysis.nextBestAction,
            confidence: lead.aiAnalysis.confidence,
            summary: lead.aiAnalysis.summary,
            reply: lead.aiAnalysis.reply,
            replyShort: lead.aiAnalysis.replyOptions?.short ?? "",
            replyProfessional: lead.aiAnalysis.replyOptions?.professional ?? "",
            replySales: lead.aiAnalysis.replyOptions?.sales ?? "",
            replyClosing: lead.aiAnalysis.replyOptions?.closing ?? ""
          }
        }
      }
    });
  }

  console.log(`Seeded workspace ${workspace.id} with ${mockLeads.length} leads.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
