import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AssistantRequest {
  message?: string;
}

export async function POST(request: Request) {
  const { message }: AssistantRequest = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ reply: "Bana bütçen, tasarruf hedefin veya ürün fikrinle ilgili bir soru sorabilirsin." });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ reply: "Bu asistanı kullanmak için önce giriş yapmalısın." }, { status: 401 });
  }

  const [{ data: profile }, { data: budgetEntries }, { data: ideas }, { data: bankTransactions }, { data: previousMessages }] = await Promise.all([
    supabase.from("profiles").select("full_name, monthly_income, savings_goal, risk_preference").eq("id", userData.user.id).single(),
    supabase.from("budget_entries").select("label, category, amount, entry_type").eq("user_id", userData.user.id).limit(30),
    supabase.from("ecommerce_ideas").select("product_name, audience, demand_score, estimated_margin, status, notes").eq("user_id", userData.user.id).limit(20),
    supabase.from("bank_transactions").select("description, category, amount, transaction_type, occurred_on").eq("user_id", userData.user.id).order("occurred_on", { ascending: false }).limit(80),
    supabase.from("assistant_messages").select("role, content").eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(8),
  ]);

  const apiKey = process.env.GEMINI_API_KEY;
  const context = {
    profile,
    budgetEntries: budgetEntries ?? [],
    bankTransactions: bankTransactions ?? [],
    ecommerceIdeas: ideas ?? [],
    previousMessages: (previousMessages ?? []).reverse(),
  };

  await supabase.from("assistant_messages").insert({
    user_id: userData.user.id,
    role: "user",
    content: message.trim(),
  });

  if (!apiKey) {
    const fallbackReply = "Gemini API anahtarı henüz tanımlı değil. Temel yaklaşım: önce bu ayki gelir-gider dengesine bak, yüksek harcama kategorilerini azalt, oluşan tasarrufu düşük riskli test bütçesine ayır. Yatırım ve ürün fikirleri yatırım tavsiyesi değildir; sadece bakılabilecek alanlardır.";
    await supabase.from("assistant_messages").insert({
      user_id: userData.user.id,
      role: "assistant",
      content: fallbackReply,
    });

    return NextResponse.json({
      reply: fallbackReply,
    });
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Sen Sarowth içinde çalışan Türkçe kişisel finans, bütçe ve e-ticaret asistanısın.

Ürün vizyonu:
- Kullanıcı bütçe verisini manuel girmez; banka agent'ı gelir, gider, geçmiş ay harcamaları ve kategori dağılımını getirir.
- Piyasa/haber agent'ı popülerleşen ürünleri, finans haberlerini ve bakılabilecek alanları getirir.
- Ticaret/yatırım agent'ı Shopier, Shopify, Midas vb. hesaplardan kar, zarar, talep gören ürünler ve artan/azalan varlıkları gösterir.
- Gemini asistan bu bağlamla satın alma, bekleme, tasarruf ve kar geliştirme önerisi verir.

Davranış kuralları:
- Kullanıcı bir ürün almak istediğinde bu ayki harcama kategorilerine, önceki konuşmalara, gelir-gider dengesine ve tasarruf hedeflerine bak.
- Bütçe zorlanıyorsa net şekilde "şimdi alma" veya "bekle" de.
- Eğer belirli kategori bu ay yüksekse, örneğin yemek harcaması artmışsa bunu gerekçe göster.
- Tasarruf oluşmuşsa ürün testi, ticari ürün tedariki veya finansal olarak bakılabilecek alanları listele.
- Hisse, coin, fon gibi alanlarda kesinlikle "yatırım tavsiyesi değildir" ifadesini kullan. Bunları sadece "bakılabilecek alan" olarak anlat.
- Getiri garantisi verme, kişiyi yönlendiren kesin emirler verme, riskleri açıkça belirt.
- Cevaplar kısa, net, kişisel ve uygulanabilir olsun.

Kullanıcının bağlamı: ${JSON.stringify(context)}
Kullanıcının sorusu: ${message}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.45,
      maxOutputTokens: 700,
    },
  };

  const model = "gemini-1.5-flash";

  let response: Response;

  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    const reply = "Gemini'ye bağlanırken bir hata oluştu. İnternet bağlantını kontrol et ve tekrar dene.";
    await supabase.from("assistant_messages").insert({
      user_id: userData.user.id,
      role: "assistant",
      content: reply,
    });
    return NextResponse.json({ reply }, { status: 200 });
  }

  if (!response.ok) {
    const errorText = await response.text();
    const reply = `Gemini şu anda yanıt vermedi. API anahtarını ve kota durumunu kontrol et. Hata: ${response.status} ${errorText.slice(0, 200)}`;
    await supabase.from("assistant_messages").insert({
      user_id: userData.user.id,
      role: "assistant",
      content: reply,
    });
    return NextResponse.json({ reply }, { status: 200 });
  }

  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Şu anda net bir öneri üretemedim. Sorunu biraz daha detaylandırır mısın?";

  await supabase.from("assistant_messages").insert({
    user_id: userData.user.id,
    role: "assistant",
    content: reply,
  });

  return NextResponse.json({ reply });
}
