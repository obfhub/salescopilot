import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard title="Choose a new password" subtitle="Enter a new password for your account.">
      <ResetPasswordForm token={token ?? ""} />
    </AuthCard>
  );
}
