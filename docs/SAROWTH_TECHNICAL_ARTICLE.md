# Sarowth Geliştirici El Kitabı

Bu doküman Sarowth projesini sıfırdan, yapay zeka desteği kullanmadan geliştirmek isteyen biri için hazırlanmış kapsamlı bir teknik el kitabıdır. Amaç sadece hangi dosyanın ne yaptığını açıklamak değildir. Amaç, projedeki kararların arkasındaki mühendislik mantığını öğretmek, kullanılan teknolojilerin neden seçildiğini anlatmak ve geliştiricinin benzer bir sistemi kendi başına kurabilecek seviyeye gelmesini sağlamaktır.

## İçindekiler

1. Projenin Amacı
2. Ürün Mantığı
3. Öğrenilmesi Gereken Temel Kavramlar
4. Sistem Mimarisi
5. Kullanılan Teknolojiler
6. Kurulum ve Geliştirme Ortamı
7. Veritabanı Tasarımı
8. Kimlik Doğrulama Sistemi
9. Bütçe Modülü
10. Karar Motoru
11. Chat Asistanı
12. Agent Mimarisi
13. Haber Arama Algoritması
14. Ürün Arama Algoritması
15. Fuzzy Eşleşme Mantığı
16. Yenileme ve Tekrar Önleme Mantığı
17. Para Birimi ve Konum Mantığı
18. Gemini Entegrasyonu
19. SerpAPI Entegrasyonu
20. Arayüz Bileşenleri
21. Grafikler ve Veri Görselleştirme
22. Güvenlik
23. Performans
24. Deployment
25. Sıfırdan Geliştirme Planı
26. Kod Okuma Rehberi
27. Geliştirme Disiplini
28. Gelecek Geliştirmeler

## 1. Projenin Amacı

Sarowth, kişisel bütçe yönetimini canlı haber, ürün trendi ve tedarik sinyalleriyle birleştiren Türkçe bir karar destek sistemidir. Kullanıcı gelir, gider ve birikim kayıtlarını girer. Sistem bu kayıtları kullanarak kullanıcının serbest bütçesini, risk seviyesini ve güvenli test sermayesini hesaplar.

Bu proje klasik bir bütçe uygulaması değildir. Klasik bütçe uygulamaları genellikle sadece geçmiş harcamayı gösterir. Sarowth geçmiş veriyi karar desteğine dönüştürür. Kullanıcı “bu ürünü almalı mıyım?”, “bu ürün takip edilebilir mi?”, “bu konuda global haberler neler?” gibi sorular sorduğunda sistem hem kişisel bütçeyi hem de dış veri kaynaklarını birlikte değerlendirir.

## 2. Ürün Mantığı

Sarowth üç temel problemi çözer.

Birinci problem, kullanıcıların harcama kararlarını gerçek bütçe bağlamından kopuk almasıdır. Bir ürün alınabilir gibi görünebilir ama kullanıcının serbest bütçesi düşükse bu karar risklidir.

İkinci problem, e-ticaret fikirlerinin rastgele seçilmesidir. Kullanıcı bir ürünü stoklamadan veya reklama para harcamadan önce canlı ürün, tedarik ve haber sinyallerini görebilmelidir.

Üçüncü problem, yapay zeka cevaplarının kontrolsüz olmasıdır. Sarowth’ta yapay zeka nihai karar verici değildir. Önce deterministik karar motoru çalışır. Gemini sadece bu kararı daha doğal ve anlaşılır Türkçeyle ifade eder.

## 3. Öğrenilmesi Gereken Temel Kavramlar

Bu projeyi geliştirebilmek için şu kavramları anlamak gerekir:

- Frontend: Kullanıcının gördüğü arayüz.
- Backend: Server tarafında çalışan veri ve iş mantığı.
- API: Sistemler arası veri alışverişi sağlayan uç nokta.
- Database: Kalıcı verilerin saklandığı yapı.
- Authentication: Kullanıcının kimliğini doğrulama süreci.
- Authorization: Kullanıcının hangi veriye erişebileceğini belirleme süreci.
- Agent: Belirli hedef için veri toplayan, işleyen ve kaydeden otomatik görev birimi.
- Deterministik karar motoru: Aynı girişe aynı sonucu veren, kuralları belli algoritma.
- LLM: Büyük dil modeli. Bu projede Gemini kullanılır.
- Fuzzy matching: Birebir aynı olmayan ama benzer metinleri eşleştirme yöntemi.

## 4. Sistem Mimarisi

Sarowth üç katmanlı düşünülmelidir.

Birinci katman arayüz katmanıdır. Next.js ve React bileşenleri bu katmanda çalışır. Kullanıcı bütçe formunu, chat alanını, grafiklerini ve agent panellerini burada görür.

İkinci katman uygulama mantığıdır. API route’lar, server action’lar, karar motoru, arama algoritmaları ve agent endpointleri bu katmanda bulunur.

Üçüncü katman veri katmanıdır. Supabase PostgreSQL tabloları kullanıcı profillerini, bütçe kayıtlarını, chat geçmişini, haberleri, ürün sinyallerini ve tedarik linklerini saklar.

Genel veri akışı şöyledir:

1. Kullanıcı chat mesajı gönderir.
2. `/api/assistant` mesajı alır.
3. Kullanıcı oturumu Supabase ile doğrulanır.
4. Bütçe kayıtları ve agent verileri çekilir.
5. Mesaj komuta ayrılır.
6. Gerekirse SerpAPI çağrılır.
7. Yerel karar motoru sonuç üretir.
8. Gemini sadece anlatım katmanı olarak çağrılır.
9. Cevap ve dashboard verisi client’a döner.
10. UI haber, ürün ve tedarik panellerini günceller.

## 5. Kullanılan Teknolojiler

### TypeScript

TypeScript, JavaScript’e tip sistemi ekler. Büyük projelerde veri şekillerinin yanlış kullanılmasını önler. Örneğin `BudgetEntry`, `NewsItem`, `SupplierLink` gibi veri tipleri interface ile tanımlanır. Bu sayede bir fonksiyonun hangi veriyi beklediği açık olur.

### React

React arayüzü bileşenlere böler. Bir buton, form, chat alanı veya grafik ayrı bileşen olabilir. Bu yaklaşım aynı kodu tekrar yazmayı azaltır ve bakımı kolaylaştırır.

### Next.js

Next.js React üzerine kurulu full-stack framework’tür. Sarowth’ta hem sayfalar hem de API endpointleri Next.js içinde yazılır. App Router kullanıldığı için `app/page.tsx` ana sayfayı, `app/api/assistant/route.ts` chat API’sini temsil eder.

### Tailwind CSS

Tailwind CSS utility-first yaklaşımı kullanır. Uzun CSS dosyaları yazmak yerine sınıflarla tasarım yapılır. Örneğin `rounded-2xl`, `bg-black/25`, `grid`, `text-slate-400` gibi sınıflar arayüzü hızlı şekillendirir.

### Supabase

Supabase, PostgreSQL tabanlı backend servisidir. Kullanıcı kimlik doğrulama, veritabanı ve server-side erişim için kullanılır. Service role key sadece server tarafında tutulur.

### Resend

Resend email gönderim servisidir. Sarowth’ta 6 haneli doğrulama kodlarını kullanıcıya göndermek için kullanılır.

### Gemini API

Gemini büyük dil modelidir. Projede finansal kararı doğrudan vermez. Yerel motorun sonucunu daha anlaşılır Türkçeye çevirir.

### SerpAPI

SerpAPI Google News ve Google Shopping sonuçlarını programatik olarak almamızı sağlar. Haber ve ürün agentlarının dış veri kaynağıdır.

### Frankfurter API

Döviz dönüşümü için kullanılır. Global ürün aramasında dolar veya euro fiyatı kullanıcının yerel para birimine çevrilmeye çalışılır.

## 6. Kurulum ve Geliştirme Ortamı

Projeyi sıfırdan kurmak için önce Node.js kurulmalıdır. Ardından Next.js projesi oluşturulur.

```bash
npx create-next-app@latest sarowth --typescript
cd sarowth
```

Gerekli paketler yüklenir.

```bash
npm install @supabase/ssr @supabase/supabase-js resend lucide-react
```

Geliştirme sunucusu başlatılır.

```bash
npm run dev
```

Production build almak için:

```bash
npm run build
```

## 7. Veritabanı Tasarımı

Veritabanı tasarımında en önemli nokta veriyi doğru parçalara ayırmaktır. Kullanıcı profili, bütçe kayıtları, chat mesajları ve agent sonuçları ayrı tablolarda tutulur.

Temel tablolar:

- `profiles`: Kullanıcı adı, aylık gelir, tasarruf hedefi, risk tercihi.
- `budget_entries`: Her gelir, gider ve birikim kaydı.
- `assistant_messages`: Chat geçmişi.
- `agent_watch_topics`: Takip edilen ürün veya haber konusu.
- `market_product_signals`: Ürün trend sinyalleri.
- `finance_news_items`: Haber sonuçları.
- `product_supplier_links`: Tedarik sonuçları.
- `agent_runs`: Agent çalışma logları.

Bir bütçe kaydı şu alanlardan oluşur:

- `user_id`: Kaydın hangi kullanıcıya ait olduğu.
- `label`: Kullanıcıya görünen kayıt adı.
- `category`: Market, kira, maaş gibi kategori.
- `amount`: Tutar.
- `entry_type`: `income`, `expense` veya `saving`.
- `occurred_on`: Tarih.

## 8. Kimlik Doğrulama Sistemi

Sarowth sosyal login kullanmaz. Email ve 6 haneli kod doğrulama kullanır. Bu akışın amacı sade, anlaşılır ve platform bağımsız bir giriş sistemi kurmaktır.

Akış şöyledir:

1. Kullanıcı email adresini girer.
2. Sistem 6 haneli kod üretir.
3. Kod hashlenerek saklanır.
4. Resend ile kullanıcıya gönderilir.
5. Kullanıcı kodu girer.
6. Kod doğruysa Supabase oturumu oluşturulur.

Kodların düz metin saklanmaması önemlidir. Hash mantığı, veritabanı sızıntısı durumunda kodların doğrudan okunmasını engeller.

## 9. Bütçe Modülü

Bütçe modülü kullanıcının finansal kararlarının temelidir. Bu yüzden kategori seçimi serbest metin değil kontrollü listedir. Kullanıcı önce kayıt türünü seçer: gelir, gider veya birikim. Sonra sadece o türe ait kategoriler gösterilir.

Bu tasarımın avantajları:

- Veri temiz kalır.
- Harcama analizi daha doğru yapılır.
- Chat karar motoru kategori baskısını güvenilir hesaplar.
- Kullanıcı yanlışlıkla gelir kategorisini gider olarak seçemez.

Server action tarafında kategori doğrulaması mutlaka yapılır. Client tarafında seçimi kısıtlamak tek başına yeterli değildir; kötü niyetli kullanıcı doğrudan request gönderebilir. Bu yüzden `addBudgetEntry` fonksiyonu seçilen kategorinin seçilen türle uyumlu olup olmadığını kontrol eder.

## 10. Karar Motoru

Karar motoru kullanıcının satın alma isteğini değerlendirir. Örneğin kullanıcı `al ayakkabı 2400` yazdığında sistem önce tutarı ayrıştırır, sonra kullanıcının bütçe özetini çıkarır.

Bütçe özeti şunları hesaplar:

- Toplam gelir.
- Toplam gider.
- Toplam birikim.
- Serbest bütçe.
- Kategori bazlı giderler.
- En yüksek gider kategorisi.

Karar kuralları genel olarak şöyledir:

- Gelir yoksa karar `BEKLE`.
- Ürün serbest bütçeden büyükse karar `ALMA`.
- Satın alma sonrası güvenli tampon çok düşüyorsa karar `ALMA`.
- Harcama oranı yüksekse karar `BEKLE`.
- Serbest bütçe korunuyorsa karar `ALINABİLİR`.

Bu yapı deterministiktir. Aynı bütçe ve aynı tutar girildiğinde aynı karar döner. Finansal uygulamalarda bu özellik önemlidir çünkü kullanıcıya tutarlı davranış sağlar.

## 11. Chat Asistanı

Chat asistanı iki parçadan oluşur: frontend bileşeni ve backend API.

Frontend tarafında `AssistantChat` bileşeni kullanıcının mesajını alır, API’ye gönderir ve gelen cevabı gösterir. Ayrıca bekleme animasyonu, yenile butonları ve önceki sonuç dışlama listesini yönetir.

Backend tarafında `/api/assistant` mesajı işler. Önce komut ayrıştırılır. Komutlar şunlardır:

- `al`: Satın alma kararı.
- `haber`: Haber araması.
- `takip`: Ürün takibi.
- `yatirim`: Yatırım alanı analizi.
- `ozet`: Bütçe özeti.

Kullanıcı slash komut yazmak zorunda değildir. Doğal dilde yazdığı basit ifadeler prefix listeleriyle komuta dönüştürülür.

## 12. Agent Mimarisi

Agent, belirli bir görevi otonom veya yarı otonom şekilde yürüten yazılım birimidir. Sarowth’ta agent kavramı gerçek veri işleyen servis mantığıyla kullanılır.

Haber agentı belirli konular için global haber araması yapar. Ürün agentı ürün adı için tedarik ve fiyat sonuçları bulur. Intelligence agent takip edilen konuları periyodik olarak işler. Market agent trend ürün sinyallerini günceller.

Agent kullanmanın avantajı şudur: Sistem sadece kullanıcı mesajına cevap veren bir chat uygulaması olmaz. Arka planda veri toplama, skor üretme, kayıt yazma ve panel güncelleme döngüsü oluşur.

## 13. Haber Arama Algoritması

Haber aramasında en önemli problem kullanıcının yazdığı cümlenin doğrudan iyi bir arama sorgusu olmamasıdır. Kullanıcı `tesla hissesi son durum` yazabilir. Burada ana konu `tesla`, diğer kelimeler bağlam veya niyettir.

Algoritma şu adımları izler:

1. Metni normalize eder.
2. Gereksiz haber kelimelerini çıkarır.
3. Ana konuyu belirler.
4. Ana konu üzerinden farklı global sorgular üretir.
5. SerpAPI Google News çağrıları yapar.
6. Sonuçları fuzzy eşleşme ile filtreler.
7. Skora göre sıralar.
8. Dashboard payload’ına dönüştürür.

Örnek konu çıkarımı:

- `sndl hisse` -> `sndl`
- `openai hakkında son haberler` -> `openai`
- `bitcoin neden düştü` -> `bitcoin`
- `tesla hissesi son durum` -> `tesla`

Bu yaklaşım sadece belirli bir hisseye özel değildir. Her haber sorgusunda ana konu çıkarımı yapılır.

## 14. Ürün Arama Algoritması

Ürün aramasında amaç genel kategori sonuçlarını değil, marka ve modele uygun sonuçları bulmaktır. Kullanıcı `kaabo wolf warrior x scooter` yazdığında sadece scooter kelimesi geçen sonuçlar yeterli değildir. Kaabo, Wolf, Warrior ve X tokenları da dikkate alınmalıdır.

Algoritma şu adımları izler:

1. Ürün adı normalize edilir.
2. Bilinen yazım hataları düzeltilir.
3. Yerel veya global arama modu belirlenir.
4. Google Shopping sorguları oluşturulur.
5. Sonuçlar marka/model eşleşmesine göre skorlanır.
6. Alakasız sonuçlar elenir.
7. Fiyat yerel para birimine çevrilmeye çalışılır.
8. Tedarik kartları panelde gösterilir.

Global ürün araması için kullanıcı ürün adının sonuna `global` yazar. Örneğin:

```text
ürün takip kaabo wolf warrior x scooter global
```

Bu durumda ürün global pazarda aranır ama fiyat kullanıcının bulunduğu ülkenin para birimine çevrilmeye çalışılır.

## 15. Fuzzy Eşleşme Mantığı

Fuzzy eşleşme birebir aynı olmayan metinleri benzerlik üzerinden değerlendirme yöntemidir. Bu projede iki yerde kullanılır: haber araması ve ürün araması.

Fuzzy eşleşme için şu teknikler kullanılır:

- Küçük harfe çevirme.
- Türkçe karakter normalizasyonu.
- Noktalama temizleme.
- Stop word çıkarma.
- Token bazlı eşleşme.
- Edit distance hesaplama.
- Benzerlik skoru üretme.

Edit distance, iki kelimenin birbirine dönüşmesi için gereken minimum karakter değişikliği sayısıdır. Örneğin bir harf hatası varsa sistem sonucu tamamen çöpe atmaz.

## 16. Yenileme ve Tekrar Önleme Mantığı

Yenileme özelliği kullanıcı aynı haberleri veya ürünleri tekrar görmek istemediğinde kullanılır. Burada önemli olan sadece yeni API çağrısı yapmak değildir. Yeni çağrı aynı sonuçları döndürürse kullanıcı deneyimi kötü olur.

Bu nedenle client mevcut ekrandaki başlıkları ve URL’leri API’ye gönderir. Server bu listeyi dışlama listesi olarak kullanır.

Tekrar önleme şu yöntemlerle yapılır:

- URL normalize edilir.
- Query parametreleri yok sayılır.
- Başlık normalize edilir.
- Başlık token benzerliği hesaplanır.
- Benzer başlıklı haberler elenir.

Eğer yeni ve farklı sonuç yoksa sistem eski sonuçları tekrar basmak yerine kullanıcıya farklı sonuç bulunamadığını söyler.

## 17. Para Birimi ve Konum Mantığı

Konum bilgisi Vercel veya Cloudflare headerları üzerinden okunur. Eğer header yoksa `Accept-Language` fallback olarak kullanılır. Ülkeye göre para birimi belirlenir.

Örnekler:

- Türkiye -> TRY
- ABD -> USD
- İngiltere -> GBP
- Almanya -> EUR
- Kanada -> CAD
- Avustralya -> AUD

Global ürün aramasında ürün dünya pazarında aranır. Ancak fiyat gösterimi kullanıcının para birimine çevrilmeye çalışılır. Dönüşüm Frankfurter API ile yapılır. Eğer kur servisi cevap vermezse orijinal fiyat korunur.

## 18. Gemini Entegrasyonu

Gemini entegrasyonunda en önemli prensip şudur: Model karar vermez, anlatır.

Backend önce yerel karar motorunu çalıştırır. Bu karar `deterministicDecision` olarak Gemini context’ine verilir. Prompt içinde modelden bu kararı bozmaması istenir. Böylece modelin finansal kararları rastgele değiştirmesi engellenir.

Bu yaklaşımın avantajları:

- Daha düşük maliyet.
- Daha düşük halüsinasyon riski.
- Daha tutarlı finansal kararlar.
- API kotası daha kontrollü kullanılır.
- Model hatasında local fallback devam eder.

## 19. SerpAPI Entegrasyonu

SerpAPI iki amaçla kullanılır:

- Google News sonuçları.
- Google Shopping sonuçları.

SerpAPI çağrılarında tek sorguya güvenilmez. Birden fazla sorgu varyasyonu oluşturulur. Bu, sonuç bulma ihtimalini artırır. Ancak daha sonra filtreleme yapılmazsa alakasız sonuçlar gelebilir. Bu yüzden sorgu genişletme ve sonuç filtreleme birlikte kullanılır.

## 20. Arayüz Bileşenleri

Arayüz bileşenleri mümkün olduğunca sorumluluklarına göre ayrılmıştır.

- `AssistantChat`: Chat mesajı, loading animasyonu, yenileme butonu.
- `AgentIntelligenceWorkspace`: Haber ve ürün panellerini yönetir.
- `BudgetEntryForm`: Bütçe kaydı formu.
- `CommerceAgentPanel`: Canlı ticari fırsat paketi.
- `StatCard`: Küçük istatistik kartları.
- `AppShell`: Panel layout yapısı.

Bir bileşen hem veri çekme, hem form yönetme, hem grafik çizme, hem API çağırma işlerini aynı anda yapmamalıdır. Bu prensip clean code açısından önemlidir.

## 21. Grafikler ve Veri Görselleştirme

Sarowth’ta iki önemli grafik vardır: harcama donut grafiği ve risk gauge grafiği.

Donut grafik kategori yüzdelerini SVG stroke segmentleriyle gösterir. SVG kullanmak çizim kontrolünü artırır. Küçük yüzdeler gerçek oranına yakın ince dilim olarak gösterilebilir.

Risk gauge harcama yükü, likidite yükü ve kategori baskısından üretilen 0-100 risk skorunu gösterir. Yeşil güvenli, sarı dikkat, kırmızı riskli alanı temsil eder.

## 22. Güvenlik

Güvenlikte temel prensip gizli anahtarların client’a çıkmamasıdır. Supabase service role key, Gemini key, SerpAPI key ve agent secret değerleri sadece server tarafında kullanılmalıdır.

Agent endpointleri secret kontrolüyle korunur. Kullanıcı verileri session doğrulamasıyla ayrılır. Form verileri server tarafında tekrar doğrulanır. Bu yaklaşım client manipülasyonuna karşı koruma sağlar.

## 23. Performans

Performans için şu yaklaşımlar kullanılır:

- Gereksiz Gemini çağrısı yapılmaz.
- Dış API çağrıları paralel yapılır.
- Sonuç sayıları sınırlanır.
- Agent sonuçları veritabanına kaydedilir.
- Dashboard tek response ile güncellenir.
- Yenilemede önceki sonuçlar dışlanır.

Performans sadece hızlı çalışmak değildir. Aynı zamanda API kotasını, kullanıcı bekleme süresini ve gereksiz veri tekrarını azaltmaktır.

## 24. Deployment

Deployment için Vercel kullanılabilir. Ortam değişkenleri Vercel dashboard üzerinden tanımlanır. Cron job ile intelligence agent belirli aralıklarla çalıştırılır.

Gerekli ortam değişkenleri:

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

## 25. Sıfırdan Geliştirme Planı

Bu projeyi sıfırdan geliştirmek için şu sırayı izlemek en sağlıklı yoldur:

1. Next.js ve TypeScript projesi oluştur.
2. Tailwind CSS kurulumunu yap.
3. Supabase projesi aç.
4. Veritabanı tablolarını oluştur.
5. Email doğrulama akışını geliştir.
6. Auth session yönetimini kur.
7. Bütçe kayıt formunu yaz.
8. Bütçe özet fonksiyonunu geliştir.
9. Satın alma karar motorunu yaz.
10. Chat UI bileşenini oluştur.
11. `/api/assistant` endpointini yaz.
12. Gemini adapter ekle.
13. SerpAPI haber aramasını ekle.
14. SerpAPI ürün aramasını ekle.
15. Fuzzy eşleşme algoritmasını geliştir.
16. Agent sonuçlarını Supabase’e yaz.
17. Dashboard panellerini bağla.
18. Yenileme ve tekrar önleme mantığını ekle.
19. Grafik bileşenlerini geliştir.
20. Vercel deployment yap.

Bu sırayı takip etmek önemlidir. Önce çekirdek ürün ve karar motoru kurulmalıdır. Dış API’ler daha sonra eklenmelidir. Böylece API kotası veya dış servis hatası olsa bile sistem temel işlevini korur.

## 26. Kod Okuma Rehberi

Projeyi anlamak için şu sırayla dosyaları okumak önerilir:

1. `README.md`
2. `supabase/schema.sql`
3. `app/workspace/actions.ts`
4. `components/BudgetEntryForm.tsx`
5. `app/page.tsx`
6. `components/AgentIntelligenceWorkspace.tsx`
7. `components/AssistantChat.tsx`
8. `app/api/assistant/route.ts`
9. `app/api/agents/intelligence/route.ts`
10. `lib/agents/security.ts`

Bu sırayla okumak, önce veri modelini, sonra kullanıcı arayüzünü, sonra karar ve agent mantığını anlamayı sağlar.

## 27. Geliştirme Disiplini

Profesyonel geliştirme için şu kurallar izlenmelidir:

- Her fonksiyon tek sorumluluk taşımalıdır.
- Client doğrulaması server doğrulamasının yerine geçmemelidir.
- API key client tarafına çıkmamalıdır.
- Büyük dosyalar zamanla modüllere ayrılmalıdır.
- Dış API sonuçları filtrelenmeden kullanıcıya gösterilmemelidir.
- Finansal kararlar sadece dil modeline bırakılmamalıdır.
- Build her önemli değişiklikten sonra çalıştırılmalıdır.
- Veritabanı şeması dokümante edilmelidir.

## 28. Gelecek Geliştirmeler

Proje gelecekte şu alanlarda genişletilebilir:

- Banka entegrasyonu.
- Daha gelişmiş fiyat geçmişi takibi.
- Kullanıcı geri bildirimine göre agent skor iyileştirme.
- Haber kaynak güvenilirliği skoru.
- Daha kapsamlı test altyapısı.
- Agent observability paneli.
- Döviz kuru cache sistemi.
- Harcama anomalisi algılama.
- Mobil uygulama.

## Sonuç

Sarowth, kişisel bütçe yönetimi, canlı veri agentları ve kontrollü yapay zeka anlatımını tek sistemde birleştirir. Projenin temel mühendislik değeri, karar mekanizmasını tamamen yapay zekaya bırakmaması ve dış verileri filtreleyerek kullanmasıdır. Bu el kitabı takip edilerek aynı mimari sıfırdan kurulabilir, geliştirici hem modern web teknolojilerini hem de karar destek sistemi tasarlamayı öğrenebilir.
