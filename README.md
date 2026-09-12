# FK Wallet

Kredi kartlarının hesap kesim ve son ödeme tarihlerini, ödemelerini ve gelir/giderini tek yerden takip etmek için Expo (React Native) + Supabase ile geliştirilmiş bir mobil uygulama.

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` içine Supabase panelinden (Project Settings → API) `Project URL` ve `anon / publishable` anahtarını yaz. **service_role** anahtarını asla buraya koyma.

Veritabanı şemasını kurmak için `supabase/migrations/` altındaki dosyaları tarih sırasıyla Supabase panelindeki **SQL Editor**'da bir kez çalıştır.

## Bölümler

- **Ana Sayfa** — Kartlarım, Gelirim, Giderim ve Planlanan Ödemelerim kutucuklarından oluşan panel; en üstte en yakın kart son ödemesi
- **Kartlarım** — güncel borç, bu ayki ekstre, hesap kesim/son ödeme tarihleri, kalan limit, ödeme geçmişi
- **Hesaplarım** — banka hesapları ve güncel bakiyeleri; toplam varlığı tek yerden görme
- **Borçlarım** — çevreye olan kişisel borçları ayrı takip etme ve ödendi olarak kapatma
- **Gelirim / Giderim** — karttan bağımsız, aylık gezinilebilen gelir ve gider defterleri
- **Planlanan Ödemelerim** — kira/fatura/taksit gibi tarihli ödemeler; her ay tekrar edebilir, "ödendi" denince otomatik gider kaydı oluşur
- **Hatırlatıcılar** — son ödemeden N gün önce ve ödeme gününün sabahı 09:00'da yerel bildirim

## Geliştirme

```bash
npx expo start
```

QR kodu Expo Go uygulamasıyla okutarak fiziksel telefonda test edebilirsin, `a` ile bağlı Android emülatöründe, `w` ile tarayıcıda açabilirsin.

Env değişkeni değiştirdiğinde sunucuyu `npx expo start --clear` ile yeniden başlat.

## Proje yapısı

- `app/` — Expo Router route'ları ((auth) giriş/kayıt, (app) sekmeler + kart/hareket ekranları)
- `src/lib/` — Supabase istemcisi, tarih hesaplama, bildirim zamanlama, format yardımcıları
- `src/store/` — Zustand store'ları (auth, cards, transactions, settings)
- `src/components/` — Yeniden kullanılan arayüz bileşenleri
- `src/theme/` — Renk, boşluk, tipografi tokenleri
- `supabase/migrations/` — Veritabanı şeması
