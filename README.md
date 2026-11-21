# FitTakip (Next.js + Supabase)

## Kurulum
1. supabase.com'da proje aç. SQL Editor'de `supabase/schema.sql` dosyasını çalıştır (tablolar + kullanıcı bazlı güvenlik kuralları).
2. `.env.example` dosyasını `.env.local` olarak kopyala; Project Settings > API'den URL ve anon key değerlerini yaz.
3. `npm install` ardından `npm run dev` ve http://localhost:3000 adresini aç.
4. Yayın: projeyi GitHub'a at, Vercel'de içe aktar, aynı iki ortam değişkenini ekle.

## Android / iOS uygulaması (Capacitor)
```
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init FitTakip com.ornek.fittakip --web-dir=out
npm run build            # out/ klasörünü üretir
npx cap add android && npx cap add ios
npx cap sync
npx cap open android     # Android Studio'dan APK/AAB al
npx cap open ios         # Xcode'dan derle (Mac + Apple Developer hesabı gerekir)
```
Supabase panelinde Authentication > URL Configuration bölümünü kendi adresine göre ayarla.

## Kapsam
Yapıldı: e-posta girişi, kullanıcıya özel veri (RLS), profil + BMR/TDEE/makro hedefleri, günlük özet halkaları, 4 öğün, besin veritabanı, kendi yiyeceğin, su/adım/egzersiz, kilo takibi + grafik, geçmiş günlere gezinme.
Sonraki adımlar: takvim ekranı, haftalık rapor, CSV dışa aktarma, favoriler, AI asistan (sunucuda bir API route ve kendi API anahtarınla).
