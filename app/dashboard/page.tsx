import type { Metadata } from "next";
import { ArrowUpRight, BadgeDollarSign, Landmark, Newspaper, Radar, ShoppingBag, TrendingUp } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";
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

const marketSignals = [
  { name: "Katlanabilir seyahat çantası", signal: "TikTok aramaları yükseliyor", score: 87, source: "Trend Agent" },
  { name: "Mini masa süpürgesi", signal: "Ev/ofis içeriklerinde tekrar ediyor", score: 81, source: "Piyasa Agent" },
  { name: "Soğuk kahve başlangıç seti", signal: "Sezon öncesi talep sinyali", score: 76, source: "Ürün Agent" },
];

const financeNews = [
  { title: "E-ticarette mikro stok yönetimi daha kritik hale geliyor", source: "Finans Haber Agent", href: "https://www.google.com/search?q=e-ticaret+stok+y%C3%B6netimi+haber" },
  { title: "KOBİ'ler için dijital ödeme maliyetleri yakından izleniyor", source: "Piyasa Haber Agent", href: "https://www.google.com/search?q=KOB%C4%B0+dijital+%C3%B6deme+maliyetleri" },
  { title: "Tüketici ilgisi düşük fiyatlı pratik ürünlere kayıyor", source: "Trend Haber Agent", href: "https://www.google.com/search?q=t%C3%BCketici+trendleri+pratik+%C3%BCr%C3%BCnler" },
];

const investmentIdeas = [
  "Önce acil durum payını koru, kalan küçük tutarı ürün testi bütçesi olarak ayır.",
  "Stok almadan önce tek ürün için reklam kreatifi ve talep testi yap.",
  "Kazanç geldikçe tamamını büyütmeye değil, bir kısmını tekrar güvenli bütçeye aktar.",
];

export const metadata: Metadata = {
  title: "Panel",
  description: "Döngü sermayeni, bütçe sinyallerini ve e-ticaret fikirlerini takip ettiğin özel Sarowth paneli.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({}: DashboardPageProps) {
  const { supabase, user, profile } = await getWorkspace();
  const { data: budgetEntries } = await supabase.from("budget_entries").select("amount, entry_type, category").eq("user_id", user.id);
  const { data: ideas } = await supabase.from("ecommerce_ideas").select("product_name, demand_score, estimated_margin, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4);

  const income = budgetEntries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = budgetEntries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = budgetEntries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const cycleCapital = Math.max(0, income - expenses + savings);
  const expenseByCategory = Object.entries(
    budgetEntries?.filter((entry) => entry.entry_type === "expense").reduce<Record<string, number>>((groups, entry) => {
      groups[entry.category] = (groups[entry.category] ?? 0) + Number(entry.amount);
      return groups;
    }, {}) ?? {},
  ).sort((a, b) => b[1] - a[1]);
  const topExpense = expenseByCategory[0];

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Radar className="text-emerald-300" size={22} />
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Piyasada yükselen ürünler</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {marketSignals.map((item) => (
              <div key={item.name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.signal}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{item.score}/100</span>
                </div>
                <p className="mt-3 text-xs text-slate-500">Kaynak: {item.source}. İleride sosyal medya ve pazar yeri agent verisiyle beslenecek.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Newspaper className="text-blue-300" size={22} />
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Finans ve e-ticaret haberleri</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {financeNews.map((news) => (
              <a key={news.title} href={news.href} target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-blue-400/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{news.title}</p>
                    <p className="mt-2 text-sm text-slate-500">{news.source}</p>
                  </div>
                  <ArrowUpRight className="text-slate-500 transition group-hover:text-blue-300" size={18} />
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Landmark className="text-emerald-300" size={22} />
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Banka ve harcama analizi</h2>
        </div>
        <p className="mt-3 max-w-3xl leading-7 text-slate-400">Banka bağlantısı eklendiğinde gelir, gider, kategori bazlı harcama ve en çok para çıkan alanlar burada otomatik görselleştirilecek. Şimdilik bütçe kayıtların üzerinden hesaplanıyor.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard label="Toplam gelir" value={`$${income.toLocaleString()}`} detail="Banka agent bağlandığında otomatik güncellenecek." />
          <StatCard label="Toplam gider" value={`$${expenses.toLocaleString()}`} detail="Kayıtlı harcamaların toplamı." />
          <StatCard label="En yüksek kategori" value={topExpense ? topExpense[0] : "Yok"} detail={topExpense ? `$${topExpense[1].toLocaleString()} harcama görünüyor.` : "Harcama verisi bekleniyor."} />
        </div>
        <div className="mt-5 grid gap-3">
          {expenseByCategory.length > 0 ? expenseByCategory.slice(0, 5).map(([category, amount]) => {
            const percent = expenses > 0 ? Math.round((amount / expenses) * 100) : 0;
            return (
              <div key={category} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{category}</span>
                  <span className="font-mono text-white">%{percent}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          }) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-slate-400">Kategori analizi için Bütçem sayfasından birkaç gider ekle.</p>}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <BadgeDollarSign className="text-emerald-300" size={22} />
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Tasarrufla ne yapılabilir?</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {investmentIdeas.map((idea) => (
              <div key={idea} className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-300">{idea}</div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <ShoppingBag className="text-blue-300" size={22} />
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">Ticari ürünler ve kazanç</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {ideas && ideas.length > 0 ? ideas.map((idea) => (
              <div key={idea.product_name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{idea.product_name}</p>
                  <TrendingUp className="text-emerald-300" size={18} />
                </div>
                <p className="mt-2 text-sm text-slate-400">Tahmini marj: %{Number(idea.estimated_margin)} · Durum: {statusLabels[idea.status] ?? idea.status}</p>
                <p className="mt-2 text-xs text-slate-500">Satış ve kâr kayıtları eklendiğinde gerçek kazanç burada gösterilecek.</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">E-Ticaret sayfasında ürün eklediğinde burada potansiyel ve gerçek kazanç alanları oluşacak.</p>}
          </div>
        </section>
      </div>

      <div className="mt-6">
        <AssistantChat />
      </div>
    </AppShell>
  );
}
