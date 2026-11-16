# FK Wallet Gizlilik Politikası

Son güncelleme: 18 Kasım 2026

FK Wallet ("uygulama"), kullanıcıların kredi kartı, banka hesabı, kişisel borç, gelir/gider ve planlanan ödemelerini kişisel olarak takip etmesi için tasarlanmış bir mobil uygulamadır.

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

## Abonelik ve Satın Almalar

Uygulama, kayıttan itibaren 7 gün ücretsiz denenebilir; sonrasında yeni kayıt eklemek ve düzenlemek için Premium abonelik gerekir. Abonelik ödemeleri tamamen Google Play üzerinden alınır; kart veya ödeme bilgilerin bize ulaşmaz. Abonelik durumunu doğrulamak için RevenueCat (abonelik yönetim hizmeti) kullanılır; RevenueCat'e yalnızca anonim kullanıcı kimliğin ve Google Play'in bildirdiği satın alma bilgileri (ürün, tarih, abonelik durumu) iletilir. Aboneliğini istediğin zaman Google Play > Ödemeler ve abonelikler bölümünden iptal edebilirsin.

## Bildirimler

Uygulama, kart son ödeme tarihleri ve planlanan ödemeler için cihazınızda yerel bildirimler zamanlar. Bu bildirimler cihazınızda oluşturulur ve gönderilir; herhangi bir üçüncü taraf bildirim sunucusuna kişisel veri gönderilmez.

## Verilerinizi Silme

Hesabınızı ve tüm verilerinizi uygulama içinden silebilirsiniz: **Profil > Hesabımı Sil**. Bu işlem hesabınızı ve ona bağlı tüm kayıtları (kartlar, hesaplar, borçlar, gelir/gider kayıtları, planlanan ödemeler, profil bilgileri) sunucularımızdan kalıcı ve anında siler; geri alınamaz. Cihazınızda zamanlanmış hatırlatmalar da iptal edilir.

Hesabı silmek Google Play aboneliğinizi otomatik olarak iptal etmez; aboneliğinizi Google Play > Ödemeler ve abonelikler bölümünden ayrıca iptal etmelisiniz. Google Play'in ve RevenueCat'in yasal yükümlülükler gereği tuttuğu satın alma kayıtları kendi politikalarına tabidir.

Uygulamaya erişemiyorsanız silme talebinizi karatasoglufirat@gmail.com adresine, kayıtlı e-posta adresinizden gönderebilirsiniz; talebiniz en geç 30 gün içinde işleme alınır.

## İletişim

Bu gizlilik politikası hakkında sorularınız için: karatasoglufirat@gmail.com
