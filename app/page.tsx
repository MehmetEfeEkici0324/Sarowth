import { Github, Mail } from "lucide-react";
import { AgentCards } from "@/components/AgentCards";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";

interface HomePageProps {}

export default function HomePage({}: HomePageProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <Navbar />
      <Hero />
      <AgentCards />
      <CycleSection />
      <AuthPreview />
      <Footer />
    </main>
  );
}

interface CycleStep {
  label: string;
  value: string;
  detail: string;
}

const cycleSteps: CycleStep[] = [
  { label: "Save", value: "01", detail: "Guardian converts spending leaks into deployable capital." },
  { label: "Hunt", value: "02", detail: "Hunter scores demand, margin, suppliers, and launch timing." },
  { label: "Scale", value: "03", detail: "Capital flows into controlled ecommerce experiments." },
  { label: "Compound", value: "04", detail: "Profits return to the cycle with better data and tighter risk." },
];

function CycleSection() {
  return (
    <section id="cycles" className="px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.08),rgba(59,130,246,0.06),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">Financial Cycle Mechanics</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">Savings become micro-venture capital.</h2>
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
        <p className="text-center text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Unified Access</p>
        <h2 className="mt-3 text-center text-3xl font-semibold tracking-[-0.04em] text-white">Enter the Alpha</h2>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/10">
            <Mail size={17} /> Google
          </a>
          <a href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/10">
            <Github size={17} /> Github
          </a>
        </div>
        <form action="/signup" className="mt-5 grid gap-3">
          <input type="email" placeholder="Email" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10" />
          <input type="password" placeholder="Password" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/60 focus:ring-4 focus:ring-blue-400/10" />
          <button type="submit" className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-blue-500 px-5 py-3 font-semibold text-[#03110c] transition hover:scale-[1.01]">
            Start Scaling
          </button>
        </form>
      </div>
    </section>
  );
}
