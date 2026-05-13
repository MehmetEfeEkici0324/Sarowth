import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyCodeForm } from "@/app/auth/VerifyCodeForm";

interface VerifyPageProps {
  searchParams: Promise<{ email?: string; flow?: string }>;
}

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Sarowth account with the email code sent to your inbox.",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const email = params.email;
  const flow = params.flow === "login" ? "login" : "signup";

  if (!email) {
    redirect(flow === "login" ? "/login" : "/signup");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.13),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <VerifyCodeForm email={email} flow={flow} />
      </div>
    </main>
  );
}
