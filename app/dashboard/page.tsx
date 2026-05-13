import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { getWorkspace } from "@/lib/auth";

interface DashboardPageProps {}

export default async function DashboardPage({}: DashboardPageProps) {
  const { supabase, user, profile } = await getWorkspace();
  const { data: budgetEntries } = await supabase.from("budget_entries").select("amount, entry_type").eq("user_id", user.id);
  const { data: ideas } = await supabase.from("ecommerce_ideas").select("product_name, demand_score, estimated_margin, status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3);

  const income = budgetEntries?.filter((entry) => entry.entry_type === "income").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const expenses = budgetEntries?.filter((entry) => entry.entry_type === "expense").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const savings = budgetEntries?.filter((entry) => entry.entry_type === "saving").reduce((sum, entry) => sum + Number(entry.amount), 0) ?? 0;
  const cycleCapital = Math.max(0, income - expenses + savings);

  return (
    <AppShell title={`Good to see you${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.`} subtitle="A focused view of your money, product ideas and the next practical step in your growth cycle.">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Cycle capital" value={`$${cycleCapital.toLocaleString()}`} detail="Money available after logged income, expenses and savings." />
        <StatCard label="Monthly goal" value={`$${Number(profile?.savings_goal ?? 500).toLocaleString()}`} detail="Your current target for savings that can become test capital." />
        <StatCard label="Product pipeline" value={`${ideas?.length ?? 0}`} detail="Tracked ecommerce opportunities waiting for validation." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Today&apos;s operating plan</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Log one expense you usually ignore.",
              "Move a small surplus into cycle capital.",
              "Score one product idea before spending on ads.",
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-400/10 font-mono text-sm text-emerald-200">{index + 1}</span>
                <p className="leading-7 text-slate-300">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Latest ideas</h2>
          <div className="mt-5 grid gap-3">
            {ideas && ideas.length > 0 ? ideas.map((idea) => (
              <div key={idea.product_name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{idea.product_name}</p>
                  <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs text-blue-200">{idea.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">Demand {idea.demand_score}/100 · Margin {Number(idea.estimated_margin)}%</p>
              </div>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">No ideas yet. Add your first product on the Ecommerce page.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
