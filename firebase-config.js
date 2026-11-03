// ==============================================
// KYRILOSTECH // FIREBASE CONFIG
// ==============================================
// اتركها null لتشغيل الموقع بالوضع المحلي (البيانات داخل متصفح كل زائر فقط).
//
// لتفعيل الحسابات والنتائج الحقيقية:
//   1) أنشئ مشروع على https://console.firebase.google.com
//   2) فعّل Authentication ← Sign-in method ← Email/Password
//   3) أنشئ Firestore Database (Production mode) والصق محتوى firestore.rules في Rules
//   4) Project settings ← Your apps ← Web app ← انسخ الإعدادات هنا بدل null
//   5) Authentication ← Settings ← Authorized domains ← أضف <username>.github.io
//
// مفاتيح الـ Web config ليست أسراراً، الحماية الحقيقية في firestore.rules.
//
// مثال:
// window.KT_FIREBASE_CONFIG = {
//     apiKey: "AIza...",
//     authDomain: "your-project.firebaseapp.com",
//     projectId: "your-project",
//     appId: "1:1234567890:web:abcdef"
// };

window.KT_FIREBASE_CONFIG = null;
