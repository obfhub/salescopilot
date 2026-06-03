import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const roleRank: Record<WorkspaceRole, number> = {
  sales: 1,
  manager: 2,
  admin: 3,
  owner: 4
};

export type AuthContext = {
  userId: string;
  email: string;
  workspaceId: string;
  role: WorkspaceRole;
};

export function getRequestedWorkspaceId() {
  return process.env.DEMO_WORKSPACE_ID || "demo-workspace";
}

export function getRequestedUserEmail() {
  return process.env.DEMO_USER_EMAIL || "sarah.mitchell@example.com";
}

export async function getCurrentUser() {
  if (!process.env.DATABASE_URL) return null;

  return prisma.user.findUnique({
    where: { email: getRequestedUserEmail() }
  });
}

export async function requireWorkspaceAccess(minRole: WorkspaceRole = "sales"): Promise<AuthContext> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Add a Postgres URL, run npm run db:push, then npm run db:seed.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error(`No user found for DEMO_USER_EMAIL=${getRequestedUserEmail()}. Seed the database or update .env.`);
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: getRequestedWorkspaceId(),
        userId: user.id
      }
    }
  });

  if (!membership) {
    throw new Error("Current user is not a member of this workspace.");
  }

  if (roleRank[membership.role] < roleRank[minRole]) {
    throw new Error(`Current role ${membership.role} cannot perform an action requiring ${minRole}.`);
  }

  return {
    userId: user.id,
    email: user.email,
    workspaceId: membership.workspaceId,
    role: membership.role
  };
}
