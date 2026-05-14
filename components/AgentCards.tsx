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
    title: "Koruyucu",
    subtitle: "Harcama netliği",
    description: "Bütçendeki sessiz kaçakları bulur ve hangi kesintilerin gerçekten işe yarar test sermayesi oluşturduğunu gösterir.",
    icon: <ShieldCheck size={28} />,
    tone: "emerald",
    signals: [
      { label: "İsraf azaldı", value: "-22%", icon: <Utensils size={16} /> },
      { label: "Ayrılan sermaye", value: "$184", icon: <WalletCards size={16} /> },
      { label: "Takip maddesi", value: "3", icon: <Zap size={16} /> },
    ],
  },
  {
    title: "Avcı",
    subtitle: "Ürün doğrulama",
    description: "Ürün fikirlerini talep, marj, hedef kitle uyumu ve lansman riskiyle karşılaştırarak net bir kısa listeye dönüştürür.",
    icon: <Target size={28} />,
    tone: "blue",
    signals: [
      { label: "Takip edilen ürün", value: "14", icon: <Bot size={16} /> },
      { label: "En iyi marj", value: "41%", icon: <WalletCards size={16} /> },
      { label: "Lansman skoru", value: "92", icon: <Zap size={16} /> },
    ],
  },
];

export function AgentCards({ className }: AgentCardsProps) {
  return (
    <section id="agents" className={cn("mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28", className)}>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Nasıl çalışır</p>
        <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Önce paranı koru. Sonra ürünü test et.</h2>
        <p className="mt-5 text-lg leading-8 text-slate-300">Sarowth tek bir pratik döngü üzerine kurulu: bütçeni anla, küçük bir tutar ayır, ürün fikrini test et ve sonucu değerlendir.</p>
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
