import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { getWorkspace } from "@/lib/auth";

interface DashboardPageProps {}

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
    <AppShell title={`Hoş geldin${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`} subtitle="Panel, çalışma alanının kısa özetidir. Detaylı agent akışı artık giriş yaptıktan sonra ana sayfada gösterilir.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Döngü sermayesi" value={`₺${cycleCapital.toLocaleString("tr-TR")}`} detail="Gelir, gider ve birikim kayıtlarına göre hesaplanan kullanılabilir tutar." />
        <StatCard label="Aylık hedef" value={profile?.savings_goal && Number(profile.savings_goal) > 0 && Number(profile.savings_goal) !== 500 ? `₺${Number(profile.savings_goal).toLocaleString("tr-TR")}` : "Belirle"} detail="Profil sayfasından kendin belirleyebilirsin." />
        <StatCard label="Ürün fikri" value={`${ideas?.length ?? 0}`} detail="E-Ticaret sayfasında takip ettiğin son fikirler." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Panel durumu</h2>
          <p className="mt-4 leading-7 text-slate-400">Bu panel yalnızca kısa özet için tutulur. Agent akışı, haberler, banka analizi ve Gemini asistan giriş yaptıktan sonra ana sayfada gösterilir.</p>
          <a href="/" className="mt-5 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/15">Ana sayfaya dön</a>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Son ürün fikirleri</h2>
          <div className="mt-5 grid gap-3">
            {ideas && ideas.length > 0 ? ideas.map((idea) => (
              <div key={idea.product_name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="font-medium text-white">{idea.product_name}</p>
                <p className="mt-2 text-sm text-slate-400">Talep {idea.demand_score}/100 · Marj %{Number(idea.estimated_margin)}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Henüz agent tarafından getirilen ürün fikri yok. Piyasa agent bağlantısı aktif olduğunda burada özetlenecek.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
