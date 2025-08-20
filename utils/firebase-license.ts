// Firebase License System for YSK POS Application
// نظام Firebase للتراخيص في التطبيق الأساسي

declare const CryptoJS: any;

interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

interface LicenseData {
    id: string;
    customer: {
        name: string;
        contact: string;
    };
    type: 'trial' | 'standard' | 'premium' | 'lifetime';
    created: string;
    expires: string;
    hardwareID: string;
    notes: string;
    version: string;
    signature: string;
}

class FirebaseLicenseClient {
    private firebaseConfig: FirebaseConfig = {
        apiKey: "AIzaSyA3HGYLYLlFf05qPBl23PujqWhr5Z0_Apc",
        authDomain: "ysk-active-35da4.firebaseapp.com",
        projectId: "ysk-active-35da4",
        storageBucket: "ysk-active-35da4.firebasestorage.app",
        messagingSenderId: "690431684740",
        appId: "1:690431684740:web:3e861056405d08c73a52d1",
        measurementId: "G-0R13DT05T7"
    };

    private masterKey = 'YSK-POS-2024-MASTER-KEY-ULTRA-SECURE-v1.0';
    private isFirebaseLoaded = false;
    private db: any = null;

    constructor() {
        this.initializeFirebase();
    }

    // تهيئة Firebase
    private async initializeFirebase() {
        try {
            // تحميل Firebase scripts ديناميكياً
            await this.loadFirebaseScripts();
            
            // تهيئة Firebase
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const app = initializeApp(this.firebaseConfig);
            this.db = getFirestore(app);
            this.isFirebaseLoaded = true;
            
            console.log('Firebase تم تحميله بنجاح');
        } catch (error) {
            console.error('خطأ في تحميل Firebase:', error);
            this.isFirebaseLoaded = false;
        }
    }

    // تحميل Firebase scripts
    private loadFirebaseScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            // التحقق من وجود Firebase مسبقاً
            if (typeof window !== 'undefined' && (window as any).firebase) {
                resolve();
                return;
            }

            // إنشاء script tag لـ Firebase
            const script = document.createElement('script');
            script.type = 'module';
            script.innerHTML = `
                import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
                import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
                window.firebaseModules = { initializeApp, getFirestore };
            `;
            
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('فشل في تحميل Firebase'));
            
            document.head.appendChild(script);
        });
    }

    // البحث عن الترخيص في Firebase
    async getLicenseFromFirebase(licenseCode: string): Promise<any> {
        if (!this.isFirebaseLoaded || !this.db) {
            throw new Error('Firebase غير متاح');
        }

        try {
            const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(this.db, 'ysk_licenses'), 
                where("code", "==", licenseCode)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            return doc.data();
        } catch (error) {
            console.error('خطأ في البحث عن الترخيص:', error);
            throw error;
        }
    }

    // فك تشفير بيانات الترخيص
    decryptLicenseData(encryptedData: string): LicenseData | null {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
            const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
            return JSON.parse(jsonData) as LicenseData;
        } catch (error) {
            console.error('فشل في فك تشفير بيانات الترخيص:', error);
            return null;
        }
    }

    // توليد Hardware ID
    generateHardwareID(): string {
        const components = [
            navigator.userAgent,
            navigator.platform,
            navigator.language,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.hardwareConcurrency || 'unknown',
            (navigator as any).deviceMemory || 'unknown'
        ];

        // إضافة Canvas fingerprinting
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('YSK Hardware ID Generator', 2, 2);
            components.push(canvas.toDataURL());
        }

        const combined = components.join('|');
        return CryptoJS.SHA256(combined).toString().substring(0, 16).toUpperCase();
    }

    // توليد التوقيع الرقمي
    generateSignature(licenseID: string, customerName: string, expiryDate: string): string {
        const data = licenseID + customerName + expiryDate + this.masterKey;
        return CryptoJS.SHA256(data).toString().substring(0, 32);
    }

    // التحقق من صحة الترخيص
    async validateLicense(licenseCode: string): Promise<any> {
        try {
            console.log('البحث عن الترخيص في Firebase:', licenseCode);
            
            // البحث في Firebase
            const firebaseData = await this.getLicenseFromFirebase(licenseCode);
            
            if (!firebaseData) {
                return {
                    valid: false,
                    error: 'كود التفعيل غير موجود'
                };
            }

            // فك تشفير البيانات
            const licenseData = this.decryptLicenseData(firebaseData.encryptedData);
            
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

            // حساب الأيام المتبقية
            const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // حفظ الترخيص محلياً للاستخدام المستقبلي
            this.saveLicenseLocally(licenseData);

            return {
                valid: true,
                data: licenseData,
                daysRemaining: daysRemaining
            };

        } catch (error) {
            console.error('خطأ في التحقق من الترخيص:', error);
            
            // في حالة عدم توفر الإنترنت، تحقق من النسخة المحفوظة محلياً
            return this.validateLocalLicense(licenseCode);
        }
    }

    // حفظ الترخيص محلياً
    private saveLicenseLocally(licenseData: LicenseData) {
        const licenseInfo = {
            activated: true,
            activationDate: new Date().toISOString(),
            licenseData: licenseData,
            hardwareID: this.generateHardwareID(),
            lastValidated: new Date().toISOString()
        };

        localStorage.setItem('ysk_license_info', JSON.stringify(licenseInfo));
        console.log('تم حفظ الترخيص محلياً');
    }

    // التحقق من الترخيص المحفوظ محلياً
    private validateLocalLicense(licenseCode: string): any {
        try {
            const saved = localStorage.getItem('ysk_license_info');
            if (!saved) {
                return {
                    valid: false,
                    error: 'لا يوجد اتصال بالإنترنت ولا توجد تراخيص محفوظة'
                };
            }

            const licenseInfo = JSON.parse(saved);
            const licenseData = licenseInfo.licenseData;

            // التحقق من تاريخ الانتهاء
            const now = new Date();
            const expiryDate = new Date(licenseData.expires);

            if (now > expiryDate) {
                return {
                    valid: false,
                    error: 'الترخيص المحفوظ منتهي الصلاحية',
                    expired: true
                };
            }

            // التحقق من Hardware ID
            const currentHardwareID = this.generateHardwareID();
            if (licenseData.hardwareID !== currentHardwareID) {
                return {
                    valid: false,
                    error: 'تم تغيير الجهاز - يرجى إعادة التفعيل',
                    hardwareMismatch: true
                };
            }

            const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return {
                valid: true,
                data: licenseData,
                daysRemaining: daysRemaining,
                offline: true
            };

        } catch (error) {
            return {
                valid: false,
                error: 'خطأ في قراءة الترخيص المحفوظ'
            };
        }
    }

    // التحقق من حالة التفعيل الحالية
    checkActivationStatus(): any {
        const saved = localStorage.getItem('ysk_license_info');
        if (!saved) {
            return {
                valid: false,
                error: 'البرنامج غير مفعل'
            };
        }

        try {
            const licenseInfo = JSON.parse(saved);
            return this.validateLocalLicense('');
        } catch (error) {
            return {
                valid: false,
                error: 'خطأ في قراءة بيانات التفعيل'
            };
        }
    }

    // إلغاء التفعيل
    deactivate() {
        localStorage.removeItem('ysk_license_info');
        console.log('تم إلغاء التفعيل');
    }
}

// تصدير العميل
export const firebaseLicenseClient = new FirebaseLicenseClient();
export type { LicenseData };