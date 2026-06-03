import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function requireSmtpEnv() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"] as const;
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing SMTP environment variables: ${missing.join(", ")}`);
  }
}

export function createEmailTransport() {
  requireSmtpEnv();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const transport = createEmailTransport();

  return transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendEmail({
    to,
    subject: "Reset your AI Sales Copilot password",
    text: [
      "We received a request to reset your AI Sales Copilot password.",
      "",
      `Open this link to choose a new password: ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">Reset your password</h2>
        <p>We received a request to reset your AI Sales Copilot password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #06b6d4; color: #020617; padding: 10px 16px; border-radius: 8px; font-weight: 700; text-decoration: none;">
            Choose a new password
          </a>
        </p>
        <p style="font-size: 13px; color: #475569;">If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}

export async function verifyEmailTransport() {
  const transport = createEmailTransport();
  await transport.verify();
}
