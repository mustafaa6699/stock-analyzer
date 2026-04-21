# محلل الأسهم الذكي Pro 📊

تطبيق تحليل الأسهم المدعوم بـ Claude AI

## خطوات الرفع على Vercel (5 دقائق)

### الخطوة 1 — رفع على GitHub

1. اذهب إلى **github.com** وسجّل دخول
2. اضغط **New repository**
3. اسم المشروع: `stock-analyzer`
4. اضغط **Create repository**
5. في الصفحة الجديدة اضغط **uploading an existing file**
6. ارفع جميع الملفات (package.json + مجلد src + مجلد public)
7. اضغط **Commit changes**

### الخطوة 2 — نشر على Vercel

1. اذهب إلى **vercel.com** وسجّل بحساب GitHub
2. اضغط **New Project**
3. اختر مشروع `stock-analyzer`
4. اضغط **Deploy** — انتظر دقيقة واحدة
5. ستحصل على رابط مثل: `stock-analyzer.vercel.app`

### الخطوة 3 — الاستخدام

1. افتح الرابط من أي جهاز
2. أدخل مفتاح Anthropic API (يُحفظ في المتصفح)
3. أدخل رمز السهم وابدأ التحليل 🚀

## ملاحظات

- المفتاح يُحفظ في localStorage ولا يُرسل لأي خادم
- يعمل على الجوال والكمبيوتر
- مجاني بالكامل على Vercel

## المتطلبات

- Node.js 16+
- مفتاح Anthropic API من console.anthropic.com
