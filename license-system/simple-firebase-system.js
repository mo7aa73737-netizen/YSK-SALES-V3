// نظام تراخيص بسيط مع Firebase
// Simple License System with Firebase

class SimpleLicenseSystem {
    constructor() {
        this.masterKey = 'YSK-POS-2024-MASTER-KEY-ULTRA-SECURE-v1.0';
        this.firebaseReady = false;
        
        // انتظار تحميل Firebase
        this.waitForFirebase();
    }

    // انتظار تحميل Firebase
    async waitForFirebase() {
        if (window.firebaseReady && window.advancedFirebaseManager) {
            this.firebaseReady = true;
            this.updateFirebaseStatus(true);
            this.initializeSystem();
            return;
        }

        window.addEventListener('firebaseReady', () => {
            this.firebaseReady = true;
            this.updateFirebaseStatus(true);
            this.initializeSystem();
        });

        setTimeout(() => {
            if (!this.firebaseReady) {
                this.updateFirebaseStatus(false);
                this.initializeSystem();
            }
        }, 10000);
    }

    // تحديث حالة Firebase
    updateFirebaseStatus(connected) {
        const statusDiv = document.getElementById('firebaseStatus');
        if (connected) {
            statusDiv.className = 'mt-6 p-4 rounded-lg glass-card border border-green-400';
            statusDiv.innerHTML = `
                <svg class="w-6 h-6 text-green-400 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-green-400 font-medium">متصل بـ Firebase - النظام جاهز</span>
            `;
        } else {
            statusDiv.className = 'mt-6 p-4 rounded-lg glass-card border border-red-400';
            statusDiv.innerHTML = `
                <svg class="w-6 h-6 text-red-400 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="text-red-400 font-medium">خطأ في الاتصال بـ Firebase</span>
            `;
        }
    }

    // تهيئة النظام
    async initializeSystem() {
        this.initializeEventListeners();
        await this.loadStats();
        await this.loadLicenses();
        
        // إضافة أنماط CSS للتبويبات
        const style = document.createElement('style');
        style.textContent = `
            .active-tab {
                background: rgba(255, 255, 255, 0.2) !important;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .tab-content {
                display: block;
            }
            .tab-content.hidden {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    // تهيئة مستمعي الأحداث
    initializeEventListeners() {
        const form = document.getElementById('licenseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleGenerateLicense();
            });
        }
    }

    // تحميل الإحصائيات
    async loadStats() {
        if (!this.firebaseReady || !window.advancedFirebaseManager) {
            return;
        }

        try {
            const result = await window.advancedFirebaseManager.getStats();
            if (result.success) {
                const stats = result.data;
                
                document.getElementById('totalLicenses').textContent = stats.total;
                document.getElementById('activeLicenses').textContent = stats.active;
                document.getElementById('expiredLicenses').textContent = stats.expired;
                document.getElementById('activatedLicenses').textContent = stats.activated;
                
                document.getElementById('statsSection').classList.remove('hidden');
            }
        } catch (error) {
            console.error('خطأ في تحميل الإحصائيات:', error);
        }
    }

    // تحميل قائمة التراخيص
    async loadLicenses() {
        if (!this.firebaseReady || !window.advancedFirebaseManager) {
            return;
        }

        try {
            const result = await window.advancedFirebaseManager.getAllLicenses();
            if (result.success) {
                this.displayLicenses(result.data);
            }
        } catch (error) {
            console.error('خطأ في تحميل التراخيص:', error);
        }
    }

    // عرض قائمة التراخيص
    displayLicenses(licenses) {
        const tbody = document.getElementById('licensesList');
        
        if (licenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-12 text-white opacity-70 text-xl">لا توجد تراخيص</td></tr>';
            return;
        }

        tbody.innerHTML = licenses.map(license => {
            const createdDate = new Date(license.created || license.timestamp).toLocaleDateString('ar-EG');
            const expiryDate = new Date(license.expires).toLocaleDateString('ar-EG');
            const isExpired = new Date() > new Date(license.expires);
            const isActivated = license.activated;
            
            let statusClass, statusText;
            if (isExpired) {
                statusClass = 'bg-red-500 text-white';
                statusText = 'منتهي';
            } else if (isActivated) {
                statusClass = 'bg-green-500 text-white';
                statusText = 'مفعل';
            } else {
                statusClass = 'bg-yellow-500 text-black';
                statusText = 'غير مفعل';
            }

            return `
                <tr class="border-b border-white border-opacity-20 hover:bg-white hover:bg-opacity-10">
                    <td class="p-3">${createdDate}</td>
                    <td class="p-3 font-medium">${license.customer}</td>
                    <td class="p-3 font-mono text-xs">${license.code}</td>
                    <td class="p-3">${this.getLicenseTypeName(license.type)}</td>
                    <td class="p-3">
                        <span class="px-3 py-1 rounded-full text-sm ${statusClass}">${statusText}</span>
                    </td>
                    <td class="p-3">
                        <button onclick="simpleSystem.deleteLicense('${license.id}')" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm">
                            حذف
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // حذف ترخيص
    async deleteLicense(licenseId) {
        if (!confirm('هل أنت متأكد من حذف هذا الترخيص؟')) {
            return;
        }

        if (!this.firebaseReady || !window.advancedFirebaseManager) {
            alert('Firebase غير متاح');
            return;
        }

        try {
            const result = await window.advancedFirebaseManager.deleteLicense(licenseId);
            if (result.success) {
                alert('تم حذف الترخيص بنجاح');
                await this.loadLicenses();
                await this.loadStats();
            } else {
                alert('فشل في حذف الترخيص: ' + result.error);
            }
        } catch (error) {
            alert('حدث خطأ: ' + error.message);
        }
    }

    // توليد معرف فريد للترخيص
    generateLicenseID() {
        return 'LIC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // تشفير بيانات الترخيص
    encryptLicenseData(data) {
        const jsonData = JSON.stringify(data);
        return CryptoJS.AES.encrypt(jsonData, this.masterKey).toString();
    }

    // توليد كود بسيط بالتنسيق الصحيح YSK-XXXX-XXXX-XXXX-XXXX
    generateSimpleCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const parts = [];
        
        // توليد 4 مجموعات من 4 أحرف/أرقام
        for (let i = 0; i < 4; i++) {
            let part = '';
            for (let j = 0; j < 4; j++) {
                part += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            parts.push(part);
        }
        
        const code = 'YSK-' + parts.join('-');
        console.log('🎯 تم توليد كود بالتنسيق الصحيح:', code);
        console.log('✅ تحقق من التنسيق:', /^YSK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code));
        
        return code;
    }

    // حساب تاريخ الانتهاء
    calculateExpiryDate(licenseType, customExpiry = null, durationDays = 0) {
        if (customExpiry) {
            return new Date(customExpiry);
        }

        // لو تم تحديد عدد أيام يتم استخدامه مباشرة
        if (durationDays && durationDays > 0) {
            const now = new Date();
            return new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        }

        const now = new Date();
        switch (licenseType) {
            case 'trial':
                return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
            case 'standard':
                return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
            case 'premium':
                return new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));
            case 'lifetime':
                return new Date('2099-12-31');
            default:
                return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
        }
    }

    // توليد التوقيع الرقمي
    generateSignature(licenseID, customerName, expiryDate) {
        const data = licenseID + customerName + expiryDate + this.masterKey;
        return CryptoJS.SHA256(data).toString().substring(0, 32);
    }

    // معالجة توليد ترخيص جديد
    async handleGenerateLicense() {
        const generateBtn = document.getElementById('generateBtn');

        if (!this.firebaseReady) {
            alert('Firebase غير متاح. يرجى المحاولة لاحقاً.');
            return;
        }

        const customerData = {
            customerName: document.getElementById('customerName').value,
            customerContact: document.getElementById('customerContact').value,
            customerCompany: document.getElementById('customerCompany')?.value || '',
            customerAddress: document.getElementById('customerAddress')?.value || '',
            licenseType: document.getElementById('licenseType').value,
            customType: document.getElementById('customType')?.value || '',
            durationDays: parseInt(document.getElementById('durationDays')?.value || '0', 10) || 0,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };

        generateBtn.disabled = true;
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<div class="loading mr-2"></div> جاري التوليد والرفع...';

        try {
            const result = await this.generateLicense(customerData);
            this.displayLicenseResult(result);
            
            // تحديث الإحصائيات والقائمة
            await this.loadStats();
            await this.loadLicenses();
            
            // إعادة تعيين النموذج
            document.getElementById('licenseForm').reset();
            
        } catch (error) {
            alert('حدث خطأ في توليد الترخيص: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalText;
        }
    }

    // توليد ترخيص جديد ورفعه إلى Firebase
    async generateLicense(customerData) {
        const licenseID = this.generateLicenseID();
        const createdDate = new Date();
        const expiryDate = this.calculateExpiryDate(customerData.licenseType, customerData.expiryDate, customerData.durationDays);

        const licenseData = {
            id: licenseID,
            customer: {
                name: customerData.customerName,
                contact: customerData.customerContact,
                company: customerData.customerCompany,
                address: customerData.customerAddress
            },
            type: customerData.customType || customerData.licenseType,
            created: createdDate.toISOString(),
            expires: expiryDate.toISOString(),
            notes: customerData.notes || '',
            version: '1.0',
            signature: this.generateSignature(licenseID, customerData.customerName, expiryDate.toISOString())
        };

        // تشفير البيانات
        const encryptedData = this.encryptLicenseData(licenseData);
        
        // توليد كود بسيط بالتنسيق الصحيح
        const readableCode = this.generateSimpleCode();

        // إعداد بيانات الرفع إلى Firebase
        const firebaseData = {
            code: readableCode,
            customer: customerData.customerName,
            customerInfo: {
                name: customerData.customerName,
                contact: customerData.customerContact,
                company: customerData.customerCompany,
                address: customerData.customerAddress
            },
            type: customerData.customType || customerData.licenseType,
            durationDays: customerData.durationDays || null,
            created: createdDate.toISOString(),
            expires: expiryDate.toISOString(),
            encryptedData: encryptedData
        };

        // رفع إلى Firebase
        const uploadResult = await window.advancedFirebaseManager.uploadLicense(firebaseData);
        
        if (!uploadResult.success) {
            throw new Error('فشل في رفع الترخيص إلى Firebase: ' + uploadResult.error);
        }

        return {
            code: readableCode,
            data: licenseData,
            firebaseId: uploadResult.id
        };
    }

    // عرض نتيجة توليد الترخيص
    displayLicenseResult(result) {
        document.getElementById('noLicense').classList.add('hidden');
        document.getElementById('licenseResult').classList.remove('hidden');
        
        document.getElementById('generatedLicense').value = result.code;
        document.getElementById('resultCustomer').textContent = result.data.customer.name;
        document.getElementById('resultType').textContent = this.getLicenseTypeName(result.data.type) || result.data.type;
        document.getElementById('resultExpiry').textContent = new Date(result.data.expires).toLocaleDateString('ar-EG');
        
        // حساب عدد الأيام لعرضه
        const now = new Date();
        const exp = new Date(result.data.expires);
        const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const daysEl = document.getElementById('resultDays');
        if (daysEl) daysEl.textContent = isFinite(days) ? `${days} يوم` : '—';
    }

    // الحصول على اسم نوع الترخيص
    getLicenseTypeName(type) {
        const types = {
            'trial': 'تجريبي',
            'standard': 'عادي',
            'premium': 'مميز',
            'lifetime': 'مدى الحياة'
        };
        return types[type] || type;
    }

    // فك تشفير بيانات الترخيص
    decryptLicenseData(encryptedData) {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
            const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
            return JSON.parse(jsonData);
        } catch (error) {
            return null;
        }
    }

    // التحقق من صحة الترخيص
    async verifyLicenseCode(licenseCode) {
        if (!this.firebaseReady || !window.advancedFirebaseManager) {
            throw new Error('Firebase غير متاح');
        }

        const result = await window.advancedFirebaseManager.getLicense(licenseCode);
        
        if (!result.success) {
            return {
                valid: false,
                error: result.error
            };
        }

        const licenseData = this.decryptLicenseData(result.data.encryptedData);
        
        if (!licenseData) {
            return {
                valid: false,
                error: 'كود التفعيل تالف أو غير صحيح'
            };
        }

        // التحقق من التوقيع
        const expectedSignature = this.generateSignature(
            licenseData.id,
            licenseData.customer.name,
            licenseData.expires
        );

        if (licenseData.signature !== expectedSignature) {
            return {
                valid: false,
                error: 'كود التفعيل تم التلاعب به'
            };
        }

        // التحقق من تاريخ الانتهاء
        const now = new Date();
        const expiryDate = new Date(licenseData.expires);

        if (now > expiryDate) {
            return {
                valid: false,
                error: 'كود التفعيل منتهي الصلاحية',
                expired: true,
                data: licenseData
            };
        }

        // حساب الأيام المتبقية
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
            valid: true,
            data: licenseData,
            daysRemaining: daysRemaining
        };
    }
}

// تهيئة النظام
const simpleSystem = new SimpleLicenseSystem();

// وظائف التبويبات
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    document.querySelectorAll('[id$="Tab"]').forEach(btn => {
        btn.classList.remove('active-tab');
    });
    
    document.getElementById(tabName + 'Section').classList.remove('hidden');
    document.getElementById(tabName + 'Tab').classList.add('active-tab');
}

// وظائف مساعدة
function copyLicense() {
    const licenseInput = document.getElementById('generatedLicense');
    licenseInput.select();
    document.execCommand('copy');
    
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'تم النسخ!';
    button.classList.add('bg-green-600');
    
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-600');
    }, 2000);
}

async function verifyLicense() {
    const licenseCode = document.getElementById('verifyLicense').value.trim();
    
    if (!licenseCode) {
        alert('الرجاء إدخال كود التفعيل');
        return;
    }

    try {
        const result = await simpleSystem.verifyLicenseCode(licenseCode);
        const resultDiv = document.getElementById('verifyResult');
        const statusDiv = document.getElementById('verifyStatus');
        
        resultDiv.classList.remove('hidden');
        
        if (result.valid) {
            statusDiv.className = 'p-6 rounded-lg bg-green-500 bg-opacity-20 border border-green-400';
            statusDiv.innerHTML = `
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span class="font-bold text-green-400 text-xl">كود التفعيل صحيح</span>
                </div>
                <div class="text-white space-y-2">
                    <div><strong>العميل:</strong> ${result.data.customer.name}</div>
                    <div><strong>النوع:</strong> ${simpleSystem.getLicenseTypeName(result.data.type)}</div>
                    <div><strong>الأيام المتبقية:</strong> ${result.daysRemaining} يوم</div>
                    <div><strong>تاريخ الانتهاء:</strong> ${new Date(result.data.expires).toLocaleDateString('ar-EG')}</div>
                </div>
            `;
        } else {
            statusDiv.className = 'p-6 rounded-lg bg-red-500 bg-opacity-20 border border-red-400';
            statusDiv.innerHTML = `
                <div class="flex items-center mb-4">
                    <svg class="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    <span class="font-bold text-red-400 text-xl">كود التفعيل غير صحيح</span>
                </div>
                <div class="text-red-200">${result.error}</div>
            `;
        }
    } catch (error) {
        alert('حدث خطأ في التحقق: ' + error.message);
    }
}

async function refreshLicenses() {
    await simpleSystem.loadLicenses();
    await simpleSystem.loadStats();
}