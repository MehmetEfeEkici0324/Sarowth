import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { FormSubmit } from "@/components/FormSubmit";
import { addEcommerceIdea } from "@/app/workspace/actions";
import { getWorkspace } from "@/lib/auth";

interface EcommercePageProps {}

export const metadata: Metadata = {
  title: "Ecommerce Ideas",
  description: "Track product ideas, demand scores and margin assumptions inside your private Sarowth ecommerce workspace.",
  robots: { index: false, follow: false },
};

export default async function EcommercePage({}: EcommercePageProps) {
  const { supabase, user } = await getWorkspace();
  const { data: ideas } = await supabase.from("ecommerce_ideas").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <AppShell title="Ecommerce" subtitle="Capture product ideas before they become impulse purchases. Score demand, margin and audience fit in one place.">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <form action={addEcommerceIdea} className="grid gap-4 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Add product idea</h2>
          <input name="productName" placeholder="Product" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input name="audience" placeholder="Target audience" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="demandScore" type="number" min="0" max="100" defaultValue="50" placeholder="Demand score" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
            <input name="estimatedMargin" type="number" min="0" step="0.1" placeholder="Margin %" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
          </div>
          <textarea name="notes" placeholder="Supplier notes, hooks, risks" rows={4} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <FormSubmit idleLabel="Save idea" />
        </form>
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold">Product pipeline</h2>
          <div className="mt-5 grid gap-3">
            {ideas && ideas.length > 0 ? ideas.map((idea) => (
              <article key={idea.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">{idea.product_name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{idea.audience}</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{idea.status}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/[0.04] p-3 text-slate-300">Demand <span className="block text-lg font-semibold text-white">{idea.demand_score}/100</span></div>
                  <div className="rounded-2xl bg-white/[0.04] p-3 text-slate-300">Margin <span className="block text-lg font-semibold text-white">{Number(idea.estimated_margin)}%</span></div>
                </div>
                {idea.notes ? <p className="mt-4 text-sm leading-6 text-slate-500">{idea.notes}</p> : null}
              </article>
            )) : <p className="rounded-2xl border border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Add one product you have seen repeatedly. The goal is not to launch yet; it is to compare ideas calmly.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
