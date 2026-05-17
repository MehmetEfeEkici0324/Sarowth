# Sarowth 1 Dakikalık BTK Sunum Metni

Sarowth, kişisel bütçe verisini canlı piyasa, haber ve ürün tedarik sinyalleriyle birleştiren Türkçe bir finans ve e-ticaret karar asistanıdır.

Kullanıcı gelirini, giderini ve birikimini panelden girer. Sarowth bu verilerle kullanıcının gerçek serbest bütçesini, risk bandını ve güvenli test sermayesini hesaplar. Ardından kullanıcı chat üzerinden “bu ürünü almalı mıyım”, “bu ürünü takip et” veya “bu konuda haberleri getir” dediğinde sistem sadece sohbet cevabı üretmez; arka planda agentlar çalışır.

Ürün agentı SerpAPI üzerinden yerel veya global ürün sonuçlarını arar, marka-model eşleşmesini fuzzy algoritmayla doğrular ve tedarik linklerini skorlar. Haber agentı kullanıcının yazdığı cümleden ana konuyu çıkarır, global haber kaynaklarını tarar ve alakasız sonuçları filtreler. Finans karar motoru ise Gemini’den önce çalışır; yani karar kontrolsüz yapay zekaya bırakılmaz. Gemini sadece güvenli yerel kararın Türkçe, anlaşılır ve kişisel anlatım katmanıdır.

Sarowth’un farkı, bütçe uygulaması, haber takip aracı ve ürün araştırma panelini tek bir kişisel karar merkezinde birleştirmesidir. Kullanıcıya “ne yapabilirim?” sorusunun cevabını sadece genel bilgiyle değil, kendi bütçesi, canlı piyasa sinyalleri ve risk seviyesine göre verir.
