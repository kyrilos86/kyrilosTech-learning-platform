// ==============================================
// KYRILOSTECH // FIREBASE SERVICE (ES module)
// يعمل فقط لو firebase-config.js فيه إعدادات حقيقية
// ==============================================

(async function () {
    var cfg = window.KT_FIREBASE_CONFIG;
    if (!cfg) return;

    try {
        var V = 'https://www.gstatic.com/firebasejs/10.12.2/';
        var mods = await Promise.all([
            import(V + 'firebase-app.js'),
            import(V + 'firebase-auth.js'),
            import(V + 'firebase-firestore.js')
        ]);
        var A = mods[0], Au = mods[1], F = mods[2];

        var app = A.initializeApp(cfg);
        var auth = Au.getAuth(app);
        var db = F.getFirestore(app);

        var authReady = new Promise(function (resolve) {
            var off = Au.onAuthStateChanged(auth, function (u) {
                if (typeof off === 'function') off();
                resolve(u);
            });
        });

        function toUser(u) {
            if (!u) return null;
            return {
                uid: u.uid,
                email: u.email,
                name: u.displayName || (u.email ? u.email.split('@')[0] : 'طالب')
            };
        }

        function plain(d) {
            var x = d.data();
            delete x.createdAt;
            x.id = d.id;
            return x;
        }

        var api = {
            mode: 'cloud',

            getUser: function () {
                return authReady.then(function () { return toUser(auth.currentUser); });
            },

            register: async function (o) {
                var cred = await Au.createUserWithEmailAndPassword(auth, o.email, o.password);
                await Au.updateProfile(cred.user, { displayName: o.name });
                return toUser(auth.currentUser);
            },

            login: async function (o) {
                await Au.signInWithEmailAndPassword(auth, o.email, o.password);
                return toUser(auth.currentUser);
            },

            logout: function () { return Au.signOut(auth); },

            resetPassword: function (email) { return Au.sendPasswordResetEmail(auth, email); },

            saveResult: async function (r) {
                var u = auth.currentUser;
                if (!u) throw new Error('not-logged-in');
                var ref = await F.addDoc(F.collection(db, 'results'), {
                    uid: u.uid,
                    student: (u.displayName || 'طالب').slice(0, 60),
                    course: r.course,
                    courseName: r.courseName,
                    correct: r.correct,
                    total: r.total,
                    percentage: r.percentage,
                    passed: r.passed,
                    date: r.date,
                    createdAt: F.serverTimestamp()
                });
                return ref.id;
            },

            getResults: async function () {
                var u = auth.currentUser;
                if (!u) return [];
                var snap = await F.getDocs(F.query(F.collection(db, 'results'), F.where('uid', '==', u.uid)));
                return snap.docs.map(plain);
            },

            getResult: async function (id) {
                var u = auth.currentUser;
                if (!u || !id) return null;
                try {
                    var d = await F.getDoc(F.doc(db, 'results', id));
                    if (!d.exists()) return null;
                    var x = plain(d);
                    return x.uid === u.uid ? x : null;
                } catch (err) { return null; }
            },

            addFeedback: async function (f) {
                var u = auth.currentUser;
                if (!u) throw new Error('not-logged-in');
                await F.addDoc(F.collection(db, 'feedbacks'), {
                    uid: u.uid,
                    name: f.name,
                    course: f.course,
                    rating: f.rating,
                    comment: f.comment,
                    createdAt: F.serverTimestamp()
                });
            },

            getFeedbacks: async function () {
                var snap = await F.getDocs(F.query(
                    F.collection(db, 'feedbacks'), F.orderBy('createdAt', 'desc'), F.limit(50)
                ));
                return snap.docs.map(function (d) {
                    var x = d.data();
                    var t = x.createdAt && x.createdAt.toDate ? x.createdAt.toDate() : new Date();
                    return { name: x.name, course: x.course, rating: x.rating, comment: x.comment, date: t.toISOString() };
                });
            }
        };

        window.__ktCloudResolve(api);
    } catch (err) {
        if (window.__ktCloudReject) window.__ktCloudReject(err);
    }
})();
