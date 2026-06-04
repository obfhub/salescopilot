import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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

  console.log(`Seeded workspace ${workspace.id} with users and settings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
