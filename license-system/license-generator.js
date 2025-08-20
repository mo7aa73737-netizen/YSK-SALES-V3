// نظام إدارة تراخيص YSK POS مع Firebase
// License Generator & Management System with Firebase

class YSKLicenseSystem {
    constructor() {
        // مفتاح التشفير الرئيسي
        this.masterKey = 'YSK-POS-2024-MASTER-KEY-ULTRA-SECURE-v1.0';
        this.licenseHistory = this.loadHistory();
        this.firebaseReady = false;
        
        // انتظار تحميل Firebase
        this.waitForFirebase();
    }

    // انتظار تحميل Firebase
    async waitForFirebase() {
        // انتظار إشارة أن Firebase جاهز
        if (window.firebaseReady && window.firebaseLicenseManager) {
            this.firebaseReady = true;
            this.updateFirebaseStatus(true);
            this.initializeEventListeners();
            console.log('Firebase جاهز للاستخدام');
            return;
        }

        // الاستماع لحدث Firebase Ready
        window.addEventListener('firebaseReady', () => {
            this.firebaseReady = true;
            this.updateFirebaseStatus(true);
            this.initializeEventListeners();
            console.log('Firebase جاهز للاستخدام');
        });

        // انتظار لمدة 10 ثوان كحد أقصى
        setTimeout(() => {
            if (!this.firebaseReady) {
                this.updateFirebaseStatus(false);
                this.initializeEventListeners(); // تهيئة الواجهة حتى لو فشل Firebase
                console.error('انتهت مهلة انتظار Firebase');
            }
        }, 10000);
    }

    // تحديث حالة Firebase في الواجهة
    updateFirebaseStatus(connected) {
        const statusDiv = document.getElementById('firebaseStatus');
        if (connected) {
            statusDiv.className = 'mt-4 p-3 rounded-lg bg-green-100 border border-green-300';
            statusDiv.innerHTML = `
                <svg class="w-5 h-5 text-green-600 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="text-green-800 font-medium">متصل بـ Firebase بنجاح</span>
            `;
        } else {
            statusDiv.className = 'mt-4 p-3 rounded-lg bg-red-100 border border-red-300';
            statusDiv.innerHTML = `
                <svg class="w-5 h-5 text-red-600 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="text-red-800 font-medium">خطأ في الاتصال بـ Firebase - سيتم العمل محلياً فقط</span>
            `;
        }
    }

    // توليد Hardware ID من معلومات المتصفح والجهاز
    generateHardwareID() {
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            navigator.deviceMemory || 'unknown'
        ];

        // إضافة Canvas fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('YSK Hardware ID Generator', 2, 2);
        components.push(canvas.toDataURL());

        // دمج كل المكونات وعمل hash
        const combined = components.join('|');
        return CryptoJS.SHA256(combined).toString().substring(0, 16).toUpperCase();
    }

    // توليد معرف فريد للترخيص
    generateLicenseID() {
        return 'LIC-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // تشفير بيانات الترخيص
    encryptLicenseData(data) {
        const jsonData = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonData, this.masterKey).toString();
        return encrypted;
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

    // تحويل البيانات المشفرة إلى كود قابل للقراءة
    generateReadableCode(encryptedData) {
        // أخذ hash من البيانات المشفرة
        const hash = CryptoJS.SHA256(encryptedData).toString();
        
        // تحويل إلى أرقام وحروف
        let code = '';
        for (let i = 0; i < 20; i += 4) {
            if (code) code += '-';
            code += hash.substring(i, i + 4).toUpperCase();
        }
        
        return 'YSK-' + code;
    }

    // حساب تاريخ الانتهاء حسب نوع الترخيص
    calculateExpiryDate(licenseType, customExpiry = null) {
        if (customExpiry) {
            return new Date(customExpiry);
        }

        const now = new Date();
        switch (licenseType) {
            case 'trial':
                return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 يوم
            case 'standard':
                return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // سنة
            case 'premium':
                return new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // سنتين
            case 'lifetime':
                return new Date('2099-12-31'); // مدى الحياة
            default:
                return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
        }
    }

    // توليد ترخيص جديد ورفعه إلى Firebase
    async generateLicense(customerData) {
        const licenseID = this.generateLicenseID();
        const hardwareID = customerData.hardwareID.toUpperCase();
        const createdDate = new Date();
        const expiryDate = this.calculateExpiryDate(customerData.licenseType, customerData.expiryDate);

        const licenseData = {
            id: licenseID,
            customer: {
                name: customerData.customerName,
                contact: customerData.customerContact
            },
            type: customerData.licenseType,
            created: createdDate.toISOString(),
            expires: expiryDate.toISOString(),
            hardwareID: hardwareID,
            notes: customerData.notes || '',
            version: '1.0',
            signature: this.generateSignature(licenseID, customerData.customerName, expiryDate.toISOString())
        };

        // تشفير البيانات
        const encryptedData = this.encryptLicenseData(licenseData);
        
        // توليد الكود القابل للقراءة
        const readableCode = this.generateReadableCode(encryptedData);

        // إعداد بيانات الرفع إلى Firebase
        const firebaseData = {
            code: readableCode,
            customer: customerData.customerName,
            hardwareID: hardwareID,
            type: customerData.licenseType,
            created: createdDate.toISOString(),
            expires: expiryDate.toISOString(),
            encryptedData: encryptedData
        };

        // محاولة رفع إلى Firebase
        let firebaseSuccess = false;
        if (this.firebaseReady && window.firebaseLicenseManager) {
            try {
                const uploadResult = await window.firebaseLicenseManager.uploadLicense(firebaseData);
                
                if (uploadResult.success) {
                    firebaseSuccess = true;
                    console.log('تم رفع الترخيص إلى Firebase بنجاح');
                } else {
                    console.error('فشل في رفع الترخيص إلى Firebase:', uploadResult.error);
                }
            } catch (error) {
                console.error('خطأ في رفع الترخيص إلى Firebase:', error);
            }
        }

        // حفظ في السجل المحلي دائماً
        const licenseRecord = {
            code: readableCode,
            encryptedData: encryptedData,
            customer: customerData.customerName,
            hardwareID: hardwareID,
            type: customerData.licenseType,
            created: createdDate.toISOString(),
            expires: expiryDate.toISOString(),
            status: 'active',
            firebaseUploaded: firebaseSuccess
        };

        this.licenseHistory.unshift(licenseRecord);
        this.saveHistory();

        return {
            code: readableCode,
            data: licenseData,
            firebaseUploaded: firebaseSuccess
        };
    }

    // توليد توقيع رقمي للحماية من التلاعب
    generateSignature(licenseID, customerName, expiryDate) {
        const data = licenseID + customerName + expiryDate + this.masterKey;
        return CryptoJS.SHA256(data).toString().substring(0, 32);
    }

    // التحقق من صحة الترخيص (من Firebase أو محلياً)
    async verifyLicense(licenseCode) {
        let licenseData = null;

        // محاولة البحث في Firebase أولاً
        if (this.firebaseReady && window.firebaseLicenseManager) {
            try {
                const firebaseResult = await window.firebaseLicenseManager.getLicense(licenseCode);
                if (firebaseResult.success) {
                    licenseData = this.decryptLicenseData(firebaseResult.data.encryptedData);
                }
            } catch (error) {
                console.error('خطأ في البحث في Firebase:', error);
            }
        }

        // إذا لم نجد في Firebase، ابحث محلياً
        if (!licenseData) {
            const license = this.licenseHistory.find(l => l.code === licenseCode);
            if (license) {
                licenseData = this.decryptLicenseData(license.encryptedData);
            }
        }
        
        if (!licenseData) {
            return {
                valid: false,
                error: 'كود التفعيل غير صحيح أو غير موجود'
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
                expired: true
            };
        }

        // التحقق من Hardware ID
        const currentHardwareID = this.generateHardwareID();
        if (licenseData.hardwareID && licenseData.hardwareID !== currentHardwareID) {
            return {
                valid: false,
                error: 'كود التفعيل مربوط بجهاز آخر ولا يمكن استخدامه على هذا الجهاز',
                hardwareMismatch: true,
                expectedHW: licenseData.hardwareID,
                currentHW: currentHardwareID
            };
        }

        return {
            valid: true,
            data: licenseData,
            daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        };
    }

    // حفظ سجل التراخيص
    saveHistory() {
        localStorage.setItem('ysk_license_history', JSON.stringify(this.licenseHistory));
    }

    // تحميل سجل التراخيص
    loadHistory() {
        const saved = localStorage.getItem('ysk_license_history');
        return saved ? JSON.parse(saved) : [];
    }

    // تحديث عرض السجل
    updateHistoryDisplay() {
        const tbody = document.getElementById('licenseHistory');
        
        if (this.licenseHistory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-12 text-gray-500 text-xl">لا توجد أكواد مولدة بعد</td></tr>';
            return;
        }

        tbody.innerHTML = this.licenseHistory.map(license => {
            const createdDate = new Date(license.created).toLocaleDateString('ar-EG');
            const expiryDate = new Date(license.expires).toLocaleDateString('ar-EG');
            const isExpired = new Date() > new Date(license.expires);
            
            let statusClass, statusText;
            if (isExpired) {
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'منتهي';
            } else if (license.firebaseUploaded) {
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'نشط - Firebase';
            } else {
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusText = 'نشط - محلي';
            }

            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3">${createdDate}</td>
                    <td class="p-3 font-medium">${license.customer}</td>
                    <td class="p-3 font-mono text-xs text-blue-600">${license.hardwareID || 'غير محدد'}</td>
                    <td class="p-3 font-mono text-xs">${license.code}</td>
                    <td class="p-3">${this.getLicenseTypeName(license.type)}</td>
                    <td class="p-3">${expiryDate}</td>
                    <td class="p-3">
                        <span class="px-2 py-1 rounded-full text-xs ${statusClass}">${statusText}</span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // الحصول على اسم نوع الترخيص بالعربية
    getLicenseTypeName(type) {
        const types = {
            'trial': 'تجريبي',
            'standard': 'عادي',
            'premium': 'مميز',
            'lifetime': 'مدى الحياة'
        };
        return types[type] || type;
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

        // تحديث عرض السجل عند التحميل
        this.updateHistoryDisplay();
    }

    // معالجة توليد ترخيص جديد
    async handleGenerateLicense() {
        const generateBtn = document.getElementById('generateBtn');
        const hardwareID = document.getElementById('hardwareID').value.trim();
        
        // التحقق من صحة Hardware ID
        if (!hardwareID || hardwareID.length !== 16) {
            alert('يرجى إدخال معرف الجهاز صحيح (16 حرف/رقم)');
            return;
        }

        const customerData = {
            customerName: document.getElementById('customerName').value,
            customerContact: document.getElementById('customerContact').value,
            hardwareID: hardwareID,
            licenseType: document.getElementById('licenseType').value,
            expiryDate: document.getElementById('expiryDate').value,
            notes: document.getElementById('notes').value
        };

        // تعطيل الزر وإظهار حالة التحميل
        generateBtn.disabled = true;
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<div class="loading mr-2"></div> جاري التوليد والرفع...';

        try {
            const result = await this.generateLicense(customerData);
            this.displayLicenseResult(result);
            this.updateHistoryDisplay();
            
            // إعادة تعيين النموذج
            document.getElementById('licenseForm').reset();
            
        } catch (error) {
            alert('حدث خطأ في توليد الترخيص: ' + error.message);
        } finally {
            // إعادة تفعيل الزر
            generateBtn.disabled = false;
            generateBtn.innerHTML = originalText;
        }
    }

    // عرض نتيجة توليد الترخيص
    displayLicenseResult(result) {
        document.getElementById('noLicense').classList.add('hidden');
        document.getElementById('licenseResult').classList.remove('hidden');
        
        document.getElementById('generatedLicense').value = result.code;
        document.getElementById('resultCustomer').textContent = result.data.customer.name;
        document.getElementById('resultHardwareID').textContent = result.data.hardwareID;
        document.getElementById('resultType').textContent = this.getLicenseTypeName(result.data.type);
        document.getElementById('resultCreated').textContent = new Date(result.data.created).toLocaleDateString('ar-EG');
        document.getElementById('resultExpiry').textContent = new Date(result.data.expires).toLocaleDateString('ar-EG');
        
        // تحديث رسالة النجاح حسب حالة Firebase
        const successMessage = document.querySelector('#licenseResult .bg-green-100 p');
        if (result.firebaseUploaded) {
            successMessage.innerHTML = `
                <strong>تم رفع الكود إلى Firebase بنجاح!</strong><br>
                يمكن للعميل الآن استخدام هذا الكود للتفعيل من أي مكان.
            `;
        } else {
            successMessage.innerHTML = `
                <strong>تم توليد الكود بنجاح!</strong><br>
                تم حفظ الكود محلياً. Firebase غير متاح حالياً.
            `;
            successMessage.parentElement.className = 'mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg';
            successMessage.className = 'text-yellow-800 text-lg';
        }
    }
}

// تهيئة النظام
const licenseSystem = new YSKLicenseSystem();

// وظائف مساعدة للواجهة
function copyLicense() {
    const licenseInput = document.getElementById('generatedLicense');
    licenseInput.select();
    document.execCommand('copy');
    
    // تأثير بصري للنسخ
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'تم النسخ';
    button.classList.add('bg-green-500');
    
    setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('bg-green-500');
    }, 2000);
}

async function verifyLicense() {
    const licenseCode = document.getElementById('verifyLicense').value.trim();
    
    if (!licenseCode) {
        alert('الرجاء إدخال كود التفعيل');
        return;
    }

    const result = await licenseSystem.verifyLicense(licenseCode);
    const resultDiv = document.getElementById('verifyResult');
    const statusDiv = document.getElementById('verifyStatus');
    
    resultDiv.classList.remove('hidden');
    
    if (result.valid) {
        statusDiv.className = 'p-4 rounded-lg bg-green-100 border border-green-300';
        statusDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span class="font-bold text-green-800">كود التفعيل صحيح</span>
            </div>
            <div class="text-sm space-y-1">
                <div><strong>العميل:</strong> ${result.data.customer.name}</div>
                <div><strong>معرف الجهاز:</strong> <span class="font-mono text-blue-600">${result.data.hardwareID}</span></div>
                <div><strong>النوع:</strong> ${licenseSystem.getLicenseTypeName(result.data.type)}</div>
                <div><strong>الأيام المتبقية:</strong> ${result.daysRemaining} يوم</div>
                <div><strong>تاريخ الانتهاء:</strong> ${new Date(result.data.expires).toLocaleDateString('ar-EG')}</div>
            </div>
        `;
    } else {
        statusDiv.className = 'p-4 rounded-lg bg-red-100 border border-red-300';
        statusDiv.innerHTML = `
            <div class="flex items-center mb-2">
                <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                <span class="font-bold text-red-800">كود التفعيل غير صحيح</span>
            </div>
            <div class="text-sm text-red-700">${result.error}</div>
            ${result.hardwareMismatch ? `
                <div class="mt-2 text-xs text-gray-600">
                    <div><strong>المتوقع:</strong> <span class="font-mono">${result.expectedHW}</span></div>
                    <div><strong>الحالي:</strong> <span class="font-mono">${result.currentHW}</span></div>
                </div>
            ` : ''}
        `;
    }
}

// عرض Hardware ID الحالي في وحدة التحكم للمطورين
console.log('Hardware ID الحالي للمطور:', licenseSystem.generateHardwareID());