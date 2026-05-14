import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { AgentCards } from "@/components/AgentCards";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface HomePageProps {}

export const metadata: Metadata = {
  title: "Sarowth | Bütçeni Koru, Fikrini Test Et",
  description: "Sarowth, harcamalarını takip etmeni, birikimini korumanı ve e-ticaret fikirlerini gerçek para harcamadan önce doğrulamanı sağlar.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage({}: HomePageProps) {
  let userName: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", data.user.id).single();
      userName = profile?.full_name?.split(" ")[0] ?? profile?.email ?? data.user.email ?? "Profil";
    }
  } catch {
    userName = null;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <Navbar userName={userName} />
      <Hero />
      <AgentCards />
      <CycleSection />
      <AuthPreview />
      <Footer />
    </main>
  );
}

interface CycleStep {
  label: string;
  value: string;
  detail: string;
}

const cycleSteps: CycleStep[] = [
  { label: "Temizle", value: "01", detail: "Gelirini, giderini ve tekrar eden para kaçaklarını karmaşık bir finans ekranına boğulmadan kaydet." },
  { label: "Ayır", value: "02", detail: "Bütçen gerçekten uygunsa küçük bir tutarı test sermayesi olarak kenara koy." },
  { label: "Doğrula", value: "03", detail: "Stok almadan veya reklama çıkmadan önce ürün fikirlerini karşılaştır." },
  { label: "Değerlendir", value: "04", detail: "Her sonucu bir sonraki döngüyü daha küçük, güvenli ve net hale getirmek için kullan." },
];

function CycleSection() {
  return (
    <section id="cycles" className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Çalışma döngüsü</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Bütçeden işe geçmenin daha sakin yolu.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {cycleSteps.map((step) => (
            <div key={step.label} className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <span className="font-mono text-sm text-emerald-300">{step.value}</span>
              <h3 className="mt-8 text-2xl font-semibold text-white">{step.label}</h3>
              <p className="mt-3 leading-7 text-slate-400">{step.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthPreview() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(16,185,129,0.08)] backdrop-blur-xl">
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">E-posta doğrulama</p>
        <h2 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-white">E-posta ile çalışma alanını oluştur</h2>
        <form action="/signup" className="mt-5 grid gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-slate-400">
            <Mail size={17} /> Önce doğrulama kodu gönderiyoruz
          </div>
          <button type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01]">
            E-posta ile hesap oluştur
          </button>
        </form>
      </div>
    </section>
  );
}
