import type { Metadata } from "next";
import { AuthForm } from "@/app/auth/AuthForm";

interface SignupPageProps {}

export const metadata: Metadata = {
  title: "Hesap Oluştur",
  description: "E-posta doğrulamasıyla Sarowth hesabını oluştur ve bütçeden işe giden çalışma alanını başlat.",
  robots: { index: false, follow: false },
};

export default function SignupPage({}: SignupPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.13),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_30%)]" />
      <div className="relative w-full max-w-md">
        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
