import { Bot, ShieldCheck, Target, Utensils, WalletCards, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentCardsProps {
  className?: string;
}

interface AgentCardData {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  tone: "emerald" | "blue";
  signals: Array<{ label: string; value: string; icon: React.ReactNode }>;
}

const agents: AgentCardData[] = [
  {
    title: "The Guardian",
    subtitle: "Spending clarity",
    description: "Finds the quiet leaks in your budget and shows which cuts actually create useful test capital.",
    icon: <ShieldCheck size={28} />,
    tone: "emerald",
    signals: [
      { label: "Waste reduced", value: "-22%", icon: <Utensils size={16} /> },
      { label: "Capital freed", value: "$184", icon: <WalletCards size={16} /> },
      { label: "Watch items", value: "3", icon: <Zap size={16} /> },
    ],
  },
  {
    title: "The Hunter",
    subtitle: "Product validation",
    description: "Turns product hunches into a shortlist by comparing demand, margin, audience fit and launch risk.",
    icon: <Target size={28} />,
    tone: "blue",
    signals: [
      { label: "Tracked products", value: "14", icon: <Bot size={16} /> },
      { label: "Best margin", value: "41%", icon: <WalletCards size={16} /> },
      { label: "Launch score", value: "92", icon: <Zap size={16} /> },
    ],
  },
];

export function AgentCards({ className }: AgentCardsProps) {
  return (
    <section id="agents" className={cn("mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28", className)}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">How it works</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Protect cash first. Test products second.</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">The product is built around one practical loop: understand your budget, reserve a small amount, test a product idea, then review the result.</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {agents.map((agent) => (
          <article key={agent.title} className={cn("group relative overflow-hidden rounded-[2rem] border bg-white/[0.045] p-6 backdrop-blur-xl transition duration-300", agent.tone === "emerald" ? "border-emerald-400/20 hover:shadow-[0_0_45px_rgba(16,185,129,0.16)]" : "border-blue-400/20 hover:shadow-[0_0_45px_rgba(59,130,246,0.16)]")}>
            <div className={cn("absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl transition group-hover:opacity-100", agent.tone === "emerald" ? "bg-emerald-400/12" : "bg-blue-400/12")} />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn("text-sm font-medium", agent.tone === "emerald" ? "text-emerald-200" : "text-blue-200")}>{agent.subtitle}</p>
                  <h3 className="mt-2 text-3xl font-semibold text-white">{agent.title}</h3>
                </div>
                <div className={cn("grid h-14 w-14 place-items-center rounded-3xl border", agent.tone === "emerald" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-blue-400/30 bg-blue-400/10 text-blue-200")}>
                  {agent.icon}
                </div>
              </div>

              <p className="mt-5 min-h-24 text-base leading-8 text-slate-300">{agent.description}</p>

              <div className="mt-8 grid gap-3">
                {agent.signals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className="text-slate-100">{signal.icon}</span>
                      <span>{signal.label}</span>
                    </div>
                    <span className="font-mono text-lg font-semibold text-white">{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
