import type { Metadata } from "next";
import { AuthForm } from "@/app/auth/AuthForm";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export const metadata: Metadata = {
  title: "Giriş Yap",
  description: "Sarowth çalışma alanına e-posta ve şifrenle giriş yap.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.13),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <AuthForm mode="login" error={params.error} />
      </div>
    </main>
  );
}
