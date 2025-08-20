import React, { useState, useEffect, useMemo } from 'react';
import { licenseValidator } from '../utils/license-validator';

declare const CryptoJS: any;

interface ActivationPageProps {
  onActivate: () => void;
}

const ActivationPage: React.FC<ActivationPageProps> = ({ onActivate }) => {
  const [serial, setSerial] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // تحميل CryptoJS إذا لم يكن متاحاً
    if (typeof CryptoJS === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js';
      document.head.appendChild(script);
    }

    // تحميل Material Icons (Outlined)
    if (!document.getElementById('material-icons-link')) {
      const link = document.createElement('link');
      link.id = 'material-icons-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined';
      document.head.appendChild(link);
    }
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setError('');
    setLicenseInfo(null);

    try {
      // تأخير بسيط لإظهار حالة التحميل
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = await licenseValidator.validateLicense(serial.trim());

      if (result.valid && result.data) {
        // حفظ معلومات الترخيص
        licenseValidator.saveLicenseInfo(result.data);
        setLicenseInfo(result);
        // تفعيل تأثير الورق المتطاير
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1800);
      } else {
        setError(result.error || 'كود التفعيل غير صحيح');
      }
    } catch (err) {
      setError('حدث خطأ في التحقق من كود التفعيل');
    } finally {
      setIsValidating(false);
    }
  };

  const formatSerial = (value: string) => {
    // تحويل لحروف كبيرة وإزالة أي رموز غير مسموح بها
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // إزالة البادئة YSK لو المستخدم لزقها علشان نعيد تركيبها صح
    const core = clean.startsWith('YSK') ? clean.slice(3) : clean;

    // خُد 4 مجموعات كحد أقصى، كل مجموعة 4 أحرف/أرقام
    const groups = (core.match(/[A-Z0-9]{1,4}/g) || []).slice(0, 4);

    // كوّن الكود النهائي بالصيغة القياسية
    const formatted = 'YSK-' + groups.join('-');

    // قصّه لـ 23 حرف كحد أقصى (YSK-XXXX-XXXX-XXXX-XXXX)
    return formatted.substring(0, 23);
  };

  const getLicenseTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      trial: 'تجريبي',
      standard: 'عادي',
      premium: 'مميز',
      lifetime: 'مدى الحياة',
    };
    return types[type] || type;
  };

  // توليد قطع الورق المتطاير (Confetti Burst)
  const confettiPieces = useMemo(() => {
    const count = 28;
    const colors = ['#10B981', '#059669', '#34D399', '#6EE7B7', '#A7F3D0', '#047857'];
    const pieces = [] as JSX.Element[];
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i;
      const rad = (angle * Math.PI) / 180;
      const distance = 140 + Math.random() * 140; // مدى الانفجار
      const dx = Math.cos(rad) * distance;
      const dy = Math.sin(rad) * distance;
      const color = colors[i % colors.length];
      pieces.push(
        <span
          key={i}
          className="confetti-piece"
          style={{
            // @ts-ignore CSS var
            '--dx': `${dx}px`,
            // @ts-ignore CSS var
            '--dy': `${dy}px`,
            backgroundColor: color,
            left: '50%',
            top: '18%'
          } as any}
        />
      );
    }
    return pieces;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ fontFamily: 'Cairo, sans-serif' }}>
      {/* طبقة الورق المتطاير */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {confettiPieces}
        </div>
      )}

      <div className="max-w-4xl mx-auto relative z-10">
        {/* رأس الصفحة مع اللوجو */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={import.meta.env.BASE_URL + "YSK-SALES.png"} alt="YSK POS" className="h-20 w-20" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">تفعيل نظام YSK POS</h1>
          <p className="text-xl text-gray-600">
            {licenseInfo ? 'تم التفعيل بنجاح' : 'أدخل كود التفعيل لبدء الاستخدام'}
          </p>
        </div>

        {/* نموذج التفعيل */}
        {!licenseInfo && (
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
            <form onSubmit={handleActivate} className="space-y-6">
              <div>
                <label htmlFor="serial" className="block text-lg font-medium text-gray-700 text-right mb-3">
                  كود التفعيل
                </label>
                <input
                  id="serial"
                  name="serial"
                  type="text"
                  value={serial}
                  onChange={(e) => {
                    const formatted = formatSerial(e.target.value.toUpperCase());
                    setSerial(formatted);
                    setError('');
                  }}
                  disabled={isValidating}
                  className="block w-full px-6 py-4 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center tracking-wider font-mono text-xl disabled:bg-gray-100"
                  placeholder="YSK-XXXX-XXXX-XXXX-XXXX"
                  maxLength={23}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isValidating || !serial.trim()}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-xl font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white ml-3" />
                    جاري التحقق...
                  </>
                ) : (
                  'تفعيل النظام'
                )}
              </button>
            </form>
          </div>
        )}

        {/* شاشة النجاح الثابتة */}
        {licenseInfo && licenseInfo.data && (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 mb-8 shadow-lg">
            {/* أيقونة نجاح أعلى سنتر */}
            <div className="flex justify-center mb-4">
              <span className="material-icons-outlined text-green-600" style={{ fontSize: 64 }}>verified</span>
            </div>

            {/* عنوان مختصر */}
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8">تم التفعيل بنجاح</h2>

            {/* تفاصيل الترخيص بتنسيق واضح */}
            <div className="space-y-4 text-lg max-w-2xl mx-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-700 font-semibold">العميل:</span>
                <span className="text-gray-900">{licenseInfo.data.customer.name}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-700 font-semibold">نوع الترخيص:</span>
                <span className="text-blue-600 font-semibold">{getLicenseTypeName(licenseInfo.data.type)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-700 font-semibold">تاريخ الانتهاء:</span>
                <span className="text-gray-900">{new Date(licenseInfo.data.expires).toLocaleDateString('ar-EG')}</span>
              </div>
              {licenseInfo.daysRemaining !== undefined && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-gray-700 font-semibold">الأيام المتبقية:</span>
                  <span className="text-orange-600 font-bold">{licenseInfo.daysRemaining} يوم</span>
                </div>
              )}
            </div>

            {/* شريط معلومات الحفظ المشفر */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-3">
              <span className="material-icons-outlined text-green-600">shield</span>
              <p className="text-green-800 m-0 text-center">
                <span className="font-semibold">تم حفظ الترخيص محلياً (مشفر)</span>
                <span className="block text-sm text-green-700">يمكنك العمل بدون اتصال بالإنترنت</span>
              </p>
            </div>

            {/* زر تخطي والدخول */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={onActivate}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow"
              >
                <span className="material-icons-outlined">arrow_forward</span>
                تخطي والدخول
              </button>
            </div>
          </div>
        )}

        {/* Developer Info (inline on page) */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 shadow p-6">
          <div className="flex items-center justify-center mb-4">
            <span className="material-icons-outlined text-gray-700" style={{ fontSize: 28 }}>info</span>
            <h3 className="text-xl font-bold text-gray-800 mr-2">معلومات المطور</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
            <a href="tel:01023160657" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-blue-600">call</span>
                <div>
                  <div className="text-sm text-gray-500">الهاتف</div>
                  <div className="font-medium text-gray-800">01023160657</div>
                </div>
              </div>
              <span className="material-icons-outlined text-gray-400">chevron_left</span>
            </a>
            <a href="https://wa.me/201023160657" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-green-600">chat</span>
                <div>
                  <div className="text-sm text-gray-500">واتساب</div>
                  <div className="font-medium text-gray-800">01023160657</div>
                </div>
              </div>
              <span className="material-icons-outlined text-gray-400">chevron_left</span>
            </a>
            <a href="mailto:same7redaa@gmail.com" className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-red-600">mail</span>
                <div>
                  <div className="text-sm text-gray-500">الإيميل</div>
                  <div className="font-medium text-gray-800">same7redaa@gmail.com</div>
                </div>
              </div>
              <span className="material-icons-outlined text-gray-400">chevron_left</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-gray-600">نظام YSK POS - إدارة نقاط البيع والمخزون</p>
          <p className="text-gray-500 mt-1">للدعم الفني والمساعدة برجاء التواصل عبر البيانات أعلاه</p>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');

        /* قطع الورق المتطاير */
        .confetti-piece {
          position: absolute;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          transform: translate(-50%, -50%);
          animation: confetti-burst 1.2s ease-out forwards, confetti-tilt 1.2s ease-out forwards;
          will-change: transform, opacity;
        }
        @keyframes confetti-burst {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1); }
        }
        @keyframes confetti-tilt {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(720deg); }
        }
      `}</style>
    </div>
  );
};

export default ActivationPage;