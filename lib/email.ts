import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.EMAIL_FROM || "AI Sales Copilot <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

function resetEmailHtml(resetUrl: string) {
  return `
  <div style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:12px;background:linear-gradient(to right,#3b82f6,#8b5cf6);color:#fff;font-size:24px;font-weight:800;">AI</div>
        <div style="color:#fafafa;font-size:20px;font-weight:700;margin-top:12px;">AI Sales Copilot</div>
      </div>
      <div style="background:#171717;border:1px solid #262626;border-radius:16px;padding:32px;">
        <h1 style="color:#fafafa;font-size:22px;font-weight:700;margin:0 0 12px;">Reset your password</h1>
        <p style="color:#a3a3a3;font-size:15px;line-height:24px;margin:0 0 24px;">
          We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:block;text-align:center;background:linear-gradient(to right,#3b82f6,#8b5cf6);color:#fff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;">
          Reset password
        </a>
        <p style="color:#737373;font-size:13px;line-height:20px;margin:24px 0 0;">
          If you did not request this, you can safely ignore this email. Your password will not change.
        </p>
      </div>
      <p style="color:#525252;font-size:12px;text-align:center;margin-top:24px;word-break:break-all;">
        Or paste this link into your browser:<br/>${resetUrl}
      </p>
    </div>
  </div>`;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set. Password reset link (dev mode):", resetUrl);
    return { delivered: false };
  }

  try {
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "Reset your AI Sales Copilot password",
      html: resetEmailHtml(resetUrl)
    });
    return { delivered: true };
  } catch (error) {
    console.error("Failed to send password reset email.", error);
    return { delivered: false };
  }
}
