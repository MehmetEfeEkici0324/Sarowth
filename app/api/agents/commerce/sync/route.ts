import { NextResponse } from "next/server";
import { finishAgentRun, startAgentRun } from "@/lib/agents/run-log";
import { isAgentAuthorized } from "@/lib/agents/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface CommerceSyncRequest {
  user_id?: string;
  provider?: string;
  account_name?: string;
  metric_day?: string;
  revenue?: number;
  cost?: number;
  ad_spend?: number;
  products?: Array<{
    provider_product_id?: string;
    product_name: string;
    units_sold?: number;
    revenue?: number;
    estimated_margin?: number;
    trend?: "rising" | "stable" | "falling";
  }>;
}

async function handle(request: Request) {
  if (!isAgentAuthorized(request, "COMMERCE_AGENT_SECRET")) {
    return NextResponse.json({ error: "Yetkisiz ticari hesap agent isteği." }, { status: 401 });
  }

  const payload: CommerceSyncRequest = request.method === "POST" ? await request.json() : {};

  if (!payload.user_id) {
    return NextResponse.json({
      error: "Ticari hesap agent hazır. Shopier/Shopify/Midas adapterını bağlarken user_id ve ticari metrikleri gönder.",
      expected_payload: {
        user_id: "auth.users.id",
        provider: "shopify",
        account_name: "Mağaza adı",
        metric_day: "2026-05-16",
        revenue: 2500,
        cost: 1200,
        ad_spend: 300,
        products: [{ product_name: "Ürün", units_sold: 12, revenue: 900, estimated_margin: 35, trend: "rising" }],
      },
    }, { status: 400 });
  }

  const runId = await startAgentRun("commerce", `${payload.provider ?? "Ticari hesap"} metrikleri eşitleniyor.`);

  try {
    const supabase = createSupabaseAdminClient();
    const provider = payload.provider ?? "commerce";
    const accountName = payload.account_name ?? "Ticari hesap";
    const now = new Date().toISOString();

    const { data: account, error: accountError } = await supabase.from("commerce_accounts").insert({
      user_id: payload.user_id,
      provider,
      account_name: accountName,
      status: "connected",
      last_synced_at: now,
    }).select("id").single();

    if (accountError) throw accountError;

    const revenue = payload.revenue ?? 0;
    const cost = payload.cost ?? 0;
    const adSpend = payload.ad_spend ?? 0;

    const { error: metricError } = await supabase.from("commerce_metrics_daily").upsert({
      user_id: payload.user_id,
      account_id: account.id,
      provider,
      revenue,
      cost,
      ad_spend: adSpend,
      net_profit: revenue - cost - adSpend,
      metric_day: payload.metric_day ?? new Date().toISOString().slice(0, 10),
    }, { onConflict: "user_id,provider,metric_day" });

    if (metricError) throw metricError;

    const products = (payload.products ?? []).map((product) => ({
      user_id: payload.user_id,
      account_id: account.id,
      provider_product_id: product.provider_product_id ?? `${provider}:${product.product_name}`,
      product_name: product.product_name,
      units_sold: product.units_sold ?? 0,
      revenue: product.revenue ?? 0,
      estimated_margin: product.estimated_margin ?? 0,
      trend: product.trend ?? "stable",
      updated_at: now,
    }));

    if (products.length > 0) {
      const { error } = await supabase.from("commerce_products").upsert(products, {
        onConflict: "user_id,provider_product_id",
      });
      if (error) throw error;
    }

    await finishAgentRun(runId, "success", `${products.length} ticari ürün ve günlük metrik eşitlendi.`);
    return NextResponse.json({ synced_products: products.length, account_id: account.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticari hesap agent çalıştırılamadı.";
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
