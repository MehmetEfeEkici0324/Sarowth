import { NextResponse } from "next/server";
import { finishAgentRun, startAgentRun } from "@/lib/agents/run-log";
import { isAgentAuthorized } from "@/lib/agents/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface MarketSignal {
  product_name: string;
  signal: string;
  score: number;
  source_url: string | null;
}

const seedSignals: MarketSignal[] = [
  {
    product_name: "Katlanabilir seyahat çantası",
    signal: "Seyahat ve düzenleme kategorilerinde düşük maliyetli ürün talebi güçleniyor.",
    score: 84,
    source_url: "https://trends.google.com/trends/",
  },
  {
    product_name: "Mini masa süpürgesi",
    signal: "Ev/ofis masa düzeni içerikleri tekrar eden satın alma niyeti üretiyor.",
    score: 79,
    source_url: "https://trends.google.com/trends/",
  },
  {
    product_name: "Soğuk kahve başlangıç seti",
    signal: "Sezon yaklaşırken evde içecek hazırlama ürünlerinde arama ilgisi artıyor.",
    score: 76,
    source_url: "https://trends.google.com/trends/",
  },
];

async function fetchMarketSignals(): Promise<MarketSignal[]> {
  return seedSignals;
}

async function handle(request: Request) {
  if (!isAgentAuthorized(request, "MARKET_AGENT_SECRET")) {
    return NextResponse.json({ error: "Yetkisiz piyasa agent isteği." }, { status: 401 });
  }

  const runId = await startAgentRun("market", "Piyasa ürün sinyalleri eşitleniyor.");

  try {
    const signals = await fetchMarketSignals();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("market_product_signals").upsert(signals, {
      onConflict: "product_name",
    });

    if (error) throw error;

    await finishAgentRun(runId, "success", `${signals.length} piyasa sinyali güncellendi.`);
    return NextResponse.json({ inserted: signals.length, signals });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Piyasa agent çalıştırılamadı.";
    await finishAgentRun(runId, "error", undefined, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
