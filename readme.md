# Sarowth

Sarowth, kişisel bütçe verisini canlı haber, ürün trendi ve tedarik sinyalleriyle birleştiren Türkçe finans ve e-ticaret karar asistanıdır. Kullanıcı gelir, gider ve birikim kayıtlarını panelden girer; sistem bu verileri kullanarak satın alma kararları, risk bandı, test bütçesi, ürün takibi ve haber analizi üretir.

## Ne Yapar?

- Kullanıcıya özel gelir, gider ve birikim takibi sağlar.
- Harcama dağılımını kategori bazlı görselleştirir.
- Satın alma isteklerini bütçeye göre `ALINABİLİR`, `BEKLE` veya `ALMA` olarak değerlendirir.
- SerpAPI ile canlı ürün, tedarik ve global haber sinyalleri toplar.
- Gemini ile yerel karar motorunun sonucunu daha okunabilir Türkçe cevaba dönüştürür.
- Ürün takiplerinde yerel veya global pazar araması yapar.
- Global ürün sonuçlarında fiyatı kullanıcının konum para birimine çevirmeye çalışır.
- Haber aramalarında ana konuyu çıkarır, fuzzy eşleşme yapar ve global kaynakları tarar.
- Yenileme isteklerinde önceki sonuçları tekrar göstermemek için URL ve başlık benzerliği filtreler.

## Temel Özellikler

- Email ve 6 haneli doğrulama kodu ile giriş.
- Supabase Auth ve PostgreSQL veri katmanı.
- Next.js App Router mimarisi.
- Tailwind CSS ile responsive arayüz.
- Manuel bütçe girişi: gelir, gider, birikim.
- Tür bazlı kategori seçimi.
- Risk gauge ve harcama donut grafikleri.
- Gemini destekli chat asistanı.
- SerpAPI destekli haber, trend ve tedarik agentları.
- Vercel cron ile periyodik intelligence agent çalıştırma.

## Kullanılan Teknolojiler

- Next.js 16: Web uygulaması, API route, server component ve routing altyapısı.
- React 19: Kullanıcı arayüzü bileşenleri.
- TypeScript: Tip güvenliği ve sürdürülebilir kod yapısı.
- Tailwind CSS 4: Tasarım sistemi ve responsive UI.
- Supabase: Auth, PostgreSQL, RLS ve server-side data access.
- Resend: Email doğrulama kodu gönderimi.
- Gemini API: Chat cevaplarını kişiselleştirme ve dil katmanı.
- SerpAPI: Google Shopping ve Google News sonuçlarını alma.
- Frankfurter API: Para birimi dönüşümü.
- Vercel: Deployment, environment variables, cron ve edge/platform headerları.

## Mimari

Sarowth üç ana katmandan oluşur:

1. Arayüz katmanı: `app/` sayfaları ve `components/` bileşenleri.
2. Karar ve agent katmanı: `app/api/assistant`, `app/api/agents/*` endpointleri.
3. Veri katmanı: Supabase tabloları, auth sessionları ve agent sonuçları.

Chat akışında Gemini doğrudan karar verici değildir. Önce yerel karar motoru bütçe ve canlı sinyal verileriyle deterministik sonucu üretir. Gemini bu sonucu Türkçe, kısa ve kullanıcıya uygun şekilde anlatır. Bu yapı hem maliyeti azaltır hem de finansal kararların kontrolsüz model cevabına bırakılmasını engeller.

## Önemli Komutlar

```bash
npm install
npm run dev
npm run build
npm start
```

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
MAIL_FROM=
EMAIL_CODE_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=
SERPAPI_API_KEY=
INTELLIGENCE_AGENT_SECRET=
NEWS_AGENT_SECRET=
MARKET_AGENT_SECRET=
```

## Veritabanı

Şema `supabase/schema.sql` dosyasındadır. Temel tablolar:

- `profiles`: Kullanıcı profili, aylık gelir, tasarruf hedefi, risk tercihi.
- `budget_entries`: Gelir, gider ve birikim kayıtları.
- `assistant_messages`: Son chat geçmişi.
- `agent_watch_topics`: Kullanıcıların takip ettiği konu ve ürünler.
- `market_product_signals`: Ürün trend sinyalleri.
- `finance_news_items`: Haber sonuçları.
- `product_supplier_links`: Tedarik ve ürün linkleri.
- `agent_runs`: Agent çalışma kayıtları.

## Chat Örnekleri

- `al ayakkabı 2400`
- `haber tesla son durum`
- `haber sndl hisse`
- `ürün takip kaabo wolf warrior x scooter`
- `ürün takip kaabo wolf warrior x scooter global`
- `yatırım`
- `özet`

## Agent Mantığı

Agent, belirli bir hedef için veri toplayan, filtreleyen, işleyen ve sonucu sisteme yazan otomatik görev birimidir. Sarowth içinde agentlar canlı haber, ürün trendi ve tedarik verisini toplar. Chat asistanı bu verileri kullanarak kişisel bütçe bağlamında karar desteği üretir.

## Dokümantasyon

- Kapsamlı teknik makale: `docs/SAROWTH_TECHNICAL_ARTICLE.md`
- 1 dakikalık BTK jüri sunumu: `docs/BTK_ONE_MINUTE_PITCH.md`
- Supabase auth kurulumu: `docs/supabase-auth-setup.md`

## Güvenlik

- Service role key yalnızca server tarafında kullanılır.
- Agent endpointleri secret veya cron doğrulamasıyla korunur.
- Kullanıcı verileri Supabase session ve RLS mantığıyla ayrıştırılır.
- Finansal yatırım alanında cevaplar karar desteğidir; yatırım tavsiyesi değildir.

## Proje Durumu

Sarowth MVP seviyesinde canlıya alınabilecek bir karar destek sistemidir. Banka entegrasyonu yerine manuel bütçe girişi kullanır. Bu tercih hackathon/MVP aşamasında veri güvenliği, entegrasyon karmaşıklığı ve ürün odağı açısından daha kontrollü bir mimari sağlar.
