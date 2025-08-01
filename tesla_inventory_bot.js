// Tesla Envanter Botu - Chrome Console'da Çalıştırın
// Bu bot 5 saniyede bir envanter kontrolü yapar ve araç bulduğunda otomatik rezerve eder

class TeslaInventoryBot {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkInterval = 5000; // 5 saniye
        this.userInfo = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            zipCode: ''
        };
        
        console.log('🚗 Tesla Envanter Botu hazır!');
        console.log('Kullanım: bot.setUserInfo({firstName: "Ad", lastName: "Soyad", email: "email@domain.com", phone: "5551234567", zipCode: "34000"})');
        console.log('Başlatmak için: bot.start()');
        console.log('Durdurmak için: bot.stop()');
    }
    
    // Kullanıcı bilgilerini ayarla
    setUserInfo(info) {
        this.userInfo = { ...this.userInfo, ...info };
        console.log('✅ Kullanıcı bilgileri güncellendi:', this.userInfo);
        
        // Eksik bilgileri kontrol et
        const required = ['firstName', 'lastName', 'email', 'phone', 'zipCode'];
        const missing = required.filter(field => !this.userInfo[field]);
        
        if (missing.length > 0) {
            console.warn('⚠️ Eksik bilgiler:', missing.join(', '));
            return false;
        }
        return true;
    }
    
    // Sayfayı yenile (sayfa yenilenmeden AJAX ile)
    async refreshInventory() {
        try {
            console.log('🔄 Envanter kontrol ediliyor...');
            
            // Tesla'nın envanter API'sine istek gönder
            const currentUrl = window.location.href;
            const response = await fetch(currentUrl, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (response.ok) {
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                return this.checkForAvailableVehicles(doc);
            }
            
        } catch (error) {
            console.error('❌ Envanter kontrolü hatası:', error);
            return false;
        }
    }
    
    // Mevcut araçları kontrol et
    checkForAvailableVehicles(doc = document) {
        // Tesla envanter sayfasındaki araç kartlarını bul
        const vehicleCards = doc.querySelectorAll('[data-testid="inventory-card"], .result-item, .vehicle-card');
        
        if (vehicleCards.length === 0) {
            // Alternatif selektörler dene
            const altSelectors = [
                '.inventory-results .result',
                '[class*="inventory"] [class*="card"]',
                '[class*="vehicle"] [class*="card"]',
                '.tds-grid-item',
                '[data-vehicle-id]'
            ];
            
            for (const selector of altSelectors) {
                const elements = doc.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`📋 ${elements.length} araç bulundu (${selector})`);
                    return this.processVehicles(Array.from(elements));
                }
            }
            
            console.log('📭 Hiç araç bulunamadı');
            return false;
        }
        
        console.log(`📋 ${vehicleCards.length} araç bulundu`);
        return this.processVehicles(Array.from(vehicleCards));
    }
    
    // Araçları işle ve rezerve et
    processVehicles(vehicles) {
        let foundAvailable = false;
        
        vehicles.forEach((vehicle, index) => {
            const orderButton = vehicle.querySelector('button[data-testid="order-cta"], button[class*="order"], button[class*="reserve"], a[href*="order"]');
            const unavailableIndicator = vehicle.querySelector('[class*="unavailable"], [class*="sold"], [data-testid="unavailable"]');
            
            if (orderButton && !unavailableIndicator) {
                console.log(`🎯 Müsait araç bulundu! (${index + 1})`);
                
                // Araç detaylarını logla
                const modelInfo = vehicle.querySelector('[data-testid="model-name"], .model-name, h3, h4');
                const priceInfo = vehicle.querySelector('[data-testid="price"], .price, [class*="price"]');
                
                if (modelInfo) console.log(`🚗 Model: ${modelInfo.textContent.trim()}`);
                if (priceInfo) console.log(`💰 Fiyat: ${priceInfo.textContent.trim()}`);
                
                // Rezervasyon işlemini başlat
                setTimeout(() => this.attemptReservation(orderButton), 1000 + (index * 500));
                foundAvailable = true;
            }
        });
        
        return foundAvailable;
    }
    
    // Rezervasyon yapmayı dene
    async attemptReservation(orderButton) {
        try {
            console.log('🎯 Rezervasyon işlemi başlatılıyor...');
            
            // Order butonuna tıkla
            orderButton.click();
            
            // Kısa bekle ve form doldurma işlemini başlat
            setTimeout(() => this.fillReservationForm(), 2000);
            
        } catch (error) {
            console.error('❌ Rezervasyon hatası:', error);
        }
    }
    
    // Rezervasyon formunu doldur
    async fillReservationForm() {
        try {
            console.log('📝 Form doldurma işlemi başlatılıyor...');
            
            // Formu bulmak için farklı selektörler dene
            const formSelectors = [
                'form[data-testid="checkout-form"]',
                'form[class*="order"]',
                'form[class*="reservation"]',
                'form',
                '[data-testid="personal-info"]'
            ];
            
            let form = null;
            for (const selector of formSelectors) {
                form = document.querySelector(selector);
                if (form) break;
            }
            
            if (!form) {
                console.log('⏳ Form yüklenmesi bekleniyor...');
                setTimeout(() => this.fillReservationForm(), 2000);
                return;
            }
            
            // Form alanlarını doldur
            await this.fillFormFields(form);
            
        } catch (error) {
            console.error('❌ Form doldurma hatası:', error);
        }
    }
    
    // Form alanlarını doldur
    async fillFormFields(form) {
        const fieldMappings = [
            { selectors: ['input[name*="firstName"], input[data-testid*="first"], input[placeholder*="Ad"], input[placeholder*="First"]'], value: this.userInfo.firstName },
            { selectors: ['input[name*="lastName"], input[data-testid*="last"], input[placeholder*="Soyad"], input[placeholder*="Last"]'], value: this.userInfo.lastName },
            { selectors: ['input[type="email"], input[name*="email"], input[data-testid*="email"]'], value: this.userInfo.email },
            { selectors: ['input[type="tel"], input[name*="phone"], input[data-testid*="phone"], input[placeholder*="Telefon"]'], value: this.userInfo.phone },
            { selectors: ['input[name*="zip"], input[name*="postal"], input[data-testid*="zip"]'], value: this.userInfo.zipCode }
        ];
        
        for (const mapping of fieldMappings) {
            for (const selector of mapping.selectors) {
                const field = form.querySelector(selector);
                if (field && mapping.value) {
                    field.value = mapping.value;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ ${selector} alanı dolduruldu`);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    break;
                }
            }
        }
        
        // Submit butonunu bul ve tıkla
        const submitButton = form.querySelector('button[type="submit"], button[data-testid*="submit"], button[class*="submit"], input[type="submit"]');
        if (submitButton && !submitButton.disabled) {
            console.log('🚀 Rezervasyon gönderiliyor...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            submitButton.click();
            
            // Başarı mesajını kontrol et
            setTimeout(() => this.checkReservationSuccess(), 3000);
        } else {
            console.log('⚠️ Submit butonu bulunamadı veya deaktif');
        }
    }
    
    // Rezervasyon başarısını kontrol et
    checkReservationSuccess() {
        const successIndicators = [
            'Rezervasyon',
            'Başarılı',
            'Success',
            'Confirmed',
            'Thank you',
            'Teşekkür'
        ];
        
        const pageText = document.body.innerText;
        const isSuccess = successIndicators.some(indicator => 
            pageText.toLowerCase().includes(indicator.toLowerCase())
        );
        
        if (isSuccess) {
            console.log('🎉 RESERVASYON BAŞARILI! Bot durduruluyor...');
            this.stop();
            
            // Ses çıkar (eğer mümkünse)
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaAz2O1+7Rfz8NI3nM9Qg=');
                audio.play();
            } catch (e) {}
            
        } else {
            console.log('⏳ Rezervasyon durumu kontrol ediliyor...');
        }
    }
    
    // Botu başlat
    start() {
        if (this.isRunning) {
            console.log('⚠️ Bot zaten çalışıyor!');
            return;
        }
        
        // Kullanıcı bilgilerini kontrol et
        const required = ['firstName', 'lastName', 'email', 'phone', 'zipCode'];
        const missing = required.filter(field => !this.userInfo[field]);
        
        if (missing.length > 0) {
            console.error('❌ Eksik kullanıcı bilgileri:', missing.join(', '));
            console.log('Önce setUserInfo() ile bilgilerinizi girin!');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Tesla Envanter Botu başlatıldı!');
        console.log(`⏰ Her ${this.checkInterval / 1000} saniyede bir kontrol edilecek`);
        
        // İlk kontrolü hemen yap
        this.checkForAvailableVehicles();
        
        // Belirli aralıklarla kontrol et
        this.intervalId = setInterval(() => {
            if (this.isRunning) {
                this.refreshInventory();
            }
        }, this.checkInterval);
    }
    
    // Botu durdur
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ Bot zaten durmuş!');
            return;
        }
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        console.log('🛑 Tesla Envanter Botu durduruldu!');
    }
    
    // Bot durumunu göster
    status() {
        console.log('📊 Bot Durumu:');
        console.log('Çalışıyor:', this.isRunning ? '✅' : '❌');
        console.log('Kontrol Aralığı:', `${this.checkInterval / 1000} saniye`);
        console.log('Kullanıcı Bilgileri:', this.userInfo);
    }
    
    // Kontrol aralığını değiştir
    setInterval(seconds) {
        this.checkInterval = seconds * 1000;
        console.log(`⏰ Kontrol aralığı ${seconds} saniye olarak ayarlandı`);
        
        if (this.isRunning) {
            this.stop();
            setTimeout(() => this.start(), 1000);
        }
    }
}

// Global bot instance oluştur
window.teslaBot = new TeslaInventoryBot();

// Kısayol tanımla
window.bot = window.teslaBot;

// Kullanım talimatlarını göster
console.log(`
🚗 TESLA ENVANTER BOTU KULLANIM REHBERİ
=====================================

1️⃣ KULLANICI BİLGİLERİNİ GİRİN:
bot.setUserInfo({
    firstName: "Adınız",
    lastName: "Soyadınız", 
    email: "email@domain.com",
    phone: "5551234567",
    zipCode: "34000"
});

2️⃣ BOTU BAŞLATIN:
bot.start()

3️⃣ BOTU DURDURUN:
bot.stop()

4️⃣ DİĞER KOMUTLAR:
bot.status()              // Bot durumunu göster
bot.setInterval(10)       // Kontrol aralığını 10 saniye yap

⚠️  ÖNEMLİ NOTLAR:
- Bu bot Tesla'nın resmi sitesinde kullanılmalıdır
- Envanter sayfasında çalıştırın
- Bot araç bulduğunda otomatik rezerve edecektir
- İnternet bağlantınızın stabil olduğundan emin olun

🎯 BOT HAZIR! Yukarıdaki adımları takip edin.
`);