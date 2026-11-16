# FK Cüzdan Gizlilik Politikası

Son güncelleme: 18 Kasım 2026

FK Cüzdan (İngilizce adıyla FK Wallet; "uygulama"), kullanıcıların kredi kartı, banka hesabı, kişisel borç, gelir/gider ve planlanan ödemelerini kişisel olarak takip etmesi için tasarlanmış bir mobil uygulamadır.

## Topladığımız Veriler

Uygulamaya kayıt olduğunda ve kullandığında aşağıdaki verileri topluyoruz:

- **Hesap bilgileri:** E-posta adresi, görünen ad (şifreniz bizde düz metin olarak tutulmaz, kimlik doğrulama sağlayıcımız Supabase tarafından güvenli şekilde saklanır).
- **Kullanıcının kendi girdiği finansal bilgiler:** Kart takma adı, son 4 hane, kredi limiti, güncel borç, ekstre tutarı, hesap bakiyesi, gelir/gider kayıtları, kişisel borç kayıtları, planlanan ödemeler. Bu veriler tamamen kullanıcı tarafından manuel olarak girilir; uygulama hiçbir banka veya kart kuruluşuna bağlanmaz, gerçek kart numarası veya CVV bilgisi istemez ya da saklamaz.
- **Bildirim tercihleri:** Hatırlatma açık/kapalı durumu ve kaç gün önceden hatırlatılacağı.

## Verileri Nasıl Kullanıyoruz

Topladığımız veriler yalnızca:

- Uygulamanın temel işlevini sağlamak (kartlarınızı, hesaplarınızı ve ödemelerinizi görüntülemek),
- Son ödeme tarihleri için yerel bildirim göndermek,
- Hesabınızın güvenliğini sağlamak

amacıyla kullanılır. Verileriniz reklam amacıyla kullanılmaz, üçüncü taraflarla paylaşılmaz veya satılmaz.

## Verilerin Saklanması

Verileriniz, Supabase (PostgreSQL tabanlı bulut veritabanı hizmeti) altyapısında saklanır. Her kullanıcı yalnızca kendi verilerine erişebilir; bu, veritabanı düzeyinde satır bazlı güvenlik (Row Level Security) politikalarıyla teknik olarak zorunlu kılınmıştır.

## Bildirimler

Uygulama, kart son ödeme tarihleri ve planlanan ödemeler için cihazınızda yerel bildirimler zamanlar. Bu bildirimler cihazınızda oluşturulur ve gönderilir; herhangi bir üçüncü taraf bildirim sunucusuna kişisel veri gönderilmez.

## Verilerinizi Silme

Hesabınızı ve tüm verilerinizi uygulama içinden silebilirsiniz: **Profil > Hesabımı Sil**. Bu işlem hesabınızı ve ona bağlı tüm kayıtları (kartlar, hesaplar, borçlar, gelir/gider kayıtları, planlanan ödemeler, profil bilgileri) sunucularımızdan kalıcı ve anında siler; geri alınamaz. Cihazınızda zamanlanmış hatırlatmalar da iptal edilir.

Uygulamaya erişemiyorsanız silme talebinizi karatasoglufirat@gmail.com adresine, kayıtlı e-posta adresinizden gönderebilirsiniz; talebiniz en geç 30 gün içinde işleme alınır.

## İletişim

Bu gizlilik politikası hakkında sorularınız için: karatasoglufirat@gmail.com
