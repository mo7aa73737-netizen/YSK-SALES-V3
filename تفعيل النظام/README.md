# YSK License Manager - PWA

نظام إدارة تراخيص YSK POS السحابي - تطبيق ويب تقدمي (PWA)

## المميزات

- 🔑 **إنشاء أكواد التفعيل**: توليد أكواد تفعيل فورية مع تشفير متقدم
- 📊 **إدارة شاملة**: عرض وإدارة جميع التراخيص والعملاء
- ✅ **التحقق من الأكواد**: التحقق من صحة وحالة أكواد التفعيل
- 📱 **PWA**: يعمل كتطبيق أصلي على جميع الأجهزة
- 🌐 **يعمل بدون إنترنت**: إمكانية العمل في وضع عدم الاتصال
- 🔄 **مزامنة تلقائية**: مزامنة البيانات مع Firebase عند الاتصال
- 📈 **إحصائيات مفصلة**: تقارير شاملة عن التراخيص والعملاء

## التقنيات المستخدمة

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Tailwind CSS
- **Icons**: Material Icons
- **Database**: Firebase Firestore
- **PWA**: Service Worker, Web App Manifest
- **Deployment**: GitHub Pages

## الملفات الرئيسية

```
├── index.html                    # الصفحة الرئيسية
├── firebase-license-system.html  # التطبيق الرئيسي
├── manifest.json                 # Web App Manifest
├── sw.js                        # Service Worker
├── generate-icons.html          # مولد الأيقونات
├── browserconfig.xml            # إعدادات Microsoft
├── package.json                 # إعدادات المشروع
└── .github/workflows/deploy.yml # GitHub Actions
```

## التثبيت والتشغيل

### 1. التشغيل المحلي

```bash
# تثبيت التبعيات
npm install

# تشغيل الخادم المحلي
npm run dev
```

### 2. الرفع على GitHub Pages

1. **إنشاء مستودع جديد على GitHub**
2. **رفع الملفات**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - YSK License Manager PWA"
   git branch -M main
   git remote add origin https://github.com/username/ysk-license-manager.git
   git push -u origin main
   ```

3. **تفعيل GitHub Pages**:
   - اذهب إلى Settings > Pages
   - اختر Source: GitHub Actions
   - سيتم النشر تلقائياً عبر GitHub Actions

### 3. الرابط المباشر

بعد النشر، سيكون التطبيق متاحاً على:
```
https://username.github.io/ysk-license-manager/
```

## إعداد Firebase

1. **إنشاء مشروع Firebase جديد**
2. **تفعيل Firestore Database**
3. **إعداد قواعد الأمان**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /ysk_licenses/{document} {
         allow read, write: if true; // قم بتخصيص القواعد حسب احتياجاتك
       }
     }
   }
   ```

4. **تحديث إعدادات Firebase** في `firebase-license-system.html`:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     // ... باقي الإعدادات
   };
   ```

## مميزات PWA

### التثبيت
- يمكن تثبيت التطبيق على الهاتف أو الكمبيوتر
- يظهر كتطبيق أصلي في قائمة التطبيقات
- يعمل في وضع ملء الشاشة

### العمل بدون إنترنت
- حفظ البيانات محلياً عند عدم الاتصال
- مزامنة تلقائية ع��د استعادة الاتصال
- إشعارات حالة الاتصال

### الأداء
- تحميل سريع للصفحات
- تخزين مؤقت ذكي للموارد
- تحديثات تلقائية في الخلفية

## الاستخدام

### 1. توليد ترخيص جديد
- املأ بيانات العميل
- اختر نوع الترخيص ومدة الصلاحية
- اضغط "توليد ورفع الترخيص"
- انسخ الكود المُولد وأرسله للعميل

### 2. إدارة التراخيص
- عرض جميع التراخيص المُنشأة
- البحث والفلترة
- حذف أو تعديل التراخيص

### 3. إدارة العملاء
- عرض معلومات العملاء
- تصدير البيانات كملف CSV
- تعديل معلومات العملاء

### 4. التحقق من الأكواد
- إدخال كود التفعيل للتحقق من صحته
- عرض تفاصيل الترخيص وحالته

## الأمان

- تشفير أكواد التفعيل باستخدام AES-256
- التحقق من صحة البيانات قبل الحفظ
- حماية من التلاعب في الأكواد
- نسخ احتياطية تلقائية في Firebase

## الدعم والصيانة

### تحديث التطبيق
- التحديثات تتم تلقائياً عبر GitHub Actions
- إشعارات التحديث تظهر للمستخدمين
- إمكانية التحديث الفوري

### النسخ الاحتياطي
- جميع البيانات محفوظة في Firebase
- إمكانية تصدير البيانات كملفات CSV
- نسخ احتياطية يومية تلقائية

## الرابط المباشر

🌐 **[YSK License Manager - PWA](https://mo7aa73737-netizen.github.io/license-YSK/)**

## سرعة النشر

```bash
# تشغيل ملف النشر السريع
./deploy-to-github.bat
```

أو يدوياً:

```bash
git add .
git commit -m "Update: تحديث جديد"
git push origin main
```

## المساهمة

1. Fork المشروع من [GitHub Repository](https://github.com/mo7aa73737-netizen/license-YSK)
2. إنشاء branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة خاصة - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## التواصل

- **المطور**: YSK Systems
- **GitHub**: [mo7aa73737-netizen](https://github.com/mo7aa73737-netizen)
- **الريبو**: [license-YSK](https://github.com/mo7aa73737-netizen/license-YSK)
- **الإيميل**: support@ysk-systems.com
- **الموقع**: https://ysk-systems.com

---

© 2024 YSK Systems - جميع الحقوق محفوظة