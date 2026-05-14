import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyCodeForm } from "@/app/auth/VerifyCodeForm";

interface VerifyPageProps {
  searchParams: Promise<{ email?: string }>;
}

export const metadata: Metadata = {
  title: "E-posta Doğrula",
  description: "Gelen kutuna gönderilen kodla Sarowth hesabını doğrula.",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;

  if (!params.email) {
    redirect("/signup");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.13),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <VerifyCodeForm email={params.email} />
      </div>
    </main>
  );
}
