"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, Bot, Sparkles, TrendingUp } from "lucide-react";

interface HeroProps {
  headline?: string;
  subtext?: string;
}

const trends = [
  "Portable Blender - Demand: +450%",
  "AI Study Lamp - Margin: 38%",
  "Desk Treadmill - Trend velocity: 7.8x",
  "Cold Brew Kit - Social lift: +212%",
  "Smart Pet Feeder - CPC drop: -19%",
  "Pocket Projector - Supplier spread: 24%",
];

export function Hero({
  headline = "Don't Just Save. Scale.",
  subtext = "Turn disciplined savings into ecommerce opportunity cycles with autonomous agents that detect waste, capture margin, and compound micro-venture capital.",
}: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
      <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute right-0 top-28 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.13),transparent_26%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_28%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
            <Sparkles size={16} /> Autonomous wealth-cycle engine
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-white sm:text-7xl lg:text-8xl">
            <span className="bg-gradient-to-r from-white via-emerald-200 to-blue-300 bg-clip-text text-transparent">{headline}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">{subtext}</p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 px-7 py-4 font-semibold text-[#03110c] shadow-[0_0_36px_rgba(16,185,129,0.24)] transition hover:scale-[1.02]">
              Launch Your Agent
              <ArrowRight className="transition group-hover:translate-x-1" size={18} />
            </a>
            <a href="#tracker" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:bg-white/10">
              Watch live arbitrage
            </a>
          </div>
        </motion.div>

        <motion.div id="dashboard" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.12 }} className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-400/20 to-blue-500/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-sm text-slate-400">Cycle capital</p>
                <p className="text-3xl font-semibold text-white">$4,280</p>
              </div>
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Live</div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <MetricCard icon={<Activity size={18} />} label="Waste reduced" value="18.4%" tone="emerald" />
              <MetricCard icon={<TrendingUp size={18} />} label="Margin found" value="$742" tone="blue" />
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-4">
              <div className="mb-4 flex items-center gap-3">
                <Bot className="text-emerald-300" size={20} />
                <p className="font-medium text-white">Agent cycle</p>
              </div>
              {[
                ["Saved from grocery drift", "$84"],
                ["Supplier spread identified", "31%"],
                ["Pilot ad budget queued", "$120"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-t border-white/10 py-3 text-sm">
                  <span className="text-slate-300">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div id="tracker" className="relative mx-auto mt-16 max-w-7xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] py-4 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#050505] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#050505] to-transparent" />
        <div className="flex w-max animate-marquee gap-4 px-4">
          {[...trends, ...trends].map((trend, index) => (
            <span key={`${trend}-${index}`} className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-2 text-sm text-emerald-100">
              {trend}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "blue";
}

function MetricCard({ icon, label, value, tone }: MetricCardProps) {
  const toneClass = tone === "emerald" ? "text-emerald-200 bg-emerald-400/10 border-emerald-400/20" : "text-blue-200 bg-blue-400/10 border-blue-400/20";

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`}>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">{icon}</div>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
