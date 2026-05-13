import { AppShell } from "@/components/AppShell";
import { FormSubmit } from "@/components/FormSubmit";
import { StatCard } from "@/components/StatCard";
import { addBudgetEntry } from "@/app/workspace/actions";
import { getWorkspace } from "@/lib/auth";

interface BudgetPageProps {}

export default async function BudgetPage({}: BudgetPageProps) {
  const { supabase, user } = await getWorkspace();
  const { data: entries } = await supabase.from("budget_entries").select("*").eq("user_id", user.id).order("occurred_on", { ascending: false }).limit(20);
  const income = entries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = entries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = entries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;

  return (
    <AppShell title="Budget" subtitle="A simple ledger for the money you can protect, redirect and eventually use for low-risk ecommerce tests.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Income logged" value={`$${income.toLocaleString()}`} detail="Cash added to this cycle." />
        <StatCard label="Expenses logged" value={`$${expenses.toLocaleString()}`} detail="Spending that reduces available capital." />
        <StatCard label="Savings logged" value={`$${savings.toLocaleString()}`} detail="Protected money ready for allocation." />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action={addBudgetEntry} className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Add entry</h2>
          <input name="label" placeholder="Label" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input name="category" placeholder="Category" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input name="amount" type="number" min="0" step="0.01" placeholder="Amount" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
          <select name="entryType" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="saving">Saving</option>
          </select>
          <FormSubmit idleLabel="Add to budget" />
        </form>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Recent entries</h2>
          <div className="mt-5 grid gap-3">
            {entries && entries.length > 0 ? entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <div>
                  <p className="font-medium text-white">{entry.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{entry.category} · {entry.entry_type}</p>
                </div>
                <p className="font-mono text-lg font-semibold">${Number(entry.amount).toLocaleString()}</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Start with one income item and one recurring expense. The page becomes useful immediately.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
