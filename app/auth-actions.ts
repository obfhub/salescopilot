"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestedWorkspaceId } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const registerSchema = z.object({
  mode: z.enum(["create-company", "join-company"]).default("create-company"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  companyName: z.string().trim().max(120).optional().default(""),
  companyCode: z.string().trim().max(120).optional().default(""),
  role: z.string().trim().min(2, "Role must be at least 2 characters").max(120),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100)
});

const requestResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email")
});

const resetSchema = z.object({
  token: z.string().min(1, "Invalid reset link"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100)
});

type ActionResult = { ok: boolean; error?: string; message?: string };

function getBaseUrl() {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function registerUser(input: unknown): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: "Database is not configured." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { mode, name, companyName, companyCode, role, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return { ok: false, error: "An account with this email already exists." };
    }

    const hashed = await bcrypt.hash(password, 12);

    if (mode === "join-company") {
      if (!companyCode) {
        return { ok: false, error: "Enter the Company ID from your workspace administrator." };
      }

      const workspace = await prisma.workspace.findUnique({ where: { id: companyCode } });
      if (!workspace) {
        return { ok: false, error: "Company account not found. Check the Company ID and try again." };
      }

      await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashed,
          memberships: {
            create: {
              role: "sales",
              workspaceId: workspace.id
            }
          }
        }
      });

      return { ok: true, message: `Joined ${workspace.name}. You can now sign in.` };
    }

    const cleanCompanyName = companyName.trim();
    if (cleanCompanyName.length < 2) {
      return { ok: false, error: "Company name must be at least 2 characters." };
    }

    await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashed,
        memberships: {
          create: {
            role: "owner",
            workspace: {
              create: {
                name: cleanCompanyName,
                settings: {
                  create: {
                    companyName: cleanCompanyName,
                    managerName: name,
                    replyTone: "professional",
                    currency: "USD",
                    language: "English"
                  }
                },
                integrations: {
                  create: [
                    { provider: "telegram", status: "disabled" },
                    { provider: "whatsapp", status: "disabled" },
                    { provider: "openai", status: "disabled" }
                  ]
                }
              }
            }
          }
        }
      }
    });

    return { ok: true, message: "Account created. You can now sign in." };
  } catch (error) {
    console.error("registerUser failed.", error);
    return { ok: false, error: "Could not create account. Please try again." };
  }
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." };
  }

  const successMessage = "If an account exists for that email, a reset link is on its way.";

  if (!process.env.DATABASE_URL) {
    return { ok: true, message: successMessage };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { ok: true, message: successMessage };
    }

    await prisma.passwordResetToken.deleteMany({ where: { email } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({ data: { email, token, expires } });

    const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;
    await sendPasswordResetEmail(email, resetUrl);

    return { ok: true, message: successMessage };
  } catch (error) {
    console.error("requestPasswordReset failed.", error);
    return { ok: true, message: successMessage };
  }
}

export async function resetPassword(input: unknown): Promise<ActionResult> {
  if (!process.env.DATABASE_URL) {
    return { ok: false, error: "Database is not configured." };
  }

  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { token, password } = parsed.data;

  try {
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.expires < new Date()) {
      if (record) {
        await prisma.passwordResetToken.delete({ where: { token } }).catch(() => undefined);
      }
      return { ok: false, error: "This reset link is invalid or has expired." };
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashed }
    });

    await prisma.passwordResetToken.deleteMany({ where: { email: record.email } });

    return { ok: true, message: "Password updated. You can now sign in." };
  } catch (error) {
    console.error("resetPassword failed.", error);
    return { ok: false, error: "Could not reset password. Please try again." };
  }
}

export async function registerTelegramWebhook(botToken: string): Promise<ActionResult> {
  if (!process.env.DATABASE_URL || !process.env.AUTH_URL) {
    return { ok: false, error: "Configuration incomplete (missing AUTH_URL)." };
  }

  try {
    const auth = await import("@/lib/auth").then((m) => m.requireWorkspaceAccess("admin"));

    const webhookUrl = `${process.env.AUTH_URL}/api/telegram/webhook?workspaceId=${encodeURIComponent(auth.workspaceId)}`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] })
    });

    if (!response.ok) {
      const error = await response.json();
      return { ok: false, error: `Telegram error: ${error.description || "Unknown error"}` };
    }

    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: `Telegram API error: ${data.description}` };
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: auth.workspaceId } });
    if (!workspace) {
      return { ok: false, error: "Workspace not found." };
    }

    let settings = await prisma.workspaceSetting.findUnique({
      where: { workspaceId: auth.workspaceId }
    });

    if (settings) {
      settings = await prisma.workspaceSetting.update({
        where: { workspaceId: auth.workspaceId },
        data: { telegramToken: botToken }
      });
    } else {
      settings = await prisma.workspaceSetting.create({
        data: {
          workspaceId: auth.workspaceId,
          telegramToken: botToken,
          companyName: workspace.name,
          managerName: "Manager",
          replyTone: "professional",
          currency: "USD",
          language: "English"
        }
      });
    }

    await prisma.integration.upsert({
      where: { workspaceId_provider: { workspaceId: auth.workspaceId, provider: "telegram" } },
      update: { status: "connected", lastSyncAt: new Date() },
      create: { workspaceId: auth.workspaceId, provider: "telegram", status: "connected", lastSyncAt: new Date() }
    });

    return {
      ok: true,
      message: `Telegram bot registered. Webhook: ${webhookUrl}`
    };
  } catch (error) {
    console.error("registerTelegramWebhook failed.", error);
    return { ok: false, error: "Could not register Telegram webhook. Please try again." };
  }
}
