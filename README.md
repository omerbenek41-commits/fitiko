# FitTakip

Beslenme, antrenman ve gelişim takibi için **tamamen çevrimdışı, sunucusuz ve ücretsiz** bir web uygulaması (Next.js statik çıktı + React + Tailwind).

- **Hesap / şifre yok:** İlk açılışta yalnızca ad, boy ve kilo sorulur.
- **Sunucu / veritabanı yok:** Tüm veriler tarayıcının `localStorage` alanında (`fittakip:v1` anahtarı altında tek JSON) saklanır.
- **Çevrimdışı:** Service worker (`public/sw.js`) uygulama dosyalarını önbelleğe alır; ilk ziyaretten sonra internet olmadan açılır. Ana ekrana eklenebilir (PWA).
- **Sıfır maliyet:** `out/` klasörü herhangi bir ücretsiz statik barındırmaya (GitHub Pages, Netlify, Vercel, Cloudflare Pages) konabilir; ortam değişkeni gerekmez.

## Özellikler
| Sekme | İçerik |
|---|---|
| 📒 Günlük | Hafta şeridi ve gün gezintisi, kalan kalori halkası (Hedef − Yenen + Egzersiz), makro çubukları, 4 öğün, su bardakları, adım, günlük not |
| ➕ Yiyecek ekleme | Arama (~80 Türk mutfağı yiyeceği), son kullanılanlar (son miktarla tek dokunuş), favoriler ★, hızlı kalori girişi, kendi yiyeceğini oluşturma, g/ml/adet/porsiyon, dünkü öğünü kopyalama, kayıt düzenleme |
| 🏋️ Antrenman | Kuvvet (set × kg × tekrar, önceki değerler, set tamamlama, 90 sn dinlenme sayacı) ve kardiyo (süre, mesafe, MET ile kalori), özel hareket, önceki antrenmanı tekrarla, yarım kalan antrenman kaydı, kişisel rekor 🏆 |
| 📈 Gelişim | Kilo grafiği + 7 kayıtlık ortalama + hedef çizgisi, hedef ilerlemesi, VKİ, kayıt serisi, 7 günlük kalori grafiği, haftalık antrenman sayısı, hareket bazında tahmini 1RM grafiği ve rekorlar |
| 👤 Profil | Yaş/cinsiyet/aktivite/hedef ile Mifflin-St Jeor hesaplaması, kalori/makro/su/adım hedefleri, JSON yedek indir/yükle, tüm verileri sil |

## Çalıştırma
```
npm install
npm run dev      # http://localhost:3000
npm run build    # statik çıktı: out/
```
`out/` klasörünü bir statik sunucuyla açabilirsin (ör. `python3 -m http.server -d out`). Service worker yalnızca derlenmiş sürümde etkinleşir.

> Veriler cihaza özeldir: tarayıcı verileri temizlenirse silinir. Profil sekmesindeki **Yedeği indir** ile düzenli yedek al; başka bir cihaza **Yedekten yükle** ile taşıyabilirsin.

## Android / iOS (isteğe bağlı, Capacitor)
```
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init FitTakip com.ornek.fittakip --web-dir=out
npm run build && npx cap add android && npx cap sync && npx cap open android
```

## Kod yapısı
- `lib/store.ts` – localStorage veri katmanı (`useData` kancası, sekmeler arası senkron, yedekleme)
- `lib/foods.ts`, `lib/exercises.ts` – yerleşik yiyecek ve hareket kataloğu
- `lib/calc.ts` – tarih, kalori/makro, VKİ, seri hesapları
- `components/` – `Onboarding`, `Diary`, `AddFood`, `Workouts`, `Progress`, `Profile`, `ui`
