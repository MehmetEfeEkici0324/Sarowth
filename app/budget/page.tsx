import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { FormSubmit } from "@/components/FormSubmit";
import { StatCard } from "@/components/StatCard";
import { addBudgetEntry } from "@/app/workspace/actions";
import { getWorkspace } from "@/lib/auth";

interface BudgetPageProps {}

const entryTypeLabels: Record<string, string> = {
  income: "Gelir",
  expense: "Gider",
  saving: "Birikim",
};

export const metadata: Metadata = {
  title: "Bütçem",
  description: "Banka agent ile çekilecek gelir, gider ve harcama kategorilerini Sarowth içinde takip et.",
  robots: { index: false, follow: false },
};

export default async function BudgetPage({}: BudgetPageProps) {
  const { supabase, user } = await getWorkspace();
  const { data: entries } = await supabase.from("budget_entries").select("*").eq("user_id", user.id).order("occurred_on", { ascending: false }).limit(20);
  const income = entries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = entries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = entries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;

  return (
    <AppShell title="Bütçem" subtitle="Bu alan banka agent için hazırlanmış bütçe görünümüdür. Agent bağlandığında gelir, gider, yemek, ulaşım, fatura, borç ve ihtiyaç harcamaların otomatik dolacak.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Agent gelir toplamı" value={`₺${income.toLocaleString()}`} detail="Banka bağlantısı aktif olduğunda otomatik güncellenecek." />
        <StatCard label="Agent gider toplamı" value={`₺${expenses.toLocaleString()}`} detail="Kart ve hesap hareketlerinden okunacak." />
        <StatCard label="Tespit edilen tasarruf" value={`₺${savings.toLocaleString()}`} detail="Önceki aya göre ayrılabilen tutar." />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action={addBudgetEntry} className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Agent bağlantısı gelene kadar test kaydı</h2>
          <input name="label" placeholder="Başlık" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input name="category" placeholder="Kategori" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input name="amount" type="number" min="0" step="0.01" placeholder="Tutar" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
          <select name="entryType" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10">
            <option value="expense">Gider</option>
            <option value="income">Gelir</option>
            <option value="saving">Birikim</option>
          </select>
          <FormSubmit idleLabel="Test kaydı ekle" />
        </form>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Agent verisi / test kayıtları</h2>
          <div className="mt-5 grid gap-3">
            {entries && entries.length > 0 ? entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div>
                  <p className="font-medium text-white">{entry.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.category} · {entryTypeLabels[entry.entry_type] ?? entry.entry_type}</p>
                </div>
                <p className="font-mono text-lg font-semibold">${Number(entry.amount).toLocaleString()}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Banka agent bağlandığında bu liste otomatik dolacak. Şimdilik istersen test verisi ekleyebilirsin.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
