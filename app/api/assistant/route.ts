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

  const [{ data: profile }, { data: budgetEntries }, { data: ideas }, { data: previousMessages }] = await Promise.all([
    supabase.from("profiles").select("full_name, monthly_income, savings_goal, risk_preference").eq("id", userData.user.id).single(),
    supabase.from("budget_entries").select("label, category, amount, entry_type").eq("user_id", userData.user.id).limit(30),
    supabase.from("ecommerce_ideas").select("product_name, audience, demand_score, estimated_margin, status, notes").eq("user_id", userData.user.id).limit(20),
    supabase.from("assistant_messages").select("role, content").eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(8),
  ]);

  const apiKey = process.env.GEMINI_API_KEY;
  const context = {
    profile,
    budgetEntries: budgetEntries ?? [],
    ecommerceIdeas: ideas ?? [],
    previousMessages: (previousMessages ?? []).reverse(),
  };

  await supabase.from("assistant_messages").insert({
    user_id: userData.user.id,
    role: "user",
    content: message.trim(),
  });

  if (!apiKey) {
    const fallbackReply = "Gemini API anahtarı henüz tanımlı değil. Yine de temel öneri: önce Bütçem sayfasında gelir ve giderlerini tamamla, sonra E-Ticaret sayfasında en yüksek talep ve marj skoruna sahip tek ürünü küçük bütçeyle test et.";
    await supabase.from("assistant_messages").insert({
      user_id: userData.user.id,
      role: "assistant",
      content: fallbackReply,
    });

    return NextResponse.json({
      reply: fallbackReply,
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Sen Sarowth içinde çalışan Türkçe kişisel finans, bütçe ve e-ticaret asistanısın. Kullanıcıya kısa, uygulanabilir, riskleri belirten ve kişisel verilerine dayanan öneriler ver. Yatırım tavsiyesi verirken kesin getiri vaadi verme, risk uyarısı ekle. Kullanıcının bağlamı: ${JSON.stringify(context)}. Kullanıcının sorusu: ${message}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.45,
        maxOutputTokens: 700,
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ reply: "Gemini yanıtı alınamadı. Biraz sonra tekrar deneyebilirsin." }, { status: 502 });
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
