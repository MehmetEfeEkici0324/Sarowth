import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { getWorkspace } from "@/lib/auth";

interface DashboardPageProps {}

const statusLabels: Record<string, string> = {
  research: "Araştırma",
  testing: "Test",
  launched: "Yayında",
  paused: "Duraklatıldı",
};

export const metadata: Metadata = {
  title: "Panel",
  description: "Döngü sermayeni, bütçe sinyallerini ve e-ticaret fikirlerini takip ettiğin özel Sarowth paneli.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({}: DashboardPageProps) {
  const { supabase, user, profile } = await getWorkspace();
  const { data: budgetEntries } = await supabase.from("budget_entries").select("amount, entry_type").eq("user_id", user.id);
  const { data: ideas } = await supabase.from("ecommerce_ideas").select("product_name, demand_score, estimated_margin, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);

  const income = budgetEntries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = budgetEntries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = budgetEntries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const cycleCapital = Math.max(0, income - expenses + savings);

  return (
    <AppShell title={`Hoş geldin${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`} subtitle="Paranı, ürün fikirlerini ve büyüme döngündeki bir sonraki pratik adımı tek ekranda gör.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Döngü sermayesi" value={`$${cycleCapital.toLocaleString()}`} detail="Kaydettiğin gelir, gider ve birikimlerden sonra kullanılabilir tutar." />
        <StatCard label="Aylık hedef" value={`$${Number(profile?.savings_goal ?? 500).toLocaleString()}`} detail="Test sermayesine dönüşebilecek güncel birikim hedefin." />
        <StatCard label="Ürün hattı" value={`${ideas?.length ?? 0}`} detail="Doğrulama bekleyen takipli e-ticaret fırsatları." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Bugünün çalışma planı</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Genelde gözden kaçırdığın bir gideri kaydet.",
              "Küçük bir fazlayı döngü sermayesine ayır.",
              "Reklam harcamadan önce bir ürün fikrini puanla.",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-mono text-sm text-emerald-200">{index + 1}</span>
                <p className="leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Son fikirler</h2>
          <div className="mt-5 grid gap-3">
            {ideas && ideas.length > 0 ? ideas.map((idea) => (
              <div key={idea.product_name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{idea.product_name}</p>
                  <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs text-blue-200">{statusLabels[idea.status] ?? idea.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Talep {idea.demand_score}/100 · Marj {Number(idea.estimated_margin)}%</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Henüz fikir yok. İlk ürününü E-Ticaret sayfasından ekle.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
