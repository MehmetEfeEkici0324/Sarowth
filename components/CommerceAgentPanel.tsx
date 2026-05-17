"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

interface Idea {
  product_name: string;
  demand_score: number;
  estimated_margin: number | string;
  status: string;
}

interface MarketSignal {
  name: string;
  signal: string;
  score: number;
  source: string;
}

interface DashboardEventData {
  activeTopic?: string | null;
  activeCommand?: string | null;
  trendUrunler?: Array<{ title: string; description: string; score: string; source: string }>;
  finansHaberleri?: Array<{ title: string; source: string; url: string; bundleSummary?: string }>;
  tedarikLinkleri?: Array<{ title: string; url: string; source: string; price?: string | null; score: number }>;
}

const statusLabels: Record<string, string> = {
  research: "Araştırma",
  testing: "Test",
  launched: "Yayında",
  paused: "Duraklatıldı",
};

export function CommerceAgentPanel({ ideas, marketSignals, availableCapital }: { ideas: Idea[]; marketSignals: MarketSignal[]; availableCapital: number }) {
  const [liveData, setLiveData] = useState<DashboardEventData | null>(null);

  useEffect(() => {
    function handle(event: Event) {
      const detail = (event as CustomEvent<DashboardEventData>).detail;
      if (detail?.activeCommand === "takip" || detail?.activeCommand === "haber") {
        setLiveData(detail);
      }
    }

    window.addEventListener("sarowth:agent-dashboard", handle);
    return () => window.removeEventListener("sarowth:agent-dashboard", handle);
  }, []);

  const liveTrend = liveData?.trendUrunler?.[0];
  const liveNews = liveData?.finansHaberleri?.slice(0, 2) ?? [];
  const liveLinks = liveData?.tedarikLinkleri?.slice(0, 3) ?? [];
  const action = availableCapital > 0 ? "Düşük bütçeli talep testi aç" : "Önce bütçe açığını kapat";
  const staticCandidates = ideas.length > 0 ? ideas.map((idea) => ({
    name: idea.product_name,
    score: idea.demand_score,
    detail: `Tahmini marj: %${Number(idea.estimated_margin)} · Durum: ${statusLabels[idea.status] ?? idea.status}`,
    source: "E-Ticaret fikri",
  })) : marketSignals.slice(0, 4).map((signal) => ({
    name: signal.name,
    score: signal.score,
    detail: signal.signal,
    source: signal.source,
  }));

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <ShoppingBag className="text-blue-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Ticari agent fırsat panosu</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">Ürün aradığında bu panel anında canlı SerpAPI trendi, haber sinyali ve tedarik kartlarını bir fırsat paketine çevirir.</p>

      {liveData ? (
        <div className="mt-5 grid gap-3">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">Canlı ürün paketi</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-white">{liveData.activeTopic ?? liveTrend?.title ?? "Son ürün"}</h3>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-sm font-semibold text-emerald-100">{liveTrend?.score ?? "Canlı"}</span>
            </div>
            <p className="mt-3 leading-7 text-slate-300">{liveTrend?.description ?? "Agent bu ürün için canlı tedarik ve haber sinyallerini topladı."}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm text-emerald-50">Agent aksiyonu: {action}</div>
          </div>

          {liveNews.length > 0 ? (
            <div className="grid gap-2">
              {liveNews.map((item) => (
                <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-blue-300/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-blue-200/70">{item.source}</p>
                      <p className="mt-1 break-words font-medium text-white">{item.title}</p>
                    </div>
                    <ArrowUpRight className="shrink-0 text-slate-500 group-hover:text-blue-300" size={18} />
                  </div>
                </a>
              ))}
            </div>
          ) : null}

          {liveLinks.length > 0 ? (
            <div className="grid gap-2">
              {liveLinks.map((item) => (
                <a key={item.url} href={item.url} target="_blank" rel="noreferrer" className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-300/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium text-white">{item.title}</p>
                      <p className="mt-2 text-xs text-slate-500">{item.source}{item.price ? ` · ${item.price}` : ""} · {item.score}/100</p>
                    </div>
                    <ArrowUpRight className="shrink-0 text-slate-500 group-hover:text-emerald-300" size={18} />
                  </div>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {staticCandidates.length > 0 ? staticCandidates.map((item) => (
            <div key={item.name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Kaynak: {item.source}</p>
                </div>
                <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs font-medium text-blue-100">{item.score}/100</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.detail}</p>
              <div className="mt-3 rounded-2xl border border-emerald-300/10 bg-emerald-400/10 p-3 text-sm text-emerald-50">Agent aksiyonu: {action}</div>
            </div>
          )) : <p className="rounded-2xl border border-dashed border-white/10 bg-black/25 p-4 leading-7 text-slate-400">Chatte <span className="text-emerald-200">takip ürün adı</span> yaz. Agent canlı trend, haber ve tedarik paketini burada oluşturur.</p>}
        </div>
      )}
    </section>
  );
}
