import { NextResponse } from "next/server";
import { finishAgentRun, startAgentRun } from "@/lib/agents/run-log";
import { isAgentAuthorized } from "@/lib/agents/security";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface BankTransactionInput {
  provider_transaction_id: string;
  description: string;
  category: string;
  amount: number;
  transaction_type: "income" | "expense";
  occurred_on: string;
}

interface BankSyncRequest {
  user_id?: string;
  provider?: string;
  account_name?: string;
  transactions?: BankTransactionInput[];
}

async function handle(request: Request) {
  if (!isAgentAuthorized(request, "BANK_AGENT_SECRET")) {
    return NextResponse.json({ error: "Yetkisiz banka agent isteği." }, { status: 401 });
  }

  const payload: BankSyncRequest = request.method === "POST" ? await request.json() : {};

  if (!payload.user_id) {
    return NextResponse.json({
      error: "Banka agent hazır. Fintech sağlayıcını bağlarken user_id, provider, account_name ve transactions gönder.",
      expected_payload: {
        user_id: "auth.users.id",
        provider: "fintech-provider",
        account_name: "Ana hesap",
        transactions: [
          {
            provider_transaction_id: "unique-provider-id",
            description: "Market alışverişi",
            category: "Market",
            amount: 450.5,
            transaction_type: "expense",
            occurred_on: "2026-05-16",
          },
        ],
      },
    }, { status: 400 });
  }

  const runId = await startAgentRun("bank", `${payload.provider ?? "Banka"} verisi eşitleniyor.`);

  try {
    const supabase = createSupabaseAdminClient();
    const provider = payload.provider ?? "fintech";
    const accountName = payload.account_name ?? "Banka hesabı";

    const { data: connection, error: connectionError } = await supabase.from("bank_connections").insert({
      user_id: payload.user_id,
      provider,
      account_name: accountName,
      status: "connected",
      last_synced_at: new Date().toISOString(),
    }).select("id").single();

    if (connectionError) throw connectionError;

    const transactions = (payload.transactions ?? []).map((item) => ({
      user_id: payload.user_id,
      connection_id: connection.id,
      provider_transaction_id: item.provider_transaction_id,
      description: item.description,
      category: item.category,
      amount: item.amount,
      transaction_type: item.transaction_type,
      occurred_on: item.occurred_on,
    }));

    if (transactions.length > 0) {
      const { error } = await supabase.from("bank_transactions").upsert(transactions, {
        onConflict: "user_id,provider_transaction_id",
      });
      if (error) throw error;
    }

    await finishAgentRun(runId, "success", `${transactions.length} banka hareketi eşitlendi.`);
    return NextResponse.json({ synced: transactions.length, connection_id: connection.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Banka agent çalıştırılamadı.";
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
