const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

// ===================================================================
// --- SUPABASE BAĞLANTI BİLGİLERİ ---
// Bu bilgileri Supabase.com -> Project Settings -> API sekmesinden alacaksın
// ===================================================================
const supabaseUrl = 'https://slvvitstysyxkjzwasyt.supabase.co'; //https://slvvitstysyxkjzwasyt.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdnZpdHN0eXN5eGtqendhc3l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MjkwNDcsImV4cCI6MjA2OTUwNTA0N30.VsPwTRYrdTelH_nnUvqPLWOyVKyjG2uyHxm8WwlRk0E'; // Örnek: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// ===================================================================

const supabase = createClient(supabaseUrl, supabaseKey);

// Lisans anahtarını doğrulayan endpoint
app.get('/validate/:key', async (req, res) => {
    const userKey = req.params.key;
    console.log(`Veritabanında doğrulama isteği geldi: ${userKey}`);

    try {
        // 1. Anahtar veritabanında var mı diye kontrol et
        let { data: keyData, error: selectError } = await supabase
            .from('keys') // Tablomuzun adı 'keys'
            .select('*')
            .eq('key_text', userKey) // 'key_text' sütununda gelen anahtarı ara
            .single(); // Sadece bir sonuç beklediğimizi belirtir

        if (selectError || !keyData) {
            console.log('Geçersiz anahtar:', userKey);
            return res.status(404).json({ success: false, message: 'Geçersiz lisans anahtarı.' });
        }

        // 2. Anahtar daha önce kullanılmış mı diye 'is_used' sütununu kontrol et
        if (keyData.is_used) {
            console.log('Daha önce kullanılmış anahtar:', userKey);
            return res.status(403).json({ success: false, message: 'Bu lisans anahtarı daha önce kullanılmış.' });
        }

        // 3. Anahtar geçerli. "is_used" alanını true olarak güncelle
        const { error: updateError } = await supabase
            .from('keys')
            .update({ is_used: true })
            .eq('key_text', userKey);

        if (updateError) {
            // Güncelleme sırasında bir hata olursa...
            throw updateError;
        }

        console.log('Anahtar başarıyla doğrulandı ve güncellendi:', userKey);
        return res.json({ success: true, message: 'Lisans doğrulandı.' });

    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
    }
});

app.listen(PORT, () => {
    console.log(`Supabase bağlantılı lisans sunucusu ${PORT} portunda çalışıyor...`);
});