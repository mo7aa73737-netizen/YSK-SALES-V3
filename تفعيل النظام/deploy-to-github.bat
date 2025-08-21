@echo off
echo ========================================
echo    رفع تحديث YSK License Manager PWA
echo ========================================
echo.

echo جاري إضافة جميع الملفات...
git add .

echo.
echo جاري عمل commit للتحديثات...
git commit -m "Update: PWA ready with YSK PHONE.png icon and GitHub Pages deployment"

echo.
echo جاري رفع التحديث على GitHub...
git push origin main

echo.
echo ========================================
echo تم رفع التحديث بنجاح! 
echo الرابط: https://mo7aa73737-netizen.github.io/license-YSK/
echo ========================================
echo.

pause