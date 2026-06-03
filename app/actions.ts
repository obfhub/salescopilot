"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { databaseConfigured } from "@/lib/lead-store";
import { stageToDb } from "@/lib/db-mapping";
import { pipelineStages } from "@/lib/mock-data";
import { requireWorkspaceAccess } from "@/lib/auth";

const stageSchema = z.object({
  leadSlug: z.string().min(1),
  stage: z.enum(pipelineStages as [string, ...string[]])
});

const noteSchema = z.object({
  leadSlug: z.string().min(1),
  text: z.string().trim().min(1).max(2000)
});

const taskSchema = z.object({
  taskId: z.string().min(1),
  completed: z.boolean()
});

const settingsSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  managerName: z.string().trim().min(1).max(120),
  replyTone: z.enum(["friendly", "professional", "confident", "sales-focused"]),
  currency: z.string().trim().min(1).max(12),
  language: z.string().trim().min(1).max(40),
  telegramToken: z.string().max(300).optional(),
  supabaseUrl: z.string().max(300).optional(),
  claudeApiKey: z.string().max(300).optional()
});

export async function updateLeadStage(input: unknown) {
  const data = stageSchema.parse(input);
  if (!databaseConfigured()) return { persisted: false };

  const auth = await requireWorkspaceAccess("sales");
  const lead = await prisma.lead.findFirstOrThrow({
    where: { workspaceId: auth.workspaceId, slug: data.leadSlug }
  });

  const nextStage = stageToDb(data.stage as Parameters<typeof stageToDb>[0]);
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: lead.id },
      data: { pipelineStage: nextStage }
    }),
    prisma.pipelineEvent.create({
      data: {
        leadId: lead.id,
        userId: auth.userId,
        fromStage: lead.pipelineStage,
        toStage: nextStage
      }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath(`/leads/${data.leadSlug}`);
  return { persisted: true };
}

export async function addLeadNote(input: unknown) {
  const data = noteSchema.parse(input);
  if (!databaseConfigured()) return { persisted: false };

  const auth = await requireWorkspaceAccess("sales");
  const lead = await prisma.lead.findFirstOrThrow({
    where: { workspaceId: auth.workspaceId, slug: data.leadSlug }
  });

  await prisma.leadNote.create({
    data: {
      leadId: lead.id,
      authorId: auth.userId,
      text: data.text
    }
  });

  revalidatePath(`/leads/${data.leadSlug}`);
  return { persisted: true };
}

export async function updateTaskState(input: unknown) {
  const data = taskSchema.parse(input);
  if (!databaseConfigured()) return { persisted: false };

  const auth = await requireWorkspaceAccess("sales");

  const existingTask = await prisma.leadTask.findFirstOrThrow({
    where: { id: data.taskId, lead: { workspaceId: auth.workspaceId } },
    include: { lead: true }
  });

  const task = await prisma.leadTask.update({
    where: { id: existingTask.id },
    data: {
      completed: data.completed,
      completedAt: data.completed ? new Date() : null
    },
    include: { lead: true }
  });

  revalidatePath(`/leads/${task.lead.slug}`);
  return { persisted: true };
}

export async function saveWorkspaceSettings(input: unknown) {
  const data = settingsSchema.parse(input);
  if (!databaseConfigured()) return { persisted: false };

  const auth = await requireWorkspaceAccess("admin");

  await prisma.workspaceSetting.upsert({
    where: { workspaceId: auth.workspaceId },
    update: data,
    create: {
      workspaceId: auth.workspaceId,
      ...data
    }
  });

  revalidatePath("/settings");
  return { persisted: true };
}
