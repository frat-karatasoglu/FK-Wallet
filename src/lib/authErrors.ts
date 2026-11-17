import { isAuthRetryableFetchError, type AuthError } from '@supabase/supabase-js';

// Supabase hata mesajları İngilizce gelir; kullanıcıya her zaman Türkçe göster.
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-posta veya şifre hatalı.',
  user_already_exists: 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',
  email_exists: 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.',
  email_address_invalid: 'Geçerli bir e-posta adresi gir.',
  validation_failed: 'Bilgileri kontrol edip tekrar dene.',
  weak_password: 'Şifre çok zayıf. En az 6 karakterli, tahmin edilmesi zor bir şifre seç.',
  same_password: 'Yeni şifren eskisinden farklı olmalı.',
  email_not_confirmed: 'E-posta adresin henüz doğrulanmamış.',
  otp_expired: 'Kodun süresi dolmuş ya da kod hatalı. Yeni kod isteyip tekrar dene.',
  over_email_send_rate_limit: 'Çok fazla e-posta istendi. Birkaç dakika sonra tekrar dene.',
  over_request_rate_limit: 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.',
  signup_disabled: 'Şu anda yeni kayıt alınmıyor.',
  user_not_found: 'Bu e-posta adresiyle kayıtlı hesap bulunamadı.',
  session_not_found: 'Oturumun sona ermiş. Tekrar giriş yap.',
  reauthentication_needed: 'Güvenlik için tekrar giriş yapman gerekiyor.',
};

export function authErrorMessage(error: AuthError): string {
  if (isAuthRetryableFetchError(error)) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  }
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  // Eski sunucu sürümleri kod göndermeyebilir; bilinen mesajlara bak.
  const text = error.message.toLowerCase();
  if (text.includes('invalid login credentials')) return MESSAGES.invalid_credentials;
  if (text.includes('already registered')) return MESSAGES.user_already_exists;
  if (text.includes('rate limit')) return MESSAGES.over_request_rate_limit;
  if (text.includes('network') || text.includes('fetch')) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  }
  return 'Bir sorun oluştu. Lütfen tekrar dene.';
}
