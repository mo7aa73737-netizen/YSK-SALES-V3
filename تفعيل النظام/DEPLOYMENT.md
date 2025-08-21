# دليل النشر - YSK License Manager PWA

## خطوات النشر على GitHub Pages

### 1. إعداد المستودع

```bash
# إنشاء مستودع Git جديد
git init

# إضافة جميع الملفات
git add .

# أول commit
git commit -m "Initial commit: YSK License Manager PWA"

# إنشاء branch رئيسي
git branch -M main

# ربط المستودع بـ GitHub (استبدل username و repository-name)
git remote add origin https://github.com/username/repository-name.git

# رفع الملفات
git push -u origin main
```

### 2. تفعيل GitHub Pages

1. اذهب إلى مستودع GitHub
2. اضغط على **Settings**
3. انتقل إلى **Pages** في القائمة الجانبية
4. في **Source** اختر **GitHub Actions**
5. سيتم تشغيل workflow تلقائياً

### 3. التحقق من النشر

- انتظر انتهاء GitHub Actions (عادة 2-5 دقائق)
- ستجد الرابط في صفحة Settings > Pages
- الرابط سيكون: `https://username.github.io/repository-name/`

## إعداد Firebase

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. اضغط "Create a project"
3. اتبع الخطوات لإنشاء المشروع

### 2. إعداد Firestore

1. في Firebase Console، اذهب إلى **Firestore Database**
2. اضغط **Create database**
3. اختر **Start in test mode** (مؤقتاً)
4. اختر المنطقة الجغرافية

### 3. إعداد Web App

1. في Firebase Console، اضغط على أيقونة الويب `</>`
2. أدخل اسم التطبيق: `YSK License Manager`
3. فعّل **Firebase Hosting** (اختياري)
4. انسخ إعدادات Firebase

### 4. تحديث إعدادات Firebase في الكود

في ملف `firebase-license-system.html`، ابحث عن:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA3HGYLYLlFf05qPBl23PujqWhr5Z0_Apc",
  authDomain: "ysk-active-35da4.firebaseapp.com",
  projectId: "ysk-active-35da4",
  storageBucket: "ysk-active-35da4.firebasestorage.app",
  messagingSenderId: "690431684740",
  appId: "1:690431684740:web:3e861056405d08c73a52d1",
  measurementId: "G-0R13DT05T7"
};
```

واستبدله بإعداداتك الخاصة.

### 5. إعداد قواعد الأمان

في Firestore، اذهب إلى **Rules** وأدخل:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ysk_licenses/{document} {
      allow read, write: if true;
    }
  }
}
```

**تحذير**: هذه القواعد للتطوير فقط. في الإنتاج، استخدم قواعد أمان أكثر تقييداً.

## إنشاء الأيقونات

### الطريقة الأولى: مولد الأيقونات المدمج

1. افتح `generate-icons.html` في المتصفح
2. اضغط "توليد الأيقونات"
3. احفظ كل أيقونة في مجلد `icons/`

### الطريقة الثانية: أدوات خارجية

استخدم أحد هذه المواقع:
- [PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## اختبار PWA

### 1. اختبار محلي

```bash
# تثبيت live-server
npm install -g live-server

# تشغيل الخادم
live-server --port=3000
```

### 2. اختبار PWA

1. افتح Chrome DevTools
2. اذهب إلى تبويب **Application**
3. تحقق من:
   - **Manifest**: يجب أن يظهر بدون أخطاء
   - **Service Workers**: يجب أن يكون مسجل ونشط
   - **Storage**: تحقق من Cache Storage

### 3. اختبار التثبيت

- في Chrome، ابحث عن أيقونة التثبيت في شريط العناوين
- أو اذهب إلى القائمة > Install YSK License Manager

## نشر التحديثات

```bash
# إضافة التغييرات
git add .

# commit مع وصف التحديث
git commit -m "Update: وصف التحديث"

# رفع التحديث
git push origin main
```

سيتم نشر التحديث تلقائياً عبر GitHub Actions.

## استكشاف الأخطاء

### مشاكل شائعة:

1. **Service Worker لا يعمل**:
   - تأكد من أن الموقع يعمل على HTTPS
   - تحقق من Console للأخطاء

2. **Firebase لا يتصل**:
   - تحقق من إعدادات Firebase
   - تأكد من تفعيل Firestore

3. **الأيقونات لا تظهر**:
   - تأكد من وجود ملفات الأيقونات
   - تحقق من مسارات الأيقونات في manifest.json

4. **PWA لا يُثبت**:
   - تحقق من صحة manifest.json
   - تأكد من وجود Service Worker
   - تحقق من أن الموقع يعمل على HTTPS

### أدوات التشخيص:

- **Chrome DevTools > Application**
- **Chrome DevTools > Network**
- **Chrome DevTools > Console**
- [PWA Builder](https://www.pwabuilder.com/) للتحقق من جودة PWA

## الأمان في الإنتاج

### 1. قواعد Firestore الآمنة

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ysk_licenses/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. إعداد المصادقة

أضف Firebase Authentication للحماية:

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
// إضافة نظام تسجيل الدخول
```

### 3. تشفير إضافي

- استخدم HTTPS دائماً
- فعّل CORS في Firebase
- أضف rate limiting للـ API calls

## النسخ الاحتياطي

### 1. تصدير البيانات

```javascript
// إضافة وظيفة تصدير شاملة
async function exportAllData() {
  const data = await getAllLicenses();
  const blob = new Blob([JSON.stringify(data, null, 2)], 
    { type: 'application/json' });
  // تحميل الملف
}
```

### 2. النسخ الاحتياطي التلقائي

استخد�� Firebase Functions للنسخ الاحتياطي اليومي:

```javascript
exports.dailyBackup = functions.pubsub
  .schedule('0 2 * * *')
  .onRun(async (context) => {
    // كود النسخ الاحتياطي
  });
```

---

## الدعم الفني

إذا واجهت أي مشاكل:

1. تحقق من [Issues](https://github.com/username/repository-name/issues)
2. أنشئ issue جديد مع تفاصيل المشكلة
3. تواصل مع فريق الدعم

---

© 2024 YSK Systems - جميع الحقوق محفوظة