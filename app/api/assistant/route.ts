import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AssistantRequest {
  message?: string;
  userMessage?: string;
  userId?: string;
  userName?: string;
}

interface BankaVerisi {
  bakiye: string;
  aylikHarcama: string;
  enCokHarcatilanKategori: string;
  sonHarekeler: string[];
  nakitAkisi: {
    KalanSerbestBütce: string;
  };
  hesapOzet: {
    hesapSahibi: string;
    bankaAdi: string;
    bakiye: string;
    kullanilabilirEsnekAlan: string;
  };
  kategoriAnalizi: {
    kategoriLimitleri: Array<{
      kategori: string;
      limit: string;
      mevcut: string;
      harcanan: string;
      durum: "LIMIT_ASILDI" | "NORMAL";
    }>;
  };
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
  time: string;
  bundleSummary: string;
}

interface Rss2JsonItem {
  title?: string;
  link?: string;
}

interface Rss2JsonResponse {
  feed?: {
    title?: string;
  };
  items?: Rss2JsonItem[];
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

async function bankaAgentYuvasi(userId: string, userName: string): Promise<BankaVerisi> {
  void userId;
  const hesapSahibi = userName || "Kullanıcı";

  return {
    bakiye: "4,250 TL",
    aylikHarcama: "12,800 TL",
    enCokHarcatilanKategori: "E-Ticaret / Giyim",
    sonHarekeler: ["Amazon.com.tr - 1,200 TL", "Hepsiburada - 450 TL"],
    nakitAkisi: {
      KalanSerbestBütce: "1,450 TL",
    },
    hesapOzet: {
      hesapSahibi,
      bankaAdi: "Sarowth Merkez Bankası SIM",
      bakiye: "4,250.00 TL",
      kullanilabilirEsnekAlan: "Kısıtlı",
    },
    kategoriAnalizi: {
      kategoriLimitleri: [
        { kategori: "E-Ticaret / Giyim", limit: "2,500 TL", mevcut: "3,150 TL", harcanan: "3,150 TL", durum: "LIMIT_ASILDI" },
        { kategori: "Mutfak", limit: "7,500 TL", mevcut: "6,900 TL", harcanan: "6,900 TL", durum: "NORMAL" },
      ],
    },
  };
}

async function trendUrunlerYuvasi(): Promise<TrendUrunu[]> {
  return [
    { title: "Katlanabilir seyahat çantası", description: "Kısa video içeriklerinde tekrar eden talep", score: "87/100", source: "Trend Agent" },
    { title: "Mini masa süpürgesi", description: "Ev/ofis düzeni içeriklerinde yükseliyor", score: "81/100", source: "Piyasa Agent" },
    { title: "Soğuk kahve başlangıç seti", description: "Sezon öncesi arama hacmi güçleniyor", score: "76/100", source: "Ürün Agent" },
  ];
}

async function haberTrendYuvasi(bankaData: BankaVerisi, userName: string): Promise<FinansHaberi[]> {
  try {
    const displayName = userName || bankaData?.hesapOzet?.hesapSahibi || "Değerli Sarowth Kullanıcısı";
    const rssTargetUrl = encodeURIComponent("https://www.webrazzi.com/feed");
    const agentApiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssTargetUrl}`;
    const response = await fetch(agentApiUrl, { next: { revalidate: 600 } });
    const data = (await response.json()) as Rss2JsonResponse;
    const fallbackItems: Rss2JsonItem[] = [
      { title: "E-ticarette mikro stok yönetimi daha kritik hale geliyor", link: "https://bloomberght.com" },
      { title: "KOBİ'ler için dijital ödeme komisyonları yakından izleniyor", link: "https://reuters.com" },
      { title: "Tüketici ilgisi düşük fiyatlı pratik ürünlere kayıyor", link: "https://trendhunter.com" },
    ];
    const items = data.items && data.items.length > 0 ? data.items.slice(0, 3) : fallbackItems;
    const giyimKategorisi = bankaData?.kategoriAnalizi?.kategoriLimitleri?.find((kategori) => kategori.kategori === "E-Ticaret / Giyim");
    const isLimitAsildi = giyimKategorisi?.durum === "LIMIT_ASILDI";
    const serbestButce = bankaData?.nakitAkisi?.KalanSerbestBütce || "0 TL";

    return items.map((item, index) => {
      let personalNote = "AJAN NOTU: Genel piyasa sinyalleri dengeli, ticari bütçeni koruyarak hareket et.";

      if (index === 0) {
        personalNote = isLimitAsildi
          ? `AJAN NOTU: Bu canlı gelişme piyasada marjları daraltabilir. ${displayName}, sistemde Giyim limitini ${giyimKategorisi.harcanan} harcamayla aştığın için bu alanda yeni bir e-ticaret stoğuna girmek şu an ALMA kararı içerir.`
          : `AJAN NOTU: Piyasa hareketli, serbest bütçen (${serbestButce}) ile ufak bir niş ürün testi düşünülebilir.`;
      } else if (index === 1) {
        personalNote = `AJAN NOTU: Güncel haber sinyalleri nakit akışının önemini vurguluyor. Kullanılabilir esnek alanını (${bankaData?.hesapOzet?.kullanilabilirEsnekAlan || "Kısıtlı"}) riske atmamak için bireysel borçlanmadan kaçın.`;
      }

      return {
        title: item.title || "Canlı piyasa sinyali okunuyor",
        source: data.feed?.title || "Live Piyasa Agent",
        url: item.link || "https://www.webrazzi.com",
        time: "Canlı Sinyal",
        bundleSummary: personalNote,
      };
    });
  } catch (error) {
    console.error("HABER AJANI FETCH HATASI:", error);
    return [
      { title: "E-ticarette mikro stok yönetimi kritikleşiyor", source: "Yedek Piyasa Agent", url: "https://bloomberght.com", time: "5 dk önce", bundleSummary: "Sistem yedek modda, harcamalarını dengele." },
    ];
  }
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
  const sessionId = userId || "anonymous-user";
  return `https://${location}-dialogflow.googleapis.com/v3/projects/${projectId}/locations/${location}/agents/${agentId}/sessions/${sessionId}:detectIntent`;
}

async function resolveIdentity(body: AssistantRequest) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const userId = body.userId || data.user?.id;

  if (!userId) {
    return { supabase, userId: "anonymous-user", userName: body.userName?.trim() || "Değerli Sarowth Kullanıcısı", isAuthenticated: false };
  }

  if (body.userName?.trim()) {
    return { supabase, userId, userName: body.userName.trim(), isAuthenticated: Boolean(data.user?.id) };
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
  const userName = profile?.full_name?.trim() || profile?.email || data.user?.email || "Değerli Sarowth Kullanıcısı";

  return { supabase, userId, userName, isAuthenticated: Boolean(data.user?.id) };
}

function extractAgentReply(dfData: DialogflowResponse) {
  return dfData.queryResult?.responseMessages?.[0]?.text?.text?.[0] || "Asistan şu an harcamalarını analiz ediyor...";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const { userId: requestUserId, userName: requestUserName } = body;
    const userMessage = (body.userMessage ?? body.message)?.trim();

    if (!userMessage) {
      return NextResponse.json({
        success: false,
        reply: "Bana bütçen, satın alma kararın veya ürün fikrinle ilgili bir soru sorabilirsin.",
        dashboardData: null,
      }, { status: 400 });
    }

    const { supabase, userId, userName, isAuthenticated } = await resolveIdentity({ ...body, userId: requestUserId, userName: requestUserName });
    const resolvedUserName = userName || "Değerli Sarowth Kullanıcısı";

    const { projectId, location, agentId } = readDialogflowConfig();
    const accessToken = await getGoogleAccessToken();
    const bankaVerisi = await bankaAgentYuvasi(userId, resolvedUserName);
    const trendUrunler = await trendUrunlerYuvasi();
    const akilliHaberler = await haberTrendYuvasi(bankaVerisi, resolvedUserName);
    const url = getDialogflowEndpoint(projectId, location, agentId, userId);

    if (isAuthenticated) {
      await supabase.from("assistant_messages").insert({
        user_id: userId,
        role: "user",
        content: userMessage,
      });
    }

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
            user_name: resolvedUserName,
            user_id: userId,
            banka: bankaVerisi,
            trendUrunler,
            finansHaberleri: akilliHaberler,
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

    if (isAuthenticated) {
      await supabase.from("assistant_messages").insert({
        user_id: userId,
        role: "assistant",
        content: agentResponseText,
      });
    }

    return NextResponse.json({
      success: true,
      reply: agentResponseText,
      dashboardData: {
        banka: bankaVerisi,
        trendUrunler,
        finansHaberleri: akilliHaberler,
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
        finansHaberleri: await haberTrendYuvasi(await bankaAgentYuvasi("fallback", "Değerli Sarowth Kullanıcısı"), "Değerli Sarowth Kullanıcısı"),
      },
      error: message,
    }, { status: 500 });
  }
}
