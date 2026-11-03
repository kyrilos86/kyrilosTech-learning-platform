# 🎓 KyrilosTech Academy

منصة تعليمية احترافية متخصصة في تطوير الواجهات الأمامية.

---

## ✨ المميزات

- 🎨 تصميم Cyberpunk / Neon
- 📱 متجاوب مع جميع الأجهزة
- 🌐 دعم كامل للعربية (RTL)
- 🍔 قائمة موبايل (Hamburger)
- 🔝 زر Back to Top
- 📊 شريط تقدم التمرير
- ❓ أسئلة شائعة (FAQ)
- 🔍 بحث وفلترة في الكورسات
- 📄 صفحة تفاصيل لكل كورس (HTML & CSS / JavaScript)
- 🔐 حسابات حقيقية (Firebase Auth) أو وضع محلي احتياطي
- 📝 امتحانات تفاعلية مع مؤقت
- 📈 صفحة نتائج مع إحصائيات
- 🎓 شهادة إتمام قابلة للطباعة / الحفظ PDF لمن يجتاز الامتحان (60%+)
- 💬 نظام تقييمات وفيدباك
- 🚫 صفحة 404 مخصصة
- ☁️ نتائج وفيدباك على Firestore (أو localStorage في الوضع المحلي)

---

## 🛠️ التقنيات

- HTML5
- CSS3 (Animations, Grid, Flexbox)
- JavaScript ES6+
- Firebase Auth + Firestore (اختياري)
- localStorage (الوضع المحلي)

---

## 📁 الملفات

| الملف | الوصف |
|-------|-------|
| `index.html` | الرئيسية |
| `products.html` | قائمة الكورسات |
| `course-details.html?course=htmlcss\|javascript` | تفاصيل الكورس |
| `login.html` | تسجيل الدخول |
| `exam.html?course=htmlcss\|javascript` | الامتحان |
| `grades.html` | النتائج |
| `certificate.html` | الشهادة |
| `feedback.html` | الفيدباك |
| `404.html` | صفحة الخطأ |
| `style.css` / `script.js` | التنسيق والمنطق المشترك |
| `firebase-config.js` | إعدادات Firebase (null = وضع محلي) |
| `firebase-service.js` | ربط Firebase Auth و Firestore |
| `firestore.rules` | قواعد أمان قاعدة البيانات |
| `images/kyrilos.jpg` | صورة المؤسس |

---

## ☁️ تفعيل الحسابات والنتائج الحقيقية (Firebase)

افتراضياً الموقع بيشتغل بالوضع المحلي: كل زائر بياناته على جهازه بس. لتفعيل حسابات ونتائج حقيقية:

1. أنشئ مشروعاً على [Firebase Console](https://console.firebase.google.com).
2. **Authentication ← Sign-in method**: فعّل *Email/Password*.
3. **Firestore Database**: أنشئها، وبعدها من تبويب **Rules** الصق محتوى `firestore.rules` واضغط Publish.
4. **Project settings ← Your apps ← Web**: انسخ الإعدادات والصقها في `firebase-config.js` مكان `null`.
5. **Authentication ← Settings ← Authorized domains**: أضف `USERNAME.github.io`.
6. ارفع التعديلات على GitHub.

### ملاحظات أمان
- مفاتيح الـ Web config مش أسرار، والحماية الفعلية في `firestore.rules`.
- القواعد بتمنع أي طالب من قراءة نتائج غيره أو تعديل/حذف أي سجل، وبتتحقق من شكل البيانات.
- النتيجة بتتحسب في المتصفح، فمطوّر متمكّن يقدر يرسل درجة غير حقيقية. لو الشهادة رسمية فعلاً، الحل تصحيح الامتحان من الخادم (Cloud Functions).
