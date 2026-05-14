import type { Metadata } from "next";
import { ArrowUpRight, BadgeDollarSign, Landmark, Mail, Newspaper, Radar, ShoppingBag, TrendingUp } from "lucide-react";
import { AgentCards } from "@/components/AgentCards";
import { AssistantChat } from "@/components/AssistantChat";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { StatCard } from "@/components/StatCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface HomePageProps {}

interface AuthenticatedHomeProps {
  userName: string;
  profile: { full_name?: string | null; savings_goal?: number | string | null } | null;
  budgetEntries: Array<{ amount: number | string; entry_type: string; category: string }>;
  ideas: Array<{ product_name: string; demand_score: number; estimated_margin: number | string; status: string }>;
}

const marketSignals = [
  { name: "Katlanabilir seyahat çantası", signal: "Kısa video içeriklerinde tekrar eden talep", score: 87, source: "Trend Agent" },
  { name: "Mini masa süpürgesi", signal: "Ev/ofis düzeni içeriklerinde yükseliyor", score: 81, source: "Piyasa Agent" },
  { name: "Soğuk kahve başlangıç seti", signal: "Sezon öncesi arama hacmi güçleniyor", score: 76, source: "Ürün Agent" },
];

const financeNews = [
  { title: "E-ticarette mikro stok yönetimi daha kritik hale geliyor", source: "Finans Haber Agent", href: "https://www.google.com/search?q=e-ticaret+stok+y%C3%B6netimi+haber" },
  { title: "KOBİ'ler için dijital ödeme maliyetleri yakından izleniyor", source: "Piyasa Haber Agent", href: "https://www.google.com/search?q=KOB%C4%B0+dijital+%C3%B6deme+maliyetleri" },
  { title: "Tüketici ilgisi düşük fiyatlı pratik ürünlere kayıyor", source: "Trend Haber Agent", href: "https://www.google.com/search?q=t%C3%BCketici+trendleri+pratik+%C3%BCr%C3%BCnler" },
];

const investmentIdeas = [
  "Acil durum payını ayır, kalan küçük tutarı ürün testi bütçesine dönüştür.",
  "Stok almadan önce tek ürün için reklam kreatifi ve talep testi yap.",
  "Kazancın tamamını büyütmeye değil, bir kısmını güvenli bütçeye geri aktar.",
];

const statusLabels: Record<string, string> = {
  research: "Araştırma",
  testing: "Test",
  launched: "Yayında",
  paused: "Duraklatıldı",
};

export const metadata: Metadata = {
  title: "Sarowth | Bütçeni Koru, Fikrini Test Et",
  description: "Sarowth, harcamalarını takip etmeni, birikimini korumanı ve e-ticaret fikirlerini gerçek para harcamadan önce doğrulamanı sağlar.",
  alternates: {
    canonical: "/",
  },
};

export default async function HomePage({}: HomePageProps) {
  let userName: string | null = null;
  let authenticatedHome: AuthenticatedHomeProps | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("full_name, email, savings_goal").eq("id", data.user.id).single();
      const [{ data: budgetEntries }, { data: ideas }] = await Promise.all([
        supabase.from("budget_entries").select("amount, entry_type, category").eq("user_id", data.user.id),
        supabase.from("ecommerce_ideas").select("product_name, demand_score, estimated_margin, status").eq("user_id", data.user.id).order("created_at", { ascending: false }).limit(4),
      ]);
      const resolvedUserName = profile?.full_name?.split(" ")[0] ?? profile?.email ?? data.user.email ?? "Profil";
      userName = resolvedUserName;
      authenticatedHome = {
        userName: resolvedUserName,
        profile,
        budgetEntries: budgetEntries ?? [],
        ideas: ideas ?? [],
      };
    }
  } catch {
    userName = null;
  }

  if (authenticatedHome) {
    return <AuthenticatedHome {...authenticatedHome} />;
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

function AuthenticatedHome({ userName, profile, budgetEntries, ideas }: AuthenticatedHomeProps) {
  const income = budgetEntries.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = budgetEntries.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const savings = budgetEntries.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const cycleCapital = Math.max(0, income - expenses + savings);
  const expenseByCategory = Object.entries(
    budgetEntries.filter((entry) => entry.entry_type === "expense").reduce<Record<string, number>>((groups, entry) => {
      groups[entry.category] = (groups[entry.category] ?? 0) + Number(entry.amount);
      return groups;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const topExpense = expenseByCategory[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <Navbar userName={userName} />
      <section className="relative px-5 py-10 sm:px-8 lg:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.16),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.14),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Kişisel Ana Sayfa</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Hoş geldin, {profile?.full_name?.split(" ")[0] ?? userName}.</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Agent altyapısı burada çalışır: piyasa sinyalleri, finans haberleri, banka/bütçe analizi, ürün kazancı ve Gemini asistan tek ekranda birleşir.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href="/budget" className="rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-6 py-3 text-center font-semibold text-[#03110c]">Bütçemi Güncelle</a>
                <a href="/ecommerce" className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-center font-semibold text-white transition hover:bg-white/10">Ürün Fikri Ekle</a>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard label="Döngü sermayesi" value={`$${cycleCapital.toLocaleString()}`} detail="Bütçe kayıtlarına göre kullanılabilir tutar." />
              <StatCard label="Aylık hedef" value={`$${Number(profile?.savings_goal ?? 500).toLocaleString()}`} detail="Profilindeki güncel birikim hedefi." />
              <StatCard label="En yüksek harcama" value={topExpense ? topExpense[0] : "Yok"} detail={topExpense ? `$${topExpense[1].toLocaleString()} harcama görünüyor.` : "Bütçe verisi bekleniyor."} />
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AgentMarketSection />
            <AgentNewsSection />
          </div>

          <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <Landmark className="text-emerald-300" size={22} />
                  <h2 className="text-3xl font-semibold tracking-[-0.04em]">Banka ve harcama görünümü</h2>
                </div>
                <p className="mt-3 max-w-3xl leading-7 text-slate-400">Banka agent bağlandığında gelir, gider ve kategori dağılımı otomatik güncellenecek. Şimdilik Bütçem sayfasındaki kayıtlarınla görselleştiriliyor.</p>
              </div>
              <a href="/budget" className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">Bütçeye Git</a>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <StatCard label="Toplam gelir" value={`$${income.toLocaleString()}`} detail="Kaydedilen gelir toplamı." />
              <StatCard label="Toplam gider" value={`$${expenses.toLocaleString()}`} detail="Kaydedilen gider toplamı." />
              <StatCard label="Toplam birikim" value={`$${savings.toLocaleString()}`} detail="Ayrılmış birikim toplamı." />
            </div>
            <div className="mt-6 grid gap-3">
              {expenseByCategory.length > 0 ? expenseByCategory.slice(0, 5).map(([category, amount]) => {
                const percent = expenses > 0 ? Math.round((amount / expenses) * 100) : 0;
                return <CategoryBar key={category} category={category} amount={amount} percent={percent} />;
              }) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 text-slate-400">Kategori grafiği için Bütçem sayfasından birkaç gider ekle.</p>}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <InvestmentSection />
            <CommerceReturnsSection ideas={ideas} />
          </div>

          <div className="mt-6">
            <AssistantChat />
          </div>
        </div>
      </section>
    </main>
  );
}

function AgentMarketSection() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
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
            <p className="mt-3 text-xs text-slate-500">Kaynak: {item.source}. Daha sonra sosyal medya ve pazar yeri agent verisiyle beslenecek.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentNewsSection() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
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
              <ArrowUpRight className="shrink-0 text-slate-500 transition group-hover:text-blue-300" size={18} />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function CategoryBar({ category, amount, percent }: { category: string; amount: number; percent: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-300">{category}</span>
        <span className="font-mono text-white">${amount.toLocaleString()} · %{percent}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function InvestmentSection() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
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
  );
}

function CommerceReturnsSection({ ideas }: { ideas: AuthenticatedHomeProps["ideas"] }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <ShoppingBag className="text-blue-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Ticari ürünler ve kazanç</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {ideas.length > 0 ? ideas.map((idea) => (
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
