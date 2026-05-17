# Sarowth Teknik Makalesi

## 1. Projenin Tanımı

Sarowth, kişisel finans yönetimi ile e-ticaret fırsat analizini aynı karar destek ekranında birleştiren web tabanlı bir uygulamadır. Projenin temel amacı, kullanıcının bütçe gerçekliğini canlı haber, ürün trendi ve tedarik verileriyle birlikte değerlendirerek daha güvenli finansal ve ticari kararlar almasına yardımcı olmaktır.

Geleneksel bütçe uygulamaları çoğunlukla sadece gelir-gider takibi yapar. Geleneksel ürün araştırma araçları ise kullanıcının kişisel bütçesini bilmez. Sarowth bu iki dünyayı birleştirir: kullanıcı bütçesini girer, sistem bu bütçeden serbest alanı çıkarır, trend ve haber agentları canlı dış veri toplar, chat asistanı da bu bağlamı kullanarak kısa ve uygulanabilir cevaplar verir.

## 2. Ürün Ne İşe Yarar?

Sarowth şu temel sorulara cevap verir:

- Bu ürünü mevcut bütçemle almalı mıyım?
- Bu ay güvenli serbest bütçem ne kadar?
- Hangi harcama kategorisi bütçemi zorluyor?
- Küçük bir e-ticaret testi için ne kadar bütçe ayırabilirim?
- Takip ettiğim ürün için canlı tedarik ve fiyat sonuçları var mı?
- Belirli bir konu, şirket, hisse veya sektör hakkında global haber sinyalleri neler?
- Yeni sonuç istediğimde aynı haberleri tekrar görmeden farklı sonuç alabilir miyim?

Bu soruların cevabı sadece model tarafından tahmin edilmez. Önce uygulamanın deterministik karar motoru çalışır. Daha sonra Gemini, bu kararı Türkçe ve kullanıcı dostu bir anlatıma dönüştürür.

## 3. Kullanıcı Akışı

Kullanıcı email adresiyle kayıt olur. Sistem kullanıcıya 6 haneli doğrulama kodu gönderir. Kullanıcı kodu doğruladıktan sonra panele ulaşır. Panelde aylık gelir, tasarruf hedefi ve risk tercihi gibi profil bilgileri girilebilir. Bütçe sayfasında kullanıcı gelir, gider ve birikim kayıtlarını hazır kategorilerle ekler.

Ana ekranda sistem bu kayıtları toplar ve üç ana gösterge üretir: toplam gelir, toplam gider ve toplam tasarruf. Harcama dağılımı donut grafikle, risk seviyesi yarım daire gauge ile gösterilir. Chat alanında kullanıcı doğal cümlelerle sistemle konuşabilir.

Örnek komutlar:

- `al ayakkabı 2400`
- `haber openai güncel gelişmeler`
- `haber sndl hisse`
- `ürün takip kaabo wolf warrior x scooter`
- `ürün takip kaabo wolf warrior x scooter global`
- `yatırım`
- `özet`

## 4. Sistem Mimarisi

Sarowth modern full-stack web mimarisiyle geliştirilmiştir. Ana mimari katmanları şunlardır:

## 4.1 Arayüz Katmanı

Arayüz `app/` ve `components/` dizinleri üzerine kuruludur. Next.js App Router kullanıldığı için sayfalar dosya sistemi tabanlı route mantığıyla çalışır. React bileşenleri yeniden kullanılabilir parçalara ayrılmıştır.

Önemli arayüz bileşenleri:

- `AgentIntelligenceWorkspace`: Haber, ürün sinyali, tedarik linkleri ve chat alanını birleştirir.
- `AssistantChat`: Kullanıcının mesaj gönderdiği, bekleme animasyonu ve yenile butonlarını yöneten chat bileşenidir.
- `BudgetEntryForm`: Gelir, gider ve birikim için tür bazlı kategori seçimi sağlar.
- `CommerceAgentPanel`: Canlı ürün arama sonuçlarını ticari fırsat paketi olarak gösterir.
- `AppShell`: Girişli panel sayfalarının ortak layout yapısını sağlar.

## 4.2 API ve Karar Katmanı

Next.js API route yapısı kullanılır. En kritik endpoint `app/api/assistant/route.ts` dosyasıdır. Bu endpoint kullanıcı mesajını alır, komutu ayrıştırır, ilgili verileri Supabase’den çeker, gerekiyorsa SerpAPI çağırır, yerel karar motorunu çalıştırır ve son cevabı üretir.

Diğer agent endpointleri:

- `app/api/agents/intelligence/route.ts`: Takip edilen ürün ve haber konularını SerpAPI ile senkronize eder.
- `app/api/agents/news/route.ts`: Haber agent görevlerini çalıştırır.
- `app/api/agents/market/route.ts`: Ürün sinyali kayıtlarını günceller.

## 4.3 Veri Katmanı

Supabase PostgreSQL veritabanı kullanılır. Kullanıcı auth bilgileri, bütçe kayıtları, agent sonuçları ve chat geçmişi veritabanında saklanır.

Önemli tablolar:

- `profiles`: Kullanıcı profil ayarları.
- `budget_entries`: Gelir, gider ve birikim kayıtları.
- `assistant_messages`: Chat geçmişi.
- `agent_watch_topics`: Takip edilen ürün ve haber konuları.
- `market_product_signals`: Ürün trend sinyalleri.
- `finance_news_items`: Haber kayıtları.
- `product_supplier_links`: Tedarik linkleri.
- `agent_runs`: Agent çalışma logları.

## 5. Kullanılan Teknolojiler

## 5.1 TypeScript

TypeScript, JavaScript’in tip güvenliği eklenmiş halidir. Sarowth’ta API response yapıları, bütçe kayıtları, haber sonuçları ve tedarik linkleri interface ile tanımlanır. Bu sayede yanlış veri şekilleri geliştirme aşamasında yakalanır.

## 5.2 React

React, arayüzü bileşenlere ayırarak yönetir. Sarowth’ta chat, grafikler, bütçe formu, haber kartları ve tedarik kartları ayrı bileşenlerdir. Bu yapı hem okunabilirliği hem bakım kolaylığını artırır.

## 5.3 Next.js

Next.js, React tabanlı full-stack framework’tür. Sarowth’ta hem sayfalar hem API endpointleri Next.js içinde geliştirilir. Server component yapısı sayesinde kullanıcıya özel veriler güvenli şekilde server tarafında çekilebilir.

## 5.4 Tailwind CSS

Tailwind CSS, utility-first CSS yaklaşımı sunar. Sarowth’un koyu tema, kart yapısı, responsive grid sistemi, animasyonları ve grafik çevresi Tailwind sınıflarıyla oluşturulur.

## 5.5 Supabase

Supabase, PostgreSQL tabanlı backend servisidir. Auth, database ve server-side erişim için kullanılır. Sarowth’ta kullanıcı oturumu, bütçe kayıtları, agent verileri ve chat mesajları Supabase üzerinde tutulur.

## 5.6 Resend

Resend, email gönderim servisidir. Kullanıcı kayıt ve giriş akışında 6 haneli doğrulama kodu göndermek için kullanılır.

## 5.7 Gemini API

Gemini, doğal dil üretim katmanı olarak kullanılır. Sarowth’ta Gemini’ye doğrudan finansal karar verdirilmez. Yerel karar motoru önce sonucu üretir, Gemini bu sonucu kullanıcıya daha anlaşılır ve doğal bir dille anlatır.

## 5.8 SerpAPI

SerpAPI, Google News ve Google Shopping sonuçlarına programatik erişim sağlar. Ürün takibi, global haber araması ve tedarik linkleri bu servis üzerinden alınır.

## 5.9 Frankfurter API

Frankfurter API, döviz kuru dönüşümü için kullanılır. Global ürün aramasında fiyat dolar veya euro gibi farklı para birimindeyse kullanıcının konum para birimine çevrilmeye çalışılır.

## 6. API Kavramı

API, iki yazılım sistemi arasında kontrollü veri alışverişi sağlayan arayüzdür. Sarowth hem kendi API endpointlerine sahiptir hem de harici API’leri kullanır.

Kendi API örnekleri:

- `/api/assistant`: Chat mesajını işler.
- `/api/agents/intelligence`: Cron veya manuel agent senkronizasyonu yapar.
- `/api/agents/news`: Haber agent görevlerini yürütür.
- `/api/agents/market`: Piyasa sinyallerini günceller.

Harici API örnekleri:

- Gemini API: Dil modeli cevabı.
- SerpAPI: Haber ve ürün sonuçları.
- Frankfurter API: Kur dönüşümü.
- Supabase API: Auth ve database işlemleri.

Bir API isteği genellikle şu aşamalarla çalışır: istemci istek gönderir, server isteği doğrular, gerekli veriyi işler, response döner. Sarowth’ta bu mantık chat mesajından agent sonuçlarına kadar birçok yerde kullanılır.

## 7. Agent Kavramı

Agent, belirli bir hedef için çalışan yazılım birimidir. Sadece komut alan pasif fonksiyon değildir; veri toplar, filtreler, skorlar, kaydeder ve başka sistemlerin kullanabileceği anlamlı çıktılar üretir.

Sarowth içindeki agentlar:

- Haber agentı: Konu veya şirket hakkında global haber kaynaklarını tarar.
- Ürün agentı: Ürün adı, marka ve model bilgisine göre tedarik sonuçlarını bulur.
- Intelligence agent: Takip edilen konuları periyodik olarak işler.
- Market agent: Trend ürün sinyallerini veritabanına yazar.
- Chat karar agentı: Bütçe, haber ve ürün sinyallerini birleştirerek cevap üretir.

Agent mantığının avantajı, sistemin sadece chat balonu üretmemesidir. Arka planda veri işleme döngüsü kurulur. Bu veri daha sonra panel, risk kartı, tedarik kartı ve ticari fırsat panosunda yeniden kullanılabilir.

## 8. Karar Motoru

Sarowth’un en önemli tasarım kararı, finansal kararın tamamen dil modeline bırakılmamasıdır. Satın alma kararında önce yerel karar motoru çalışır.

Motor şu verileri kullanır:

- Toplam gelir.
- Toplam gider.
- Toplam birikim.
- Serbest bütçe.
- Satın alınmak istenen ürün tutarı.
- Harcama-gelir oranı.
- En yüksek gider kategorisi.

Temel kararlar:

- `ALINABİLİR`: Satın alma sonrası güvenli alan korunuyorsa.
- `BEKLE`: Satın alma mümkün ama serbest bütçeyi fazla zorluyorsa.
- `ALMA`: Satın alma güvenli bütçe dışına çıkarıyorsa.

Bu karar daha sonra Gemini’ye context olarak verilir. Prompt içinde Gemini’ye bu kararı bozmaması söylenir. Böylece modelin keyfi veya halüsinatif finansal tavsiye üretmesi engellenir.

## 9. Haber Arama Algoritması

Haber aramasında kullanıcının yazdığı cümle doğrudan arama motoruna gönderilmez. Önce normalize edilir ve ana konu çıkarılır.

Örnekler:

- `sndl hisse` -> ana konu: `sndl`
- `tesla hissesi son durum` -> ana konu: `tesla`
- `openai hakkında güncel haber` -> ana konu: `openai`
- `bitcoin son dakika` -> ana konu: `bitcoin`

Bu işlem için yardımcı kelimeler ayıklanır. `hisse`, `haber`, `son`, `güncel`, `ne oldu`, `analiz`, `piyasa` gibi kelimeler ana konu dışına alınır. Daha sonra birden fazla global arama varyasyonu üretilir:

- Tam konu araması.
- Latest news.
- Breaking news.
- Analysis.
- Global market.
- Eğer konu kısa ticker gibi görünüyorsa stock news ve shares varyasyonları.
- Türkçe haber varyasyonu.

Sonuçlar fuzzy eşleşme algoritmasıyla kontrol edilir. Küçük yazım hatalarında sonuç tamamen dışlanmaz. Ancak alakasız haberlerin geçmesini engellemek için token eşleşme skoru hesaplanır.

## 10. Fuzzy Eşleşme Algoritması

Fuzzy eşleşme, metinlerin birebir aynı olmasını beklemeden benzer olup olmadığını ölçer. Sarowth’ta bu yaklaşım hem haber hem ürün aramasında kullanılır.

Temel adımlar:

1. Metin küçük harfe çevrilir.
2. Türkçe karakter ve noktalama normalize edilir.
3. Gereksiz kelimeler çıkarılır.
4. Arama tokenları çıkarılır.
5. Sonuç başlığı ve açıklamasında bu tokenların geçip geçmediği kontrol edilir.
6. Küçük yazım hataları için edit distance hesaplanır.
7. Sonuca skor verilir.

Edit distance, iki kelimeyi birbirine dönüştürmek için kaç karakter ekleme, silme veya değiştirme gerektiğini ölçer. Örneğin `kaboo` ve `kaabo` birebir aynı değildir ama düzeltme tablosu ve fuzzy mantık sayesinde Kaabo markasına yakın kabul edilir.

## 11. Ürün Arama Algoritması

Ürün aramasında temel hedef, genel kategori sonuçları yerine marka/model uyumlu sonuçları getirmektir. Örneğin kullanıcı `kaabo wolf warrior x scooter` yazdığında sadece `scooter` geçen sonuçlar yeterli kabul edilmez. Marka ve model tokenlarının da eşleşmesi gerekir.

Ürün arama aşamaları:

1. Ürün adı normalize edilir.
2. Bilinen typo düzeltmeleri uygulanır.
3. Yerel veya global arama modu seçilir.
4. Google Shopping için birden fazla sorgu üretilir.
5. Sonuç başlıkları marka/model skoruna göre filtrelenir.
6. Tedarik linkleri skorlanır.
7. Fiyat metni kullanıcının konum para birimine çevrilmeye çalışılır.
8. Sonuçlar Supabase’e yazılır.

Global ürün araması için kullanıcı ürün adının sonuna `global` yazar. Örneğin `ürün takip kaabo wolf warrior x scooter global`. Bu durumda global pazar aranır fakat fiyat gösterimi kullanıcının konum para birimine çevrilmeye çalışılır.

## 12. Yenileme Algoritması

Kullanıcı haberleri veya ürün sonuçlarını yenilediğinde sistemin aynı sonuçları tekrar göstermemesi gerekir. Bunun için iki taraflı filtreleme yapılır.

Client tarafı mevcut ekranda görünen haber ve ürün sonuçlarının URL ve başlıklarını API’ye gönderir. Server tarafı ise hem Supabase’den gelen eski kayıtları hem client’tan gelen dışlama listesini kullanır.

Tekrarlı sonuç eleme yöntemleri:

- Normalize edilmiş URL karşılaştırması.
- Query parametrelerini yok sayma.
- Başlık normalizasyonu.
- Başlık token benzerliği.
- Aynı haber farklı URL ile gelirse başlık benzerliğine göre eleme.

Bu yapı yenileme deneyimini daha doğru hale getirir. Eğer farklı yeni sonuç bulunamazsa sistem aynı sonuçları tekrar göstermek yerine bunu kullanıcıya açıkça söyler.

## 13. Risk Skoru ve Gauge

Risk skoru sadece gider / gelir oranıyla hesaplanmaz. Kompozit bir skor kullanılır.

Skor bileşenleri:

- Harcama yükü.
- Likidite yükü.
- En büyük gider kategorisinin baskısı.

Bu bileşenler 0-100 arasında bir risk skoru üretir. Arayüzde yarım daire gauge ile gösterilir. Skor düşükse yeşil, orta seviyedeyse sarı, yüksekse kırmızı risk bandı kullanılır.

## 14. Harcama Dağılımı Donut Grafiği

Harcama donut grafiği kategori yüzdelerini gösterir. Grafik SVG stroke segmentleriyle çizilir. Bu yaklaşım CSS conic-gradient kullanımına göre daha kontrollüdür. Küçük oranlar, örneğin %1 seviyesindeki kategoriler, gerçek oranına yakın şekilde ince dilim olarak gösterilir.

## 15. Performans Yaklaşımı

Sarowth’ta performans için şu yaklaşımlar kullanılır:

- Server component ile ilk veri yükleme.
- Chat dışındaki işlemlerde Gemini çağrısı yapılmaması.
- Yerel karar motoruyla Gemini kullanımını azaltma.
- SerpAPI sonuçlarını Supabase’e persist etme.
- Yenilemede önceki sonuçları dışlayarak gereksiz tekrarları azaltma.
- Promise tabanlı paralel API çağrıları.
- Sınırlı result set kullanımı.
- Dashboard verisini tek response payload içinde güncelleme.

## 16. Güvenlik Yaklaşımı

Güvenlik tarafında temel prensipler şunlardır:

- Supabase service role key yalnızca server tarafında kullanılır.
- Client tarafında sadece public anon key bulunur.
- Agent endpointleri secret veya cron doğrulamasıyla korunur.
- Email doğrulama kodu hash mantığıyla saklanır.
- Kullanıcı oturumu server tarafında doğrulanır.
- Finans ve yatırım cevapları karar desteği olarak sınırlandırılır.

## 17. Kod Organizasyonu

Proje dizinleri:

- `app/`: Next.js route, page ve API yapıları.
- `components/`: Reusable React bileşenleri.
- `lib/`: Supabase, auth, mail ve agent yardımcıları.
- `supabase/`: Veritabanı şeması.
- `docs/`: Teknik dokümantasyon.
- `public/`: Statik dosyalar, ikonlar ve manifest.

Kodda temel prensip, iş mantığını mümkün olduğunca küçük fonksiyonlara ayırmaktır. Örneğin haber aramasında normalize, konu çıkarımı, fuzzy skor, URL normalize ve yenileme filtreleri ayrı fonksiyonlardır. Bu hem test edilebilirliği hem okunabilirliği artırır.

## 18. Sıfırdan Geliştirme Rehberi

Bu projeyi sıfırdan geliştirmek için önerilen sıra şöyledir:

1. Next.js projesi oluştur.
2. TypeScript ve Tailwind CSS kurulumunu tamamla.
3. Supabase projesi aç ve auth ayarlarını yapılandır.
4. Veritabanı tablolarını oluştur.
5. Email doğrulama için Resend entegrasyonu kur.
6. Bütçe giriş ekranını geliştir.
7. Bütçe özet algoritmasını yaz.
8. Satın alma karar motorunu geliştir.
9. Chat API route oluştur.
10. Gemini adapter ekle.
11. SerpAPI ürün ve haber aramalarını ekle.
12. Fuzzy filtreleme ve skorlamayı geliştir.
13. Agent sonuçlarını veritabanına yaz.
14. Ana panelde grafik ve agent kartlarını göster.
15. Yenileme ve tekrar önleme mantığını ekle.
16. Vercel deployment ve cron ayarlarını yap.

Bu sıranın avantajı, önce çekirdek bütçe ve karar motorunun kurulmasıdır. Dış API’ler daha sonra eklenir. Böylece sistem API kotası olmasa bile temel karar desteğini sürdürebilir.

## 19. Önemli Dosyalar

- `app/api/assistant/route.ts`: Chat, karar motoru, SerpAPI, Gemini ve dashboard payload merkezi.
- `components/AssistantChat.tsx`: Chat UI, loading animasyonu ve yenileme kontrolleri.
- `components/AgentIntelligenceWorkspace.tsx`: Agent verilerinin panelde gösterimi.
- `components/BudgetEntryForm.tsx`: Kategori bazlı bütçe girişi.
- `app/page.tsx`: Girişli ana ekran, grafikler ve karar panelleri.
- `app/workspace/actions.ts`: Server actions ve form kayıtları.
- `supabase/schema.sql`: Veritabanı şeması.
- `lib/agents/security.ts`: Agent endpoint güvenliği.

## 20. Son Yapılan İyileştirmeler

Son geliştirme turunda şu iyileştirmeler yapılmıştır:

- Bütçe kategori seçimi gelir, gider ve birikim türlerine ayrıldı.
- Donut grafik SVG tabanlı hale getirildi.
- Risk gauge daha geniş ve okunabilir tasarlandı.
- Ürün araması marka/model doğruluğu için fuzzy skorlamayla güçlendirildi.
- Haber araması ana konu çıkarımıyla genel hale getirildi.
- Global ürün arama modu eklendi.
- Konuma göre para birimi gösterimi ve kur dönüşümü eklendi.
- Chat loading animasyonu eklendi.
- Haber ve ürün yenileme butonları eklendi.
- Yenilemede aynı sonuçların tekrar gösterilmemesi için URL ve başlık dışlama eklendi.
- Kod içinde gereksiz yorumlar temizlendi.
- Chat UI tarafında tekrar eden regex ve dashboard exclusion mantığı sadeleştirildi.

## 21. Profesyonel Değerlendirme

Sarowth’un güçlü tarafı, yapay zeka cevabını tek başına ürünün merkezine koymamasıdır. Sistem önce güvenilir, deterministik ve izlenebilir karar katmanını çalıştırır. Dış API’lerden gelen sinyaller filtrelenir ve skorlanır. Dil modeli ise kararın anlatım katmanı olarak konumlanır. Bu yaklaşım daha düşük maliyet, daha düşük halüsinasyon riski ve daha sürdürülebilir ürün mimarisi sağlar.

Proje MVP olarak manuel bütçe girişiyle başlar. Bu bilinçli bir tercihtir. Banka entegrasyonu daha karmaşık regülasyon, güvenlik ve veri erişimi gerektirir. Manuel giriş, hackathon ve erken ürün doğrulama aşamasında daha hızlı, güvenli ve kontrol edilebilir bir yoldur.

## 22. Gelecek Geliştirmeler

- Banka entegrasyonu için açık bankacılık sağlayıcıları.
- Daha gelişmiş haber kaynak sınıflandırması.
- Agent sonuçları için kullanıcı geri bildirim skoru.
- Ürün fiyat geçmişi takibi.
- Daha gelişmiş döviz dönüşüm cache katmanı.
- Harcama anomalisi algılama.
- Kullanıcı bazlı risk profili öğrenimi.
- Test kapsamının artırılması.
- Agent sonuçları için observability paneli.

## 23. Sonuç

Sarowth, kişisel finans yönetimi, canlı veri agentları ve kontrollü yapay zeka cevabını tek mimaride birleştirir. Kullanıcının gerçek bütçesini merkeze alır, haber ve ürün sinyallerini bu bütçeyle ilişkilendirir ve karar desteğini anlaşılır bir arayüzle sunar. Bu yaklaşım, sadece sohbet eden bir asistan değil, kullanıcıya gerçek zamanlı finansal bağlam sağlayan uygulanabilir bir karar sistemi oluşturur.
