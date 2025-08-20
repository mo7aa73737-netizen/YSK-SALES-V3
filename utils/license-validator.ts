// نظام التحقق البسيط من التراخيص مع Firebase
// Simple License Validation System with Firebase

declare const CryptoJS: any;

interface LicenseData {
    id: string;
    customer: {
        name: string;
        contact: string;
    };
    type: 'trial' | 'standard' | 'premium' | 'lifetime';
    created: string;
    expires: string;
    notes: string;
    version: string;
    signature: string;
}

interface ValidationResult {
    valid: boolean;
    error?: string;
    data?: LicenseData;
    daysRemaining?: number;
    expired?: boolean;
    offline?: boolean;
}

class SimpleLicenseValidator {
    private masterKey = 'YSK-POS-2024-MASTER-KEY-ULTRA-SECURE-v1.0';
    private firebaseConfig = {
        apiKey: "AIzaSyA3HGYLYLlFf05qPBl23PujqWhr5Z0_Apc",
        authDomain: "ysk-active-35da4.firebaseapp.com",
        projectId: "ysk-active-35da4",
        storageBucket: "ysk-active-35da4.firebasestorage.app",
        messagingSenderId: "690431684740",
        appId: "1:690431684740:web:3e861056405d08c73a52d1",
        measurementId: "G-0R13DT05T7"
    };

    constructor() {
        // تحميل CryptoJS إذا لم يكن متاحاً
        this.loadCryptoJS();
    }

    // تحميل CryptoJS
    private loadCryptoJS() {
        if (typeof CryptoJS === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js';
            document.head.appendChild(script);
        }
    }

    // فك تشفير بيانات الترخيص
    private decryptLicenseData(encryptedData: string): LicenseData | null {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
            const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
            return JSON.parse(jsonData) as LicenseData;
        } catch (error) {
            console.error('فشل في فك تشفير بيانات الترخيص:', error);
            return null;
        }
    }

    // توليد التوقيع الرقمي
    private generateSignature(licenseID: string, customerName: string, expiryDate: string): string {
        const data = licenseID + customerName + expiryDate + this.masterKey;
        return CryptoJS.SHA256(data).toString().substring(0, 32);
    }

    // البحث عن الترخيص في Firebase
    private async getLicenseFromFirebase(licenseCode: string): Promise<any> {
        try {
            console.log('البحث في Firebase عن الكود:', licenseCode);
            
            // تحميل Firebase ديناميكياً
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const app = initializeApp(this.firebaseConfig);
            const db = getFirestore(app);
            
            const q = query(
                collection(db, 'ysk_licenses'), 
                where("code", "==", licenseCode)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                console.log('لم يتم العثور على الترخيص في Firebase');
                return null;
            }

            const docData = querySnapshot.docs[0];
            const data = docData.data();
            
            console.log('تم العثور على الترخيص في Firebase:', data);
            
            // تحديث آخر استخدام وعداد الاستخدام (بدون تفعيل)
            try {
                await updateDoc(docData.ref, {
                    lastUsed: new Date().toISOString(),
                    usageCount: (data.usageCount || 0) + 1
                });
                console.log('تم تحديث إحصائيات الاستخدام');
            } catch (updateError) {
                console.warn('فشل في تحديث إحصائيات الاستخدام:', updateError);
            }
            
            return { data, ref: docData.ref, id: docData.id };
        } catch (error) {
            console.error('خطأ في البحث عن الترخيص في Firebase:', error);
            throw error;
        }
    }

    // التحقق من تنسيق الكود
    private isValidFormat(licenseCode: string): boolean {
        // التحقق من التنسيق: YSK-XXXX-XXXX-XXXX-XXXX
        const pattern = /^YSK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(licenseCode);
    }

    // التحقق من صحة الترخيص باستخدام Firebase
    async validateLicense(licenseCode: string): Promise<ValidationResult> {
        console.log('محاولة التحقق من الكود:', licenseCode);
        
        if (!licenseCode) {
            return {
                valid: false,
                error: 'من فضلك أدخل كود التفعيل'
            };
        }

        const code = licenseCode.trim().toUpperCase();
        const formatOk = this.isValidFormat(code);

        try {
            // البحث في Firebase حتى لو التنسيق غير مطابق
            const firebaseData = await this.getLicenseFromFirebase(code);
            
            if (!firebaseData) {
                console.log('لم يتم العثور على الترخيص في Firebase');
                
                // لو التنسيق غير صحيح، رجّع رسالة تنسيق واضحة
                if (!formatOk) {
                    return {
                        valid: false,
                        error: 'تنسيق كود التفعيل غير صحيح. يجب أن يكون بالشكل: YSK-XXXX-XXXX-XXXX-XXXX'
                    };
                }

                // محاولة البحث في النسخة المحفوظة محلياً
                return this.validateOfflineLicense();
            }

            // رفض في حال تم التفعيل مسبقاً (One-time Use)
            if (firebaseData.data.activated) {
                return {
                    valid: false,
                    error: 'هذا الكود تم استخدامه بالفعل'
                };
            }

            // فك تشفير البيانات
            const licenseData = this.decryptLicenseData(firebaseData.data.encryptedData);
            
            if (!licenseData) {
                return {
                    valid: false,
                    error: 'كود التفعيل تالف أو غير صحيح'
                };
            }

            console.log('تم فك تشفير بيانات الترخيص:', licenseData);

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

            // تحديث حالة التفعيل في Firebase (مرة واحدة فقط)
            try {
                if (!firebaseData.data.activated) {
                    const { updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                    await updateDoc(firebaseData.ref, {
                        activated: true,
                        activationDate: new Date().toISOString()
                    });
                    console.log('تم تعليم الكود كمفعل لمرة واحدة');
                }
            } catch (e) {
                console.warn('تعذر تحديث حالة التفعيل في Firebase:', e);
            }

            // حساب الأيام المتبقية
            const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // حفظ الترخيص محلياً للاستخدام المستقبلي (مشفر)
            this.saveLicenseInfo(licenseData);

            console.log('التحقق نجح، الأيام المتبقية:', daysRemaining);

            return {
                valid: true,
                data: licenseData,
                daysRemaining: daysRemaining
            };

        } catch (error) {
            console.error('خطأ في التحقق من الترخيص:', error);
            
            // في حالة عدم توفر الإنترنت
            if (!formatOk) {
                return {
                    valid: false,
                    error: 'تنسيق كود التفعيل غير صحيح. يجب أن يكون بالشكل: YSK-XXXX-XXXX-XXXX-XXXX'
                };
            }
            // تحقق من النسخة المحفوظة محلياً
            return this.validateOfflineLicense();
        }
    }

    // التحقق من الترخيص المحفوظ محلياً (وضع عدم الاتصال)
    private validateOfflineLicense(): ValidationResult {
        console.log('التحقق من الترخيص المحفوظ محلياً');
        
        const licenseInfo = this.loadLicenseInfo();
        
        if (!licenseInfo || !licenseInfo.activated) {
            return {
                valid: false,
                error: 'لا يوجد اتصال بالإنترنت ولا توجد تراخيص محفوظة'
            };
        }

        // التحقق من صحة الترخيص المحفوظ
        const validation = this.validateLicenseData(licenseInfo.licenseData);
        
        if (validation.valid) {
            validation.offline = true;
            console.log('تم التحقق من الترخيص محلياً بنجاح');
        }
        
        return validation;
    }

    // التحقق من بيانات الترخيص المحفوظة
    private validateLicenseData(licenseData: LicenseData): ValidationResult {
        if (!licenseData) {
            return {
                valid: false,
                error: 'بيانات الترخيص مفقودة'
            };
        }

        // التحقق من تاريخ الانتهاء
        const now = new Date();
        const expiryDate = new Date(licenseData.expires);

        if (now > expiryDate) {
            return {
                valid: false,
                error: 'انتهت صلاحية الترخيص',
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

    // التحقق من نوع الترخيص
    getLicenseFeatures(licenseType: string) {
        const features = {
            trial: {
                name: 'تجريبي',
                maxProducts: 50,
                maxInvoices: 100,
                maxUsers: 1,
                supportLevel: 'basic'
            },
            standard: {
                name: 'عادي',
                maxProducts: 1000,
                maxInvoices: 5000,
                maxUsers: 3,
                supportLevel: 'standard'
            },
            premium: {
                name: 'مميز',
                maxProducts: -1, // unlimited
                maxInvoices: -1, // unlimited
                maxUsers: 10,
                supportLevel: 'premium'
            },
            lifetime: {
                name: 'مدى الحياة',
                maxProducts: -1, // unlimited
                maxInvoices: -1, // unlimited
                maxUsers: -1, // unlimited
                supportLevel: 'premium'
            }
        };

        return features[licenseType as keyof typeof features] || features.trial;
    }

    // حفظ معلومات الترخيص المفعل (مشفر)
    saveLicenseInfo(licenseData: LicenseData) {
        const licenseInfo = {
            activated: true,
            activationDate: new Date().toISOString(),
            licenseData: licenseData,
            lastValidated: new Date().toISOString()
        };

        // تشفير البيانات قبل الحفظ
        const encryptedInfo = CryptoJS.AES.encrypt(JSON.stringify(licenseInfo), this.masterKey).toString();
        localStorage.setItem('ysk_license_info', encryptedInfo);
        console.log('🔐 تم حفظ الترخيص مشفراً محلياً');
    }

    // تحميل معلومات الترخيص المحفوظة (فك التشفير)
    loadLicenseInfo() {
        try {
            const encryptedData = localStorage.getItem('ysk_license_info');
            if (!encryptedData) return null;

            // فك تشفير البيانات
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
            const jsonData = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!jsonData) {
                console.warn('فشل في فك تشفير بيانات الترخيص المحفوظة');
                return null;
            }

            console.log('🔓 تم فك تشفير الترخيص المحفوظ بنجاح');
            return JSON.parse(jsonData);
        } catch (error) {
            console.error('خطأ في تحميل الترخيص المحفوظ:', error);
            // إزالة البيانات التالفة
            localStorage.removeItem('ysk_license_info');
            return null;
        }
    }

    // التحقق من حالة التفعيل الحالية
    checkActivationStatus(): ValidationResult {
        console.log('التحقق من حالة التفعيل الحالية');
        
        // أولاً، تحقق من النسخة المحفوظة محلياً
        const licenseInfo = this.loadLicenseInfo();
        
        if (!licenseInfo || !licenseInfo.activated) {
            return {
                valid: false,
                error: 'البرنامج غير مفعل'
            };
        }

        // التحقق من صحة الترخيص المحفوظ
        const validation = this.validateLicenseData(licenseInfo.licenseData);
        
        if (!validation.valid) {
            // إزالة التفعيل غير الصحيح
            localStorage.removeItem('ysk_license_info');
            console.log('تم إزالة الترخيص غير الصحيح');
        } else {
            // إضافة معلومة أنه محفوظ محلياً
            validation.offline = true;
            console.log('الترخيص المحفوظ محلياً صحيح');
        }

        return validation;
    }

    // إلغاء التفعيل
    deactivate() {
        localStorage.removeItem('ysk_license_info');
        localStorage.removeItem('isActivated'); // للتوافق مع النظام القديم
        console.log('تم إلغاء التفعيل وحذف البيانات المشفرة');
    }

    // تحديث الترخيص من Firebase (للتحقق الدوري)
    async refreshLicense(): Promise<ValidationResult> {
        const licenseInfo = this.loadLicenseInfo();
        
        if (!licenseInfo || !licenseInfo.activated) {
            return {
                valid: false,
                error: 'لا يوجد ترخيص مفعل'
            };
        }

        try {
            // محاولة التحقق من Firebase مرة أخرى
            return this.validateLicenseData(licenseInfo.licenseData);
            
        } catch (error) {
            console.error('خطأ في تحديث الترخيص:', error);
            
            // في حالة الفشل، استخدم النسخة المحفوظة
            return this.validateLicenseData(licenseInfo.licenseData);
        }
    }
}

// تصدير مثيل واحد للاستخدام في التطبيق
export const licenseValidator = new SimpleLicenseValidator();
export type { ValidationResult, LicenseData };