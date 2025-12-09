import { InAppBrowser } from 'react-native-inappbrowser-reborn';

// --- AYARLARINIZI GÜNCELLEYİN ---
// ⚠️ DİKKAT: Backend'inizin çalıştığı adresi kullanın
const API_BASE_URL = 'http://192.168.1.10:3000'; // Yerel IP adresinizi kullanın
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID'; // .env'deki ile aynı olmalı

// GitHub'a başarılı giriş sonrası kullanıcıyı yönlendireceği URL şeması
// Bu, projenizin paket adına göre değişir (Örnek: com.derslig.app://oauth)
const REDIRECT_URI = 'com.derslig.app://oauth'; 

/**
 * GitHub OAuth Akışını Başlatır.
 * @returns {Promise<object|null>} Başarılı ise kullanıcı verilerini, aksi halde null döner.
 */
export const signInWithGitHub = async () => {
  const GITHUB_AUTH_URL = 
    `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `scope=user&` + // Hangi izinleri istediğimizi belirtiyoruz (örneğin: kullanıcı bilgisi)
    `redirect_uri=${REDIRECT_URI}`;

  try {
    if (await InAppBrowser.isAvailable()) {
      // 1. In-App Tarayıcıyı Aç ve Kullanıcıyı GitHub'a Yönlendir
      const result = await InAppBrowser.openAuth(GITHUB_AUTH_URL, REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        // 2. Başarılı Yetkilendirme Sonrası Gelen Yetkilendirme Kodunu Al
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const code = urlParams.get('code');

        if (code) {
          // 3. Kodu Arka Uç API'mize Gönder (server.js'deki endpoint)
          const response = await fetch(`${API_BASE_URL}/api/auth/github`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });
          
          const data = await response.json();

          if (data.success) {
            console.log('API\'den Gelen Kullanıcı Bilgisi:', data.user);
            return data.user; // Başarılı giriş ve kullanıcı verisi
          } else {
            console.error('API Giriş Başarısız:', data.message);
            return null;
          }
        }
      }
    }
  } catch (error) {
    console.error('GitHub Giriş Akışı Hatası:', error);
    return null;
  }
};
