const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Anahtar veritabanını okuyan fonksiyon
function getKeysDB() {
    try {
        const data = fs.readFileSync('keys.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error("HATA: keys.json dosyası okunamadı!", error);
        return { keys: {} }; // Hata durumunda boş bir veritabanı döndür
    }
}

// Anahtar veritabanını kaydeden fonksiyon
function saveKeysDB(data) {
    fs.writeFileSync('keys.json', JSON.stringify(data, null, 2));
}

// Botların lisans anahtarını doğrulamak için kullanacağı adres (endpoint)
app.get('/validate/:key', (req, res) => {
    const userKey = req.params.key;
    const db = getKeysDB();

    console.log(`Doğrulama isteği geldi: ${userKey}`);

    // Anahtar veritabanında var mı?
    if (db.keys && db.keys[userKey]) {
        // Anahtar daha önce kullanılmış mı?
        if (db.keys[userKey].used) {
            return res.status(403).json({ success: false, message: 'Bu lisans anahtarı daha önce kullanılmış.' });
        } else {
            // Anahtar geçerli! Kullanıldı olarak işaretle ve kaydet.
            db.keys[userKey].used = true;
            saveKeysDB(db);
            return res.json({ success: true, message: 'Lisans doğrulandı.' });
        }
    } else {
        // Anahtar veritabanında hiç yoksa.
        return res.status(404).json({ success: false, message: 'Geçersiz lisans anahtarı.' });
    }
});

app.listen(PORT, () => {
    console.log(`Lisans sunucusu ${PORT} portunda çalışıyor...`);
});