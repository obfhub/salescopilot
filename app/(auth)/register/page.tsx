import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start guiding your pipeline with AI in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
