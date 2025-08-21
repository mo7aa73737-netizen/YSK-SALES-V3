// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class YSKProductsApp {
    constructor() {
        this.app = null;
        this.db = null;
        this.products = [];
        this.filteredProducts = [];
        this.scanRequestListener = null;
        this.html5QrCode = null;
        this.isScanning = false;
        
        // Load settings from localStorage
        this.settings = JSON.parse(localStorage.getItem('ysk_firebase_settings') || '{}');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.initFirebase();
    }

    setupEventListeners() {
        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettings());
        document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('testConnectionBtn').addEventListener('click', () => this.testConnection());
        
        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterProducts(e.target.value));
        
        // Scanner
        document.getElementById('closeScannerBtn').addEventListener('click', () => this.closeScanner());
        
        // Close modals on outside click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.hideSettings();
        });
    }

    loadSettings() {
        document.getElementById('apiKeyInput').value = this.settings.apiKey || '';
        document.getElementById('authDomainInput').value = this.settings.authDomain || '';
        document.getElementById('projectIdInput').value = this.settings.projectId || '';
        document.getElementById('prefixInput').value = this.settings.prefix || 'pos';
    }

    async initFirebase() {
        if (!this.settings.apiKey || !this.settings.projectId) {
            this.updateConnectionStatus('disconnected', 'يرجى إعداد Firebase');
            return;
        }

        try {
            const firebaseConfig = {
                apiKey: this.settings.apiKey,
                authDomain: this.settings.authDomain,
                projectId: this.settings.projectId,
            };

            this.app = initializeApp(firebaseConfig, 'ysk-products');
            this.db = getFirestore(this.app);
            
            this.updateConnectionStatus('connected', 'متصل');
            await this.loadProducts();
            this.setupScanRequestListener();
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            this.updateConnectionStatus('disconnected', 'خطأ في الاتصال');
            this.showToast('فشل في الاتصال بـ Firebase', 'error');
        }
    }

    async loadProducts() {
        if (!this.db) return;

        try {
            this.showLoading(true);
            const prefix = this.settings.prefix || 'pos';
            const productsRef = collection(this.db, `${prefix}_products`);
            const snapshot = await getDocs(productsRef);
            
            this.products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filteredProducts = [...this.products];
            this.renderProducts();
            this.updateStats();
            this.showLoading(false);
            
            this.showToast(`تم تحميل ${this.products.length} منتج`, 'success');
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showLoading(false);
            this.showToast('فشل في تحميل المنتجات', 'error');
        }
    }

    setupScanRequestListener() {
        if (!this.db) return;

        const scannerSessionRef = doc(this.db, 'scannerSessions', 'fixed');
        
        this.scanRequestListener = onSnapshot(scannerSessionRef, (doc) => {
            const data = doc.data();
            if (data && data.status === 'scanRequested') {
                console.log('Scan request received');
                this.updateConnectionStatus('scanning', 'طلب مسح');
                this.openScanner();
                this.showToast('تم استلام طلب مسح من النظام الرئيسي');
            }
        });
    }

    filterProducts(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredProducts = [...this.products];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredProducts = this.products.filter(product => 
                product.name?.toLowerCase().includes(term) ||
                product.barcode?.includes(searchTerm) ||
                product.supplier?.toLowerCase().includes(term)
            );
        }
        this.renderProducts();
    }

    renderProducts() {
        const grid = document.getElementById('productsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.filteredProducts.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        grid.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 truncate">${product.name || 'بدون اسم'}</h3>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStockStatusClass(product.quantity)}">
                            ${this.getStockStatusText(product.quantity)}
                        </span>
                    </div>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                        <div class="flex justify-between">
                            <span>الباركود:</span>
                            <span class="font-mono">${product.barcode || 'غير محدد'}</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span>السعر:</span>
                            <span class="font-semibold text-green-600">${(product.price || 0).toFixed(2)} ج.م</span>
                        </div>
                        
                        <div class="flex justify-between">
                            <span>الكمية:</span>
                            <span class="font-semibold ${product.quantity < 10 ? 'text-red-600' : 'text-gray-900'}">${product.quantity || 0} ${product.unit?.name || ''}</span>
                        </div>
                        
                        ${product.supplier ? `
                        <div class="flex justify-between">
                            <span>المورد:</span>
                            <span>${product.supplier}</span>
                        </div>
                        ` : ''}
                        
                        ${product.expiryDate ? `
                        <div class="flex justify-between">
                            <span>تاريخ الانتهاء:</span>
                            <span class="${this.isExpiringSoon(product.expiryDate) ? 'text-red-600' : 'text-gray-600'}">${product.expiryDate}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.products.length;
        const available = this.products.filter(p => (p.quantity || 0) > 0).length;
        const lowStock = this.products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) < 10).length;
        const outOfStock = this.products.filter(p => (p.quantity || 0) === 0).length;
        
        document.getElementById('totalProducts').textContent = total;
        document.getElementById('availableProducts').textContent = available;
        document.getElementById('lowStockProducts').textContent = lowStock;
        document.getElementById('outOfStockProducts').textContent = outOfStock;
    }

    getStockStatusClass(quantity) {
        if (!quantity || quantity === 0) return 'bg-red-100 text-red-800';
        if (quantity < 10) return 'bg-yellow-100 text-yellow-800';
        return 'bg-green-100 text-green-800';
    }

    getStockStatusText(quantity) {
        if (!quantity || quantity === 0) return 'غير متوفر';
        if (quantity < 10) return 'مخزون منخفض';
        return 'متوفر';
    }

    isExpiringSoon(expiryDate) {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const today = new Date();
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    }

    async openScanner() {
        const overlay = document.getElementById('scannerOverlay');
        overlay.classList.add('active');
        
        try {
            if (!this.html5QrCode) {
                this.html5QrCode = new Html5Qrcode("reader");
            }
            
            await this.html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => this.onScanSuccess(decodedText),
                (errorMessage) => {
                    // Handle scan errors silently
                }
            );
            
            this.isScanning = true;
            document.getElementById('scannerMessage').textContent = 'وجه الكاميرا نحو الباركود';
            
        } catch (error) {
            console.error('Scanner error:', error);
            document.getElementById('scannerMessage').textContent = 'فشل في تشغيل ال��اميرا';
            this.showToast('فشل في تشغيل الكاميرا', 'error');
        }
    }

    async closeScanner() {
        if (this.html5QrCode && this.isScanning) {
            try {
                await this.html5QrCode.stop();
                this.isScanning = false;
            } catch (error) {
                console.error('Error stopping scanner:', error);
            }
        }
        
        document.getElementById('scannerOverlay').classList.remove('active');
        this.updateConnectionStatus('connected', 'متصل');
    }

    async onScanSuccess(decodedText) {
        console.log('Barcode scanned:', decodedText);
        
        // Find product by barcode
        const product = this.products.find(p => p.barcode === decodedText);
        
        // Send result back to main system
        if (this.db) {
            try {
                await setDoc(doc(this.db, 'scannerSessions', 'fixed'), {
                    status: 'scanned',
                    scannedValue: decodedText,
                    scannedAt: new Date(),
                    product: product || null
                }, { merge: true });
                
                console.log('Scan result sent to main system');
            } catch (error) {
                console.error('Error sending scan result:', error);
            }
        }
        
        // Show result to user
        if (product) {
            this.showToast(`تم العثور على: ${product.name}`, 'success');
            document.getElementById('scannerMessage').textContent = `تم العثور على: ${product.name}`;
            
            // Highlight the product in search
            document.getElementById('searchInput').value = decodedText;
            this.filterProducts(decodedText);
        } else {
            this.showToast('تم إرسال الباركود للنظام الرئيسي', 'info');
            document.getElementById('scannerMessage').textContent = `تم مسح: ${decodedText}`;
        }
        
        // Close scanner after 2 seconds
        setTimeout(() => {
            this.closeScanner();
        }, 2000);
    }

    showSettings() {
        document.getElementById('settingsModal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.add('hidden');
    }

    async saveSettings() {
        const settings = {
            apiKey: document.getElementById('apiKeyInput').value.trim(),
            authDomain: document.getElementById('authDomainInput').value.trim(),
            projectId: document.getElementById('projectIdInput').value.trim(),
            prefix: document.getElementById('prefixInput').value.trim() || 'pos'
        };
        
        if (!settings.apiKey || !settings.projectId) {
            this.showToast('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        this.settings = settings;
        localStorage.setItem('ysk_firebase_settings', JSON.stringify(settings));
        
        this.hideSettings();
        this.showToast('تم حفظ الإعدادات', 'success');
        
        // Reinitialize Firebase with new settings
        await this.initFirebase();
    }

    async testConnection() {
        const statusDiv = document.getElementById('connectionStatus');
        statusDiv.innerHTML = '<div class="text-blue-600">جاري اختبار الاتصال...</div>';
        
        try {
            const tempSettings = {
                apiKey: document.getElementById('apiKeyInput').value.trim(),
                authDomain: document.getElementById('authDomainInput').value.trim(),
                projectId: document.getElementById('projectIdInput').value.trim(),
                prefix: document.getElementById('prefixInput').value.trim() || 'pos'
            };
            
            if (!tempSettings.apiKey || !tempSettings.projectId) {
                statusDiv.innerHTML = '<div class="text-red-600">يرجى ملء جميع الحقول المطلوبة</div>';
                return;
            }
            
            const testApp = initializeApp({
                apiKey: tempSettings.apiKey,
                authDomain: tempSettings.authDomain,
                projectId: tempSettings.projectId,
            }, 'test-connection');
            
            const testDb = getFirestore(testApp);
            const testRef = collection(testDb, `${tempSettings.prefix}_products`);
            await getDocs(testRef);
            
            statusDiv.innerHTML = '<div class="text-green-600">✅ الاتصال ناجح</div>';
            
        } catch (error) {
            console.error('Connection test failed:', error);
            statusDiv.innerHTML = '<div class="text-red-600">❌ فشل الاتصال</div>';
        }
    }

    updateConnectionStatus(status, text) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        
        statusDot.className = `status-dot status-${status}`;
        statusText.textContent = text;
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const productsGrid = document.getElementById('productsGrid');
        
        if (show) {
            loadingState.classList.remove('hidden');
            productsGrid.classList.add('hidden');
        } else {
            loadingState.classList.add('hidden');
            productsGrid.classList.remove('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        }[type] || 'bg-gray-500';
        
        toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new YSKProductsApp();
});