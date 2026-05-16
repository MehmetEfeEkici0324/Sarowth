import { SessionsClient, protos } from "@google-cloud/dialogflow-cx";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

interface AssistantRequest {
  message?: string;
  userId?: string;
  userName?: string;
}

interface BankaAgentVerisi {
  bankaAdi: string;
  hesapTuru: string;
  bakiye: number;
  aylikGelir: number;
  aylikGider: number;
  kullanilabilirAlan: number;
  riskSeviyesi: "dusuk" | "orta" | "yuksek";
  harcamaKategorileri: Array<{
    kategori: string;
    tutar: number;
    oran: number;
  }>;
  sonGuncelleme: string;
}

interface TrendUrunVerisi {
  title: string;
  description: string;
  score: string;
  source: string;
}

interface FinansHaberiVerisi {
  title: string;
  source: string;
  url: string;
}

interface DialogflowConfig {
  projectId: string;
  location: string;
  agentId: string;
}

function readDialogflowConfig(): DialogflowConfig {
  const projectId = process.env.DIALOGFLOW_CX_PROJECT_ID ?? process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.DIALOGFLOW_CX_LOCATION ?? "global";
  const agentId = process.env.DIALOGFLOW_CX_AGENT_ID;

  if (!projectId || !agentId) {
    throw new Error("Dialogflow CX ortam değişkenleri eksik: DIALOGFLOW_CX_PROJECT_ID ve DIALOGFLOW_CX_AGENT_ID gerekli.");
  }

  return { projectId, location, agentId };
}

function valueToProtoValue(value: JsonValue): protos.google.protobuf.IValue {
  if (value === null) return { nullValue: "NULL_VALUE" };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") return { numberValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  if (Array.isArray(value)) {
    return {
      listValue: {
        values: value.map((item) => valueToProtoValue(item)),
      },
    };
  }

  return { structValue: objectToStruct(value) };
}

function objectToStruct(value: { [key: string]: JsonValue }): protos.google.protobuf.IStruct {
  return {
    fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, valueToProtoValue(item)])),
  };
}

async function bankaAgentYuvasi(userId: string): Promise<BankaAgentVerisi> {
  const userSeed = userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const aylikGelir = 42000 + (userSeed % 8) * 1250;
  const aylikGider = 26300 + (userSeed % 6) * 900;
  const bakiye = 18450 + (userSeed % 10) * 700;

  return {
    bankaAdi: "Garanti BBVA",
    hesapTuru: "Vadesiz TL Hesabı",
    bakiye,
    aylikGelir,
    aylikGider,
    kullanilabilirAlan: Math.max(0, aylikGelir - aylikGider),
    riskSeviyesi: aylikGider / aylikGelir > 0.75 ? "yuksek" : aylikGider / aylikGelir > 0.55 ? "orta" : "dusuk",
    harcamaKategorileri: [
      { kategori: "Mutfak", tutar: 8200, oran: 31 },
      { kategori: "Abonelik", tutar: 1850, oran: 7 },
      { kategori: "Ulaşım", tutar: 3600, oran: 14 },
      { kategori: "Giyim", tutar: 2900, oran: 11 },
      { kategori: "Kira ve Faturalar", tutar: 9750, oran: 37 },
    ],
    sonGuncelleme: new Date().toISOString(),
  };
}

async function trendUrunlerYuvasi(): Promise<TrendUrunVerisi[]> {
  return [
    { title: "Katlanabilir seyahat çantası", description: "Kısa video içeriklerinde tekrar eden talep", score: "87/100", source: "Trend Agent" },
    { title: "Mini masa süpürgesi", description: "Ev/ofis düzeni içeriklerinde yükseliyor", score: "81/100", source: "Piyasa Agent" },
    { title: "Soğuk kahve başlangıç seti", description: "Sezon öncesi arama hacmi güçleniyor", score: "76/100", source: "Ürün Agent" },
  ];
}

async function haberTrendYuvasi(): Promise<FinansHaberiVerisi[]> {
  return [
    { title: "E-ticarette mikro stok yönetimi daha kritik hale geliyor", source: "Finans Haber Agent", url: "https://bloomberght.com" },
    { title: "KOBİ'ler için dijital ödeme maliyetleri yakından izleniyor", source: "Piyasa Haber Agent", url: "https://reuters.com" },
    { title: "Tüketici ilgisi düşük fiyatlı pratik ürünlere kayıyor", source: "Trend Haber Agent", url: "https://trendhunter.com" },
  ];
}

async function resolveRequestIdentity(body: AssistantRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const authUserId = userData.user?.id;
  const userId = body.userId ?? authUserId;

  if (!userId) {
    return { supabase, userId: null, userName: null };
  }

  if (body.userName) {
    return { supabase, userId, userName: body.userName };
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single();
  const userName = profile?.full_name?.trim() || profile?.email || userData.user?.email || "Sarowth kullanıcısı";

  return { supabase, userId, userName };
}

function buildDialogflowClient() {
  const credentials = process.env.GOOGLE_REFRESH_TOKEN ? {
    type: "authorized_user" as const,
    client_id: "32555940559.apps.googleusercontent.com",
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN.trim(),
  } : undefined;

  if (credentials) {
    return new SessionsClient({
      credentials,
    });
  }

  return new SessionsClient();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequest;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({
        success: false,
        reply: "Bana bütçen, satın alma kararın veya ürün fikrinle ilgili bir soru sorabilirsin.",
        dashboardData: null,
      }, { status: 400 });
    }

    const { supabase, userId, userName } = await resolveRequestIdentity(body);

    if (!userId || !userName) {
      return NextResponse.json({
        success: false,
        reply: "Bu asistanı kullanmak için önce giriş yapmalısın.",
        dashboardData: null,
      }, { status: 401 });
    }

    const dialogflowConfig = readDialogflowConfig();
    const bankaVerisi = await bankaAgentYuvasi(userId);
    const trendUrunler = await trendUrunlerYuvasi();
    const finansHaberleri = await haberTrendYuvasi();
    const client = buildDialogflowClient();
    const sessionPath = client.projectLocationAgentSessionPath(
      dialogflowConfig.projectId,
      dialogflowConfig.location,
      dialogflowConfig.agentId,
      `sarowth-session-${userId}`,
    );

    await supabase.from("assistant_messages").insert({
      user_id: userId,
      role: "user",
      content: message,
    });

    const parameters = objectToStruct({
      userId,
      userName,
      user_name: userName,
      bankaAdi: bankaVerisi.bankaAdi,
      hesapTuru: bankaVerisi.hesapTuru,
      bakiye: bankaVerisi.bakiye,
      aylikGelir: bankaVerisi.aylikGelir,
      aylikGider: bankaVerisi.aylikGider,
      kullanilabilirAlan: bankaVerisi.kullanilabilirAlan,
      riskSeviyesi: bankaVerisi.riskSeviyesi,
      harcamaKategorileri: bankaVerisi.harcamaKategorileri as unknown as JsonValue,
      trendUrunler: trendUrunler as unknown as JsonValue,
      finansHaberleri: finansHaberleri as unknown as JsonValue,
    });

    const [dialogflowResponse] = await client.detectIntent({
      session: sessionPath,
      queryInput: {
        text: { text: message },
        languageCode: "tr",
      },
      queryParams: {
        parameters,
      },
    });

    const reply = dialogflowResponse.queryResult?.responseMessages
      ?.flatMap((responseMessage) => responseMessage.text?.text ?? [])
      .filter(Boolean)
      .join("\n\n") || "Şu anda net bir cevap üretemedim. Sorunu biraz daha detaylandırır mısın?";

    await supabase.from("assistant_messages").insert({
      user_id: userId,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({
      success: true,
      reply,
      dashboardData: {
        banka: bankaVerisi,
        trendUrunler,
        finansHaberleri,
      },
    });
  } catch (error) {
    console.error("CRITICAL RUNTIME ERROR:", error);
    const message = error instanceof Error ? error.message : "Asistan çalıştırılırken bilinmeyen bir hata oluştu.";

    return NextResponse.json({
      success: false,
      reply: "Asistan şu anda yanıt veremiyor. Dialogflow CX bağlantı ve ortam değişkenlerini kontrol et.",
      dashboardData: null,
      error: message,
    }, { status: 500 });
  }
}
