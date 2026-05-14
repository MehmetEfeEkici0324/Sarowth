import type { Metadata } from "next";

interface CheckEmailPageProps {}

export const metadata: Metadata = {
  title: "E-postanı Kontrol Et",
  description: "Sarowth kaydını tamamlamak için e-postana gönderdiğimiz doğrulama linkine tıkla.",
  robots: { index: false, follow: false },
};

export default function CheckEmailPage({}: CheckEmailPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-5 py-12 text-white">
      <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Doğrula</p>
        <h1 className="mt-3 text-3xl font-semibold">E-postanı kontrol et</h1>
        <p className="mt-4 leading-7 text-slate-400">E-postana bir doğrulama linki gönderdik. Linke tıklayarak kaydını tamamlayabilirsin.</p>
        <a href="/login" className="mt-7 inline-flex rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3 font-semibold text-[#03110c]">Giriş yap</a>
      </div>
    </main>
  );
}
