// Firebase Configuration for YSK License System
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA3HGYLYLlFf05qPBl23PujqWhr5Z0_Apc",
    authDomain: "ysk-active-35da4.firebaseapp.com",
    projectId: "ysk-active-35da4",
    storageBucket: "ysk-active-35da4.firebasestorage.app",
    messagingSenderId: "690431684740",
    appId: "1:690431684740:web:3e861056405d08c73a52d1",
    measurementId: "G-0R13DT05T7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firebase License Manager
class FirebaseLicenseManager {
    constructor() {
        this.db = db;
        this.collection = 'ysk_licenses';
    }

    // رفع كود التفعيل إلى Firebase
    async uploadLicense(licenseData) {
        try {
            const docRef = await addDoc(collection(this.db, this.collection), {
                code: licenseData.code,
                customer: licenseData.customer,
                hardwareID: licenseData.hardwareID,
                type: licenseData.type,
                created: licenseData.created,
                expires: licenseData.expires,
                status: 'active',
                encryptedData: licenseData.encryptedData,
                timestamp: new Date().toISOString()
            });
            
            console.log('تم رفع الترخيص بنجاح:', docRef.id);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('خطأ في رفع الترخيص:', error);
            return { success: false, error: error.message };
        }
    }

    // البحث عن كود التفعيل في Firebase
    async getLicense(licenseCode) {
        try {
            const q = query(
                collection(this.db, this.collection), 
                where("code", "==", licenseCode)
            );
            
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return { success: false, error: 'كود التفعيل غير موجود' };
            }

            const doc = querySnapshot.docs[0];
            const data = doc.data();
            
            return { 
                success: true, 
                data: data,
                id: doc.id 
            };
        } catch (error) {
            console.error('خطأ في البحث عن الترخيص:', error);
            return { success: false, error: error.message };
        }
    }

    // التحقق من حالة الاتصال بـ Firebase
    async testConnection() {
        try {
            const testDoc = doc(this.db, 'test', 'connection');
            await getDoc(testDoc);
            return true;
        } catch (error) {
            console.error('خطأ في الاتصال بـ Firebase:', error);
            return false;
        }
    }
}

// تصدير المدير
window.firebaseLicenseManager = new FirebaseLicenseManager();