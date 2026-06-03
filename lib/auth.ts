import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

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

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) return null;

        return { id: user.id, name: user.name, email: user.email };
      }
    })
  ]
});

export function getRequestedWorkspaceId() {
  return process.env.DEMO_WORKSPACE_ID || "demo-workspace";
}

export async function getCurrentUser() {
  if (!process.env.DATABASE_URL) return null;

  const session = await auth();
  if (!session?.user?.email) return null;

  return prisma.user.findUnique({
    where: { email: session.user.email }
  });
}

export async function requireWorkspaceAccess(minRole: WorkspaceRole = "sales"): Promise<AuthContext> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured. Add a Postgres URL, run npm run db:push, then npm run db:seed.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated. Please sign in to continue.");
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
