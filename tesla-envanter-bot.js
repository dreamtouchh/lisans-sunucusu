// Tesla Envanter Botu - Chrome Console için
// Kullanım: Chrome'da Tesla envanter sayfasını açın ve bu kodu console'a yapıştırın

class TeslaEnvanterBot {
    constructor() {
        this.isRunning = false;
        this.interval = null;
        this.checkCount = 0;
        
        // Kullanıcı bilgileri - Buraya kendi bilgilerinizi yazın
        this.userInfo = {
            firstName: "Adınız",
            lastName: "Soyadınız", 
            email: "email@example.com",
            phone: "+905551234567",
            // Aranacak araç kriterleri
            targetModels: ["Model 3", "Model Y", "Model S", "Model X"], // İstediğiniz modeller
            maxPrice: 1000000, // Maksimum fiyat (TL)
            preferredColors: ["Pearl White", "Solid Black", "Midnight Silver"], // Tercih edilen renkler
            location: "Istanbul" // Lokasyon tercihi
        };
        
        this.log("Tesla Envanter Botu hazır!");
        this.log("Konfigürasyonunuzu kontrol edin:");
        console.table(this.userInfo);
    }
    
    log(message) {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.log(`[${timestamp}] Tesla Bot: ${message}`);
    }
    
    error(message) {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        console.error(`[${timestamp}] Tesla Bot Error: ${message}`);
    }
    
    // Sayfadaki araç kartlarını bul
    findVehicleCards() {
        // Tesla'nın farklı selector'larını dene
        const selectors = [
            '[data-testid="inventory-card"]',
            '.inventory-card',
            '[class*="inventory"]',
            '[class*="vehicle-card"]',
            '.result-card',
            '[data-cy="inventory-card"]'
        ];
        
        for (let selector of selectors) {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
                this.log(`${cards.length} araç kartı bulundu (${selector})`);
                return Array.from(cards);
            }
        }
        
        // Genel araç kartı arama
        const allDivs = document.querySelectorAll('div');
        const vehicleCards = Array.from(allDivs).filter(div => {
            const text = div.textContent.toLowerCase();
            return (text.includes('model 3') || text.includes('model y') || 
                   text.includes('model s') || text.includes('model x')) &&
                   (text.includes('₺') || text.includes('tl') || text.includes('price'));
        });
        
        return vehicleCards;
    }
    
    // Araç bilgilerini çıkar
    extractVehicleInfo(card) {
        const info = {
            model: null,
            price: null,
            color: null,
            year: null,
            location: null,
            element: card
        };
        
        const text = card.textContent;
        
        // Model tespiti
        this.userInfo.targetModels.forEach(model => {
            if (text.toLowerCase().includes(model.toLowerCase())) {
                info.model = model;
            }
        });
        
        // Fiyat tespiti
        const priceMatch = text.match(/₺?([\d,\.]+)\s*(?:₺|TL)/i);
        if (priceMatch) {
            info.price = parseInt(priceMatch[1].replace(/[,\.]/g, ''));
        }
        
        // Renk tespiti
        this.userInfo.preferredColors.forEach(color => {
            if (text.toLowerCase().includes(color.toLowerCase())) {
                info.color = color;
            }
        });
        
        // Yıl tespiti
        const yearMatch = text.match(/20\d{2}/);
        if (yearMatch) {
            info.year = parseInt(yearMatch[0]);
        }
        
        return info;
    }
    
    // Aracın kriterlere uygun olup olmadığını kontrol et
    isVehicleMatch(vehicleInfo) {
        // Model kontrolü
        if (!vehicleInfo.model || !this.userInfo.targetModels.includes(vehicleInfo.model)) {
            return false;
        }
        
        // Fiyat kontrolü
        if (vehicleInfo.price && vehicleInfo.price > this.userInfo.maxPrice) {
            return false;
        }
        
        return true;
    }
    
    // Rezervasyon butonunu bul ve tıkla
    async makeReservation(vehicleCard) {
        this.log("🎯 Uygun araç bulundu! Rezervasyon yapılıyor...");
        
        // Rezervasyon/Sipariş butonlarını ara
        const buttonSelectors = [
            'button[data-testid="order-button"]',
            'button[data-testid="reserve-button"]', 
            'button:contains("Order Now")',
            'button:contains("Reserve")',
            'button:contains("Sipariş")',
            'button:contains("Rezerve")',
            '[data-cy="order-button"]',
            '.order-button',
            '.reserve-button'
        ];
        
        let orderButton = null;
        
        // Önce kart içinde ara
        for (let selector of buttonSelectors) {
            orderButton = vehicleCard.querySelector(selector);
            if (orderButton) break;
        }
        
        // Kart içinde bulamazsa genel sayfada ara
        if (!orderButton) {
            for (let selector of buttonSelectors) {
                orderButton = document.querySelector(selector);
                if (orderButton) break;
            }
        }
        
        if (orderButton && orderButton.style.display !== 'none') {
            this.log("🔥 Rezervasyon butonu bulundu, tıklanıyor...");
            orderButton.click();
            
            // Biraz bekle ve form doldur
            setTimeout(() => this.fillReservationForm(), 2000);
            return true;
        } else {
            this.log("❌ Rezervasyon butonu bulunamadı");
            return false;
        }
    }
    
    // Rezervasyon formunu doldur
    async fillReservationForm() {
        this.log("📝 Rezervasyon formu dolduruluyor...");
        
        // Form alanlarını bul ve doldur
        const fields = {
            'input[name="firstName"]': this.userInfo.firstName,
            'input[name="first_name"]': this.userInfo.firstName,
            'input[id*="first"]': this.userInfo.firstName,
            
            'input[name="lastName"]': this.userInfo.lastName,
            'input[name="last_name"]': this.userInfo.lastName,
            'input[id*="last"]': this.userInfo.lastName,
            
            'input[name="email"]': this.userInfo.email,
            'input[type="email"]': this.userInfo.email,
            'input[id*="email"]': this.userInfo.email,
            
            'input[name="phone"]': this.userInfo.phone,
            'input[type="tel"]': this.userInfo.phone,
            'input[id*="phone"]': this.userInfo.phone
        };
        
        for (let [selector, value] of Object.entries(fields)) {
            const field = document.querySelector(selector);
            if (field && field.style.display !== 'none') {
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
                this.log(`✅ ${selector} alanı dolduruldu`);
            }
        }
        
        // Submit butonu ara ve tıkla
        setTimeout(() => {
            const submitButton = document.querySelector(
                'button[type="submit"], ' +
                'button:contains("Continue"), ' +
                'button:contains("Devam"), ' +
                'button:contains("Submit"), ' +
                '.submit-button'
            );
            
            if (submitButton) {
                this.log("🚀 Form gönderiliyor...");
                submitButton.click();
            }
        }, 1000);
    }
    
    // Ana kontrol fonksiyonu
    async checkInventory() {
        try {
            this.checkCount++;
            this.log(`Kontrol #${this.checkCount} - Araçlar taranıyor...`);
            
            const vehicleCards = this.findVehicleCards();
            
            if (vehicleCards.length === 0) {
                this.log("⚠️ Araç kartı bulunamadı, sayfa yapısı değişmiş olabilir");
                return;
            }
            
            let foundMatch = false;
            
            for (let card of vehicleCards) {
                const vehicleInfo = this.extractVehicleInfo(card);
                
                if (this.isVehicleMatch(vehicleInfo)) {
                    this.log("🎉 UYGUN ARAÇ BULUNDU!");
                    console.table(vehicleInfo);
                    
                    // Ses çıkar (tarayıcı izin verirse)
                    try {
                        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+Dtt2gfBjm');
                        audio.play();
                    } catch(e) {}
                    
                    foundMatch = true;
                    const success = await this.makeReservation(card);
                    
                    if (success) {
                        this.log("✅ Rezervasyon işlemi başlatıldı!");
                        this.stop(); // Başarılı rezervasyon sonrası dur
                        return;
                    }
                    break;
                }
            }
            
            if (!foundMatch) {
                this.log(`📊 ${vehicleCards.length} araç tarandı, uygun araç bulunamadı`);
            }
            
        } catch (error) {
            this.error(`Kontrol sırasında hata: ${error.message}`);
        }
    }
    
    // Botu başlat
    start() {
        if (this.isRunning) {
            this.log("Bot zaten çalışıyor!");
            return;
        }
        
        this.isRunning = true;
        this.log("🚀 Tesla Envanter Botu başlatıldı!");
        this.log("5 saniyede bir kontrol edilecek...");
        
        // İlk kontrol
        this.checkInventory();
        
        // 5 saniyede bir kontrol et
        this.interval = setInterval(() => {
            this.checkInventory();
        }, 5000);
    }
    
    // Botu durdur
    stop() {
        if (!this.isRunning) {
            this.log("Bot zaten durmuş!");
            return;
        }
        
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        this.log("🛑 Tesla Envanter Botu durduruldu!");
    }
    
    // Durumu göster
    status() {
        this.log(`Bot durumu: ${this.isRunning ? 'Çalışıyor' : 'Durmuş'}`);
        this.log(`Toplam kontrol sayısı: ${this.checkCount}`);
        console.table(this.userInfo);
    }
    
    // Konfigürasyonu güncelle
    updateConfig(newConfig) {
        Object.assign(this.userInfo, newConfig);
        this.log("Konfigürasyon güncellendi:");
        console.table(this.userInfo);
    }
}

// Global bot instance oluştur
window.teslaBot = new TeslaEnvanterBot();

// Kullanım kılavuzu
console.log(`
🚗 TESLA ENVANTER BOTU - KULLANIM KILAVUZU
==========================================

1. HAZIRLIK:
   - Tesla envanter sayfasını açın
   - Bilgilerinizi güncelleyin: teslaBot.updateConfig({firstName: "Adınız", email: "email@example.com"})

2. KOMUTLAR:
   teslaBot.start()     - Botu başlat
   teslaBot.stop()      - Botu durdur  
   teslaBot.status()    - Durum bilgisi
   teslaBot.updateConfig({...}) - Ayarları güncelle

3. ÖRNEK KULLANIM:
   teslaBot.updateConfig({
     firstName: "Ahmet",
     lastName: "Yılmaz", 
     email: "ahmet@example.com",
     phone: "+905551234567",
     targetModels: ["Model Y"],
     maxPrice: 800000,
     preferredColors: ["Pearl White"]
   });
   teslaBot.start();

4. NOT:
   - Bot 5 saniyede bir kontrol eder
   - Uygun araç bulunca otomatik rezerve eder
   - Sayfa yapısı değişirse selektörleri güncellemek gerekebilir

Başlamak için: teslaBot.start()
`);