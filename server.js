const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const axios = require('axios');

// .env dosyasındaki değişkenleri yükle
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// CORS ayarı: Mobil uygulamamızın backend'e erişebilmesi için gerekli
app.use(cors()); 

// JSON body parser
app.use(express.json());

// GitHub OAuth Bilgileri
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;


// --- 🚀 API Uç Noktası: GitHub ile Giriş (OAuth Akışı) ---

/**
 * Endpoint: POST /api/auth/github
 * Amaç: Mobil uygulamadan gelen GitHub yetkilendirme kodunu kullanarak 
 * erişim jetonunu (Access Token) ve ardından kullanıcı bilgilerini almak.
 * Gerekli Parametre: code (Mobil uygulamadan GitHub'a yönlendirme sonrası gelen kod)
 */
app.post('/api/auth/github', async (req, res) => {
    // 1. Yetkilendirme Kodunu Mobil Uygulamadan Al
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({ message: 'GitHub yetkilendirme kodu eksik.' });
    }

    try {
        // 2. GitHub'dan Erişim Jetonu (Access Token) Talep Et
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code,
            },
            {
                // Yanıtın JSON formatında gelmesini istiyoruz
                headers: { Accept: 'application/json' }, 
            }
        );

        const { access_token } = tokenResponse.data;

        if (!access_token) {
             console.error('Access Token alınamadı:', tokenResponse.data);
             return res.status(500).json({ message: 'GitHub yetkilendirmesi başarısız oldu.' });
        }

        // 3. Erişim Jetonu ile Kullanıcı Profilini Çek
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${access_token}`,
            },
        });

        const githubUser = userResponse.data;
        
        // 4. Veritabanı İşlemi (Şimdilik Atlandı)
        // Burada:
        // * `githubUser.id` ile veritabanında kullanıcıyı ara.
        // * Kullanıcı varsa oturum aç (JWT token oluştur).
        // * Kullanıcı yoksa yeni kayıt oluştur.
        
        console.log(`Giriş Başarılı: Kullanıcı ID - ${githubUser.id}, Kullanıcı Adı - ${githubUser.login}`);

        // Mobil uygulamaya gönderilecek basit yanıt (Gerçek projede JWT token gönderilir)
        res.json({ 
            success: true, 
            message: 'Giriş başarılı',
            user: {
                id: githubUser.id,
                username: githubUser.login,
                name: githubUser.name,
                avatar_url: githubUser.avatar_url
            }
        });

    } catch (error) {
        console.error('GitHub giriş hatası:', error.message);
        res.status(500).json({ message: 'Sunucu hatası. GitHub ile iletişim kurulamadı.' });
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`🚀 Arka Uç Sunucusu http://localhost:${PORT} adresinde çalışıyor...`);
});

// Önemli Not: Bu kodda veritabanı işlemleri (kullanıcı kaydetme/bulma) atlanmıştır.
// Bir sonraki adımda isterseniz veritabanı entegrasyonuna geçebiliriz.
