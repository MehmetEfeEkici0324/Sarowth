import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AssistantRequest {
  message?: string;
  userId?: string;
  userName?: string;
}

interface BankaVerisi {
  bakiye: string;
  aylikHarcama: string;
  enCokHarcatilanKategori: string;
  sonHarekeler: string[];
}

interface TrendUrunu {
  title: string;
  description: string;
  score: string;
  source: string;
}

interface FinansHaberi {
  title: string;
  source: string;
  url: string;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface DialogflowResponse {
  queryResult?: {
    responseMessages?: Array<{
      text?: {
        text?: string[];
      };
    }>;
  };
  error?: {
    message?: string;
    status?: string;
  };
}

async function bankaAgentYuvasi(userId: string): Promise<BankaVerisi> {
  void userId;

  return {
    bakiye: "4,250 TL",
    aylikHarcama: "12,800 TL",
    enCokHarcatilanKategori: "E-Ticaret / Giyim",
    sonHarekeler: ["Amazon.com.tr - 1,200 TL", "Hepsiburada - 450 TL"],
  };
}

async function trendUrunlerYuvasi(): Promise<TrendUrunu[]> {
  return [
    { title: "Katlanabilir seyahat çantası", description: "Kısa video içeriklerinde tekrar eden talep", score: "87/100", source: "Trend Agent" },
    { title: "Mini masa süpürgesi", description: "Ev/ofis düzeni içeriklerinde yükseliyor", score: "81/100", source: "Piyasa Agent" },
    { title: "Soğuk kahve başlangıç seti", description: "Sezon öncesi arama hacmi güçleniyor", score: "76/100", source: "Ürün Agent" },
  ];
}

async function haberTrendYuvasi(): Promise<FinansHaberi[]> {
  return [
    { title: "E-ticarette mikro stok yönetimi daha kritik hale geliyor", source: "Finans Haber Agent", url: "https://bloomberght.com" },
    { title: "KOBİ'ler için dijital ödeme maliyetleri yakından izleniyor", source: "Piyasa Haber Agent", url: "https://reuters.com" },
    { title: "Tüketici ilgisi düşük fiyatlı pratik ürünlere kayıyor", source: "Trend Haber Agent", url: "https://trendhunter.com" },
  ];
}

async function getGoogleAccessToken() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!refreshToken) {
    throw new Error("GOOGLE_REFRESH_TOKEN ortam değişkeni eksik.");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: "32555940559.apps.googleusercontent.com",
      refresh_token: refreshToken,
    }),
  });

  const tokenData = (await tokenResponse.json()) as TokenResponse;

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("GOOGLE TOKEN ERROR:", tokenData);
    throw new Error(tokenData.error_description || tokenData.error || "Google access token üretilemedi.");
  }

  return tokenData.access_token;
}

function readDialogflowConfig() {
  const projectId = process.env.DIALOGFLOW_CX_PROJECT_ID;
  const location = process.env.DIALOGFLOW_CX_LOCATION || "global";
  const agentId = process.env.DIALOGFLOW_CX_AGENT_ID;

  if (!projectId || !agentId) {
    throw new Error("Dialogflow CX ortam değişkenleri eksik: DIALOGFLOW_CX_PROJECT_ID ve DIALOGFLOW_CX_AGENT_ID gerekli.");
  }

  return { projectId, location, agentId };
}

function getDialogflowEndpoint(projectId: string, location: string, agentId: string, userId: string) {
  const sessionId = `sarowth-session-${userId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return `https://${location}-dialogflow.googleapis.com/v3/projects/${projectId}/locations/${location}/agents/${agentId}/sessions/${sessionId}:detectIntent`;
}

async function resolveIdentity(body: AssistantRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = body.userId || data.user?.id;

  if (!userId) {
    return { supabase, userId: null, userName: null };
  }

  if (body.userName?.trim()) {
    return { supabase, userId, userName: body.userName.trim() };
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
  const userName = profile?.full_name?.trim() || profile?.email || data.user?.email || "Mehmet Efe";

  return { supabase, userId, userName };
}

function extractAgentReply(dfData: DialogflowResponse) {
  return dfData.queryResult?.responseMessages?.[0]?.text?.text?.[0] || "Asistan şu an harcamalarını analiz ediyor...";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const userMessage = body.message?.trim();

    if (!userMessage) {
      return NextResponse.json({
        success: false,
        reply: "Bana bütçen, satın alma kararın veya ürün fikrinle ilgili bir soru sorabilirsin.",
        dashboardData: null,
      }, { status: 400 });
    }

    const { supabase, userId, userName } = await resolveIdentity(body);

    if (!userId || !userName) {
      return NextResponse.json({
        success: false,
        reply: "Bu asistanı kullanmak için önce giriş yapmalısın.",
        dashboardData: null,
      }, { status: 401 });
    }

    const { projectId, location, agentId } = readDialogflowConfig();
    const accessToken = await getGoogleAccessToken();
    const bankaVerisi = await bankaAgentYuvasi(userId);
    const url = getDialogflowEndpoint(projectId, location, agentId, userId);

    await supabase.from("assistant_messages").insert({
      user_id: userId,
      role: "user",
      content: userMessage,
    });

    const dfResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        queryInput: {
          text: { text: userMessage },
          languageCode: "tr",
        },
        queryParams: {
          payload: {
            user_name: userName,
            user_id: userId,
            banka: bankaVerisi,
          },
        },
      }),
    });

    const dfData = (await dfResponse.json()) as DialogflowResponse;

    if (!dfResponse.ok) {
      console.error("DIALOGFLOW DETECT INTENT ERROR:", dfData);
      throw new Error(dfData.error?.message || `Dialogflow detectIntent başarısız: ${dfResponse.status}`);
    }

    const agentResponseText = extractAgentReply(dfData);

    await supabase.from("assistant_messages").insert({
      user_id: userId,
      role: "assistant",
      content: agentResponseText,
    });

    return NextResponse.json({
      success: true,
      reply: agentResponseText,
      dashboardData: {
        banka: bankaVerisi,
        trendUrunler: await trendUrunlerYuvasi(),
        finansHaberleri: await haberTrendYuvasi(),
      },
    });
  } catch (error) {
    console.error("CRITICAL RUNTIME ERROR:", error);

    const message = error instanceof Error ? error.message : "Asistan çalıştırılırken bilinmeyen bir hata oluştu.";

    return NextResponse.json({
      success: false,
      reply: "Asistan şu anda yanıt veremiyor. Dialogflow CX bağlantı, refresh token ve ortam değişkenlerini kontrol et.",
      dashboardData: {
        banka: null,
        trendUrunler: await trendUrunlerYuvasi(),
        finansHaberleri: await haberTrendYuvasi(),
      },
      error: message,
    }, { status: 500 });
  }
}
