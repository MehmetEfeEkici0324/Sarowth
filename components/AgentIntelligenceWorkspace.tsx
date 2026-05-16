"use client";

import { useState } from "react";
import { ArrowUpRight, Newspaper, Radar } from "lucide-react";
import { AssistantChat } from "@/components/AssistantChat";

interface MarketSignal {
  name: string;
  signal: string;
  score: number;
  source: string;
}

interface FinanceNewsItem {
  title: string;
  source: string;
  href: string;
  time?: string;
  bundleSummary?: string;
}

interface DashboardData {
  trendUrunler?: Array<{
    title: string;
    description: string;
    score: string;
    source: string;
  }>;
  finansHaberleri?: Array<{
    title: string;
    source: string;
    url: string;
    time?: string;
    bundleSummary?: string;
  }>;
}

interface AgentIntelligenceWorkspaceProps {
  initialMarketSignals: MarketSignal[];
  initialFinanceNews: FinanceNewsItem[];
}

function normalizeDashboardData(value: unknown): DashboardData | null {
  if (!value || typeof value !== "object") return null;
  return value as DashboardData;
}

export function AgentIntelligenceWorkspace({ initialMarketSignals, initialFinanceNews }: AgentIntelligenceWorkspaceProps) {
  const [marketSignals, setMarketSignals] = useState(initialMarketSignals);
  const [financeNews, setFinanceNews] = useState(initialFinanceNews);

  function handleDashboardData(value: unknown) {
    const dashboardData = normalizeDashboardData(value);
    if (!dashboardData) return;

    if (dashboardData.trendUrunler?.length) {
      setMarketSignals(dashboardData.trendUrunler.map((item) => ({
        name: item.title,
        signal: item.description,
        score: Number(item.score.split("/")[0]) || 0,
        source: item.source,
      })));
    }

    if (dashboardData.finansHaberleri?.length) {
      setFinanceNews(dashboardData.finansHaberleri.map((item) => ({
        title: item.title,
        source: item.source,
        href: item.url,
        time: item.time,
        bundleSummary: item.bundleSummary,
      })));
    }
  }

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AgentMarketSection marketSignals={marketSignals} />
        <AgentNewsSection financeNews={financeNews} />
      </div>

      <div id="assistant" className="mt-6">
        <AssistantChat onDashboardData={handleDashboardData} />
      </div>
    </>
  );
}

function AgentMarketSection({ marketSignals }: { marketSignals: MarketSignal[] }) {
  return (
    <section id="market" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Radar className="text-emerald-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Piyasada yükselen ürünler</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {marketSignals.map((item) => (
          <div key={item.name} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-sm text-slate-400">{item.signal}</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{item.score}/100</span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Kaynak: {item.source}. Agent bundle yanıtıyla anlık güncellenir.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentNewsSection({ financeNews }: { financeNews: FinanceNewsItem[] }) {
  return (
    <section id="news" className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8">
      <div className="flex items-center gap-3">
        <Newspaper className="text-blue-300" size={22} />
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Finans ve e-ticaret haberleri</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {financeNews.map((news) => (
          <article key={news.title} className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-blue-400/30">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>{news.source}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span>{news.time ?? "Bundle hazır"}</span>
                </div>
                <h3 className="mt-2 font-semibold leading-6 text-white">{news.title}</h3>
                {news.bundleSummary ? (
                  <div className="mt-3 rounded-2xl border border-emerald-300/10 bg-white/[0.06] p-3 text-sm leading-6 text-amber-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    {news.bundleSummary}
                  </div>
                ) : null}
              </div>
              <a href={news.href} target="_blank" rel="noreferrer" aria-label={`${news.title} haberini aç`} className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-500 transition hover:border-blue-300/30 hover:text-blue-300">
                <ArrowUpRight className="shrink-0" size={18} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
