import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { BudgetEntryForm } from "@/components/BudgetEntryForm";
import { StatCard } from "@/components/StatCard";
import { getWorkspace } from "@/lib/auth";

interface BudgetPageProps {}

const entryTypeLabels: Record<string, string> = {
  income: "Gelir",
  expense: "Gider",
  saving: "Birikim",
};

export const metadata: Metadata = {
  title: "Bütçem",
  description: "Gelir, gider ve birikim kayıtlarını kategori bazlı takip et.",
  robots: { index: false, follow: false },
};

export default async function BudgetPage({}: BudgetPageProps) {
  const { supabase, user } = await getWorkspace();
  const { data: entries } = await supabase.from("budget_entries").select("*").eq("user_id", user.id).order("occurred_on", { ascending: false }).limit(20);
  const income = entries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = entries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = entries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;

  return (
    <AppShell title="Bütçem" subtitle="Banka verilerini şimdilik sen girersin. Chat asistanı satın alma kararlarını bu kişisel gelir, gider ve kategori kayıtlarına göre hesaplar.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Gelir toplamı" value={`₺${income.toLocaleString()}`} detail="Kendi eklediğin gelir kayıtları." />
        <StatCard label="Gider toplamı" value={`₺${expenses.toLocaleString()}`} detail="Kategori bazlı harcama toplamın." />
        <StatCard label="Birikim" value={`₺${savings.toLocaleString()}`} detail="Ayırdığın güvenli bütçe." />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <BudgetEntryForm />
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Kayıtların</h2>
          <div className="mt-5 grid gap-3">
            {entries && entries.length > 0 ? entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div>
                  <p className="font-medium text-white">{entry.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.category} · {entryTypeLabels[entry.entry_type] ?? entry.entry_type}</p>
                </div>
                <p className="font-mono text-lg font-semibold">₺{Number(entry.amount).toLocaleString()}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Henüz kayıt yok. Önce gelirini, sonra düzenli giderlerini ekle; chat asistanı kararlarını buna göre hesaplayacak.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
