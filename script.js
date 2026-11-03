// ==============================================
// KYRILOSTECH // MAIN SCRIPT
// وضعين للتخزين:
//   local : بيانات داخل متصفح كل زائر (الافتراضي)
//   cloud : Firebase (حسابات ونتائج حقيقية) لما firebase-config.js يتملّي
// ==============================================

(function () {
    'use strict';

    // ========== HELPERS ==========
    function $(id) { return document.getElementById(id); }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function lsStr(key) {
        try { return localStorage.getItem(key) || ''; } catch (err) { return ''; }
    }

    function lsArr(key) {
        try {
            var v = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(v) ? v : [];
        } catch (err) { return []; }
    }

    function lsSave(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error(err); }
    }

    var COURSE_NAMES = { htmlcss: 'HTML & CSS', javascript: 'JavaScript' };
    var COURSE_ICONS = { htmlcss: '🌐', javascript: '⚡' };

    // ========== STORES ==========
    var LocalStore = {
        mode: 'local',

        getUser: function () {
            var email = lsStr('studentEmail');
            if (!email) return Promise.resolve(null);
            return Promise.resolve({ uid: email, email: email, name: lsStr('studentName') || 'طالب' });
        },

        login: function (o) {
            var name = o.name || o.email.split('@')[0];
            try {
                localStorage.setItem('studentName', name);
                localStorage.setItem('studentEmail', o.email);
            } catch (err) { console.error(err); }
            return Promise.resolve({ uid: o.email, email: o.email, name: name });
        },

        logout: function () {
            try {
                localStorage.removeItem('studentName');
                localStorage.removeItem('studentEmail');
            } catch (err) { console.error(err); }
            return Promise.resolve();
        },

        resetPassword: function () {
            return Promise.reject({ code: 'local/unsupported' });
        },

        saveResult: function (r) {
            var all = lsArr('examResults');
            var rec = Object.assign({
                id: r.date,
                student: lsStr('studentName') || 'طالب',
                email: lsStr('studentEmail')
            }, r);
            all.push(rec);
            lsSave('examResults', all);
            return Promise.resolve(rec.id);
        },

        getResults: function () {
            var email = lsStr('studentEmail');
            return Promise.resolve(lsArr('examResults').filter(function (r) {
                return email && r.email === email;
            }).map(function (r) {
                r.id = r.id || r.date;
                return r;
            }));
        },

        getResult: function (id) {
            return LocalStore.getResults().then(function (list) {
                return list.filter(function (r) { return r.id === id; })[0] || null;
            });
        },

        addFeedback: function (f) {
            var all = lsArr('feedbacks');
            all.push({ name: f.name, course: f.course, rating: f.rating, comment: f.comment, date: new Date().toISOString() });
            lsSave('feedbacks', all);
            return Promise.resolve();
        },

        getFeedbacks: function () {
            return Promise.resolve(lsArr('feedbacks'));
        }
    };
    LocalStore.register = LocalStore.login;

    var Store = LocalStore;

    var CLOUD_ON = !!window.KT_FIREBASE_CONFIG;
    var cloudPromise = CLOUD_ON ? new Promise(function (resolve, reject) {
        window.__ktCloudResolve = resolve;
        window.__ktCloudReject = reject;
        setTimeout(function () { reject(new Error('cloud-timeout')); }, 15000);
    }) : null;

    function authMessage(err) {
        var code = (err && err.code) || '';
        var map = {
            'auth/invalid-credential': 'الإيميل أو كلمة المرور غلط.',
            'auth/wrong-password': 'الإيميل أو كلمة المرور غلط.',
            'auth/user-not-found': 'الإيميل أو كلمة المرور غلط.',
            'auth/invalid-email': 'الإيميل مش مكتوب صح.',
            'auth/email-already-in-use': 'الإيميل ده مسجّل قبل كده. جرّب تسجيل الدخول.',
            'auth/weak-password': 'كلمة المرور ضعيفة، اكتب 6 حروف أو أرقام على الأقل.',
            'auth/too-many-requests': 'محاولات كتير. استنى شوية وجرّب تاني.',
            'auth/network-request-failed': 'مفيش اتصال بالإنترنت. جرّب تاني.',
            'auth/operation-not-allowed': 'تسجيل الدخول بالإيميل مش مفعّل في إعدادات Firebase.',
            'auth/unauthorized-domain': 'الدومين ده مش مضاف في Authorized domains في Firebase.',
            'local/unsupported': 'استرجاع كلمة المرور مش متاح في الوضع المحلي.'
        };
        return map[code] || 'حصل خطأ غير متوقع. جرّب تاني.';
    }

    // ========== 1. PARTICLES ==========
    var particlesContainer = $('particles');
    if (particlesContainer) {
        var pCount = window.innerWidth < 700 ? 18 : 50;
        for (var i = 0; i < pCount; i++) {
            var p = document.createElement('span');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (6 + Math.random() * 12) + 's';
            p.style.animationDelay = (-Math.random() * 15) + 's';
            particlesContainer.appendChild(p);
        }
    }

    // ========== 2. MOBILE MENU ==========
    var navbar = document.querySelector('.navbar');
    var navLinks = document.querySelector('.nav-links');
    if (navbar && navLinks) {
        var hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.setAttribute('aria-label', 'القائمة');
        hamburger.innerHTML = '<span></span><span></span><span></span>';
        navbar.appendChild(hamburger);

        var mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = navLinks.innerHTML;
        document.body.appendChild(mobileMenu);

        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ========== 3. BACK TO TOP ==========
    var backBtn = document.createElement('button');
    backBtn.className = 'back-to-top';
    backBtn.innerHTML = '↑';
    backBtn.setAttribute('aria-label', 'الرجوع للأعلى');
    document.body.appendChild(backBtn);

    // ========== 4. SCROLL PROGRESS ==========
    var progress = document.createElement('div');
    progress.className = 'scroll-progress';
    document.body.appendChild(progress);

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                var scrollTop = window.scrollY;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                progress.style.width = percent + '%';

                if (scrollTop > 400) {
                    backBtn.classList.add('show');
                } else {
                    backBtn.classList.remove('show');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    backBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ========== 5. FAQ ACCORDION ==========
    document.querySelectorAll('.faq-item').forEach(function (item) {
        var q = item.querySelector('.faq-question');
        if (!q) return;
        q.addEventListener('click', function () {
            item.classList.toggle('active');
        });
    });

    // ========== 6. PRODUCTS FILTER + SEARCH ==========
    var filterBtns = document.querySelectorAll('.filter-btn');
    var productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            filterBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            var filter = btn.getAttribute('data-filter');
            productCards.forEach(function (card) {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    var searchInput = $('courseSearch');
    if (searchInput) {
        var searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
                var q = searchInput.value.trim().toLowerCase();
                productCards.forEach(function (card) {
                    var title = card.querySelector('h3');
                    var desc = card.querySelector('p');
                    var text = ((title ? title.textContent : '') + ' ' + (desc ? desc.textContent : '')).toLowerCase();
                    card.style.display = text.indexOf(q) !== -1 ? 'flex' : 'none';
                });
            }, 200);
        });
    }

    // ========== COURSE DETAILS (no account needed) ==========
    var curriculumList = $('curriculumList');
    if (curriculumList) {
        var COURSES = {
            htmlcss: {
                title: 'احترف HTML & CSS',
                desc: 'برنامج تدريبي شامل لبناء واجهات ويب احترافية وفق أحدث المعايير العالمية.',
                duration: '12 ساعة', lessons: '30 درس', level: 'مبتدئ',
                img: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=300&h=300&fit=crop',
                items: [
                    ['📘', 'أساسيات HTML5', 'هيكلة المستندات والوسوم الأساسية والمتقدمة.'],
                    ['🎨', 'تنسيقات CSS3', 'الألوان، الخطوط، الحدود، الظلال والانتقالات.'],
                    ['📐', 'Flexbox & Grid', 'بناء تخطيطات احترافية باستخدام أحدث تقنيات CSS.'],
                    ['📱', 'التصميم المتجاوب', 'Media Queries للتوافق مع جميع الأجهزة.'],
                    ['🚀', 'مشروع تطبيقي', 'بناء موقع كامل من الصفر.']
                ]
            },
            javascript: {
                title: 'احترف JavaScript',
                desc: 'برنامج تدريبي متقدم لإتقان لغة JavaScript من الأساسيات وحتى بناء التطبيقات التفاعلية.',
                duration: '18 ساعة', lessons: '30 درس', level: 'مبتدئ - متوسط',
                img: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=300&h=300&fit=crop',
                items: [
                    ['📦', 'المتغيرات والدوال', 'let / const، أنواع البيانات، الدوال والـ Scope.'],
                    ['🌳', 'التحكم في الـ DOM', 'اختيار العناصر وتعديلها وإنشاء عناصر ديناميكية.'],
                    ['🖱️', 'معالجة الأحداث', 'Events والتفاعل مع المستخدم.'],
                    ['⚡', 'ES6+', 'Arrow Functions، Destructuring، Modules وغيرها.'],
                    ['⏳', 'Async / Await', 'Promises والتعامل مع البيانات غير المتزامنة.'],
                    ['🚀', 'مشروع تطبيقي', 'بناء تطبيق تفاعلي كامل.']
                ]
            }
        };

        var cKey = new URLSearchParams(window.location.search).get('course');
        if (!COURSES[cKey]) cKey = 'htmlcss';
        var c = COURSES[cKey];

        $('pageTitle').textContent = 'KyrilosTech // ' + c.title;
        $('courseTitle').textContent = c.title;
        $('courseDesc').textContent = c.desc;
        $('metaDuration').textContent = c.duration;
        $('metaLessons').textContent = c.lessons;
        $('metaLevel').textContent = c.level;
        var cImg = $('courseImg');
        cImg.src = c.img; cImg.alt = c.title;
        $('examLink').setAttribute('href', 'exam.html?course=' + cKey);

        curriculumList.innerHTML = c.items.map(function (it) {
            return '<div class="curriculum-item"><div class="curriculum-icon">' + it[0] + '</div>' +
                '<div class="curriculum-info"><h3>' + it[1] + '</h3><p>' + it[2] + '</p></div></div>';
        }).join('');
    }

    // ========== STORE INIT (everything below needs the account state) ==========
    function showBanner(text) {
        var main = document.querySelector('main');
        if (!main) return;
        var b = document.createElement('div');
        b.className = 'notice-bar';
        b.style.margin = '20px';
        b.textContent = text;
        main.insertBefore(b, main.firstChild);
    }

    var ready = (CLOUD_ON
        ? cloudPromise.then(function (api) { Store = api; }, function (err) {
            console.error(err);
            Store = LocalStore;
            showBanner('⚠️ تعذّر الاتصال بخدمة الحسابات حالياً، والموقع شغال بالوضع المحلي.');
        })
        : Promise.resolve()
    ).then(function () {
        return Store.getUser();
    }).catch(function (err) {
        console.error(err);
        return null;
    });

    window.KT = {
        ready: ready,
        escapeHtml: escapeHtml,
        getStore: function () { return Store; }
    };

    ready.then(function (user) {
        initNav(user);
        initLogin(user);
        initExam(user);
        initGrades(user);
        initFeedback(user);
    });

    // ----- nav -----
    function initNav(user) {
        if (!user) return;
        document.querySelectorAll('[data-login-link]').forEach(function (a) {
            a.textContent = '👤 ' + String(user.name).split(' ')[0];
            a.setAttribute('href', 'grades.html');
            a.classList.add('logged');
        });
    }

    // ----- login -----
    function initLogin(user) {
        var form = $('loginForm');
        if (!form) return;

        var cloud = Store.mode === 'cloud';
        var mode = 'login';

        var nameField = $('nameField');
        var passField = $('passwordField');
        var nameInput = $('name');
        var emailInput = $('email');
        var passInput = $('password');
        var eyeBtn = $('eye');
        var toggleBtn = $('modeToggle');
        var forgotLink = $('forgotLink');
        var noteEl = $('loginNote');
        var submitBtn = $('loginSubmit');
        var msgEl = $('loginError');
        var success = $('success');

        function setMsg(text, ok) {
            msgEl.textContent = text || '';
            msgEl.className = 'login-msg' + (text ? (ok ? ' ok' : ' error') : '');
        }

        function setMode(m) {
            mode = m;
            setMsg('');
            if (!cloud) {
                nameField.hidden = false;
                passField.hidden = true;
                toggleBtn.hidden = true;
                forgotLink.hidden = true;
                noteEl.textContent = '🔒 بياناتك بتتحفظ على جهازك فقط ومبتتبعتش لأي سيرفر.';
                submitBtn.textContent = 'تسجيل الدخول →';
                return;
            }
            var reg = m === 'register';
            nameField.hidden = !reg;
            passField.hidden = false;
            forgotLink.hidden = reg;
            toggleBtn.hidden = false;
            toggleBtn.textContent = reg ? 'عندي حساب بالفعل؟ سجّل دخولك' : 'مفيش عندك حساب؟ أنشئ حساب جديد';
            passInput.setAttribute('autocomplete', reg ? 'new-password' : 'current-password');
            noteEl.textContent = reg
                ? '🔒 كلمة المرور بتتخزّن مشفّرة عند Firebase ومش بشوفها أنا.'
                : '🔒 سجّل دخولك علشان تدخل الامتحان وتشوف نتايجك.';
            submitBtn.textContent = reg ? 'إنشاء الحساب →' : 'تسجيل الدخول →';
        }

        if (eyeBtn) {
            eyeBtn.addEventListener('click', function () {
                var hidden = passInput.type === 'password';
                passInput.type = hidden ? 'text' : 'password';
                eyeBtn.textContent = hidden ? '◎' : '◉';
            });
        }

        toggleBtn.addEventListener('click', function () {
            setMode(mode === 'login' ? 'register' : 'login');
        });

        forgotLink.addEventListener('click', function (e) {
            e.preventDefault();
            var email = emailInput.value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                setMsg('اكتب إيميلك في الخانة الأول وبعدين دوس "نسيت كلمة المرور".');
                return;
            }
            Store.resetPassword(email).then(function () {
                setMsg('بعتنالك رسالة على الإيميل لتغيير كلمة المرور. شوف الـ Spam كمان.', true);
            }).catch(function (err) { setMsg(authMessage(err)); });
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            setMsg('');

            var name = nameInput.value.trim();
            var email = emailInput.value.trim();
            var password = passInput.value;
            var needName = !cloud || mode === 'register';

            if (needName && name.length < 2) { setMsg('من فضلك اكتب اسمك.'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg('من فضلك اكتب بريد إلكتروني صحيح.'); return; }
            if (cloud && password.length < 6) { setMsg('كلمة المرور لازم تكون 6 حروف أو أرقام على الأقل.'); return; }

            submitBtn.disabled = true;
            var payload = { name: name, email: email, password: password };
            var action = (cloud && mode === 'login') ? Store.login(payload) : Store.register(payload);

            action.then(function () {
                if (success) success.classList.add('active');
                setTimeout(function () {
                    var next = new URLSearchParams(window.location.search).get('next');
                    var allowed = ['exam.html', 'grades.html', 'products.html', 'feedback.html', 'index.html'];
                    window.location.href = allowed.indexOf(next) !== -1 ? next : 'index.html';
                }, 1200);
            }).catch(function (err) {
                console.error(err);
                setMsg(authMessage(err));
                submitBtn.disabled = false;
            });
        });

        setMode('login');
    }

    // ----- exam -----
    function initExam(user) {
        var questionsContainer = $('questionsContainer');
        if (!questionsContainer) return;

        // exam is for logged-in students only
        if (!user) {
            var examBox = document.querySelector('.exam-container');
            if (examBox) {
                examBox.innerHTML =
                    '<div class="empty-state">' +
                    '<div class="empty-icon">🔒</div>' +
                    '<div class="empty-title">الامتحان للطلاب المسجّلين فقط</div>' +
                    '<p class="empty-text">سجّل دخولك الأول علشان تبدأ الامتحان وتتسجل نتيجتك وتحمّل شهادتك.</p>' +
                    '<a href="login.html?next=exam.html" class="exam-btn">تسجيل الدخول</a>' +
                    '</div>';
            }
            return;
        }

        var QUESTIONS = {
            htmlcss: [
                { q: 'ما هو الوسم الصحيح لإنشاء رابط في HTML؟', options: ['link', 'a', 'href', 'url'], correct: 1 },
                { q: 'أي خاصية CSS تستخدم لتغيير لون النص؟', options: ['font-color', 'text-color', 'color', 'fill'], correct: 2 },
                { q: 'ما هي القيمة الصحيحة لجعل العنصر Flex Container؟', options: ['display: flex', 'flex: 1', 'display: block', 'position: flex'], correct: 0 },
                { q: 'أي وسم يُستخدم لعرض صورة في HTML؟', options: ['picture', 'image', 'img', 'photo'], correct: 2 },
                { q: 'ما هي القيمة المستخدمة لإنشاء شبكة (Grid) في CSS؟', options: ['display: grid', 'display: table', 'layout: grid', 'grid: 1'], correct: 0 },
                { q: 'أي وسم يمثّل أكبر عنوان رئيسي في الصفحة؟', options: ['<h6>', '<h1>', '<head>', '<title>'], correct: 1 },
                { q: 'أي خاصية CSS تغيّر حجم الخط؟', options: ['text-size', 'font-style', 'size', 'font-size'], correct: 3 },
                { q: 'أي Media Query يُطبَّق على الشاشات التي عرضها 600px أو أقل؟', options: ['@media (max-width: 600px)', '@media (min-width: 600px)', '@media screen-small', '@media (width < 600)'], correct: 0 },
                { q: 'أي خاصية تضيف مسافة داخل حدود العنصر (بين المحتوى والحدود)؟', options: ['margin', 'padding', 'border', 'gap'], correct: 1 },
                { q: 'أي وسم يُستخدم لإنشاء قائمة غير مرتبة (نقاط)؟', options: ['<ol>', '<li>', '<ul>', '<list>'], correct: 2 }
            ],
            javascript: [
                { q: 'ما هي الطريقة الصحيحة لتعريف متغير في ES6؟', options: ['var name = 5', 'let name = 5', 'variable name = 5', 'dim name = 5'], correct: 1 },
                { q: 'ما هي الدالة المستخدمة للطباعة في Console؟', options: ['print()', 'console.write()', 'console.log()', 'log.console()'], correct: 2 },
                { q: 'ما هي نتيجة: typeof "hello" ؟', options: ['text', 'word', 'string', 'char'], correct: 2 },
                { q: 'أي دالة تستخدم لتحويل نص إلى رقم صحيح؟', options: ['parseString()', 'toString()', 'parseInt()', 'toNumber()'], correct: 2 },
                { q: 'الـ DOM اختصار لـ؟', options: ['Data Object Model', 'Digital Order Method', 'Dynamic Output Machine', 'Document Object Model'], correct: 3 },
                { q: 'ما هي نتيجة: 2 + "2" ؟', options: ['4', '22', 'NaN', 'خطأ'], correct: 1 },
                { q: 'أي دالة تحدد عنصراً في الصفحة عن طريق الـ id؟', options: ['document.getElementById()', 'document.queryId()', 'document.findById()', 'document.selectId()'], correct: 0 },
                { q: 'أي كلمة تعرّف متغيراً لا يمكن إعادة إسناد قيمته؟', options: ['let', 'var', 'const', 'static'], correct: 2 },
                { q: 'ما وظيفة addEventListener؟', options: ['إضافة عنصر جديد للصفحة', 'حذف عنصر من الصفحة', 'تغيير لون العنصر', 'ربط دالة بحدث مثل click على عنصر'], correct: 3 },
                { q: 'أي كلمة تُستخدم لانتظار نتيجة Promise داخل دالة async؟', options: ['wait', 'pause', 'await', 'hold'], correct: 2 }
            ]
        };

        var EXAM_SECONDS = 600;
        var currentCourse = 'htmlcss';
        var currentAnswers = {};
        var timerInterval = null;
        var timeLeft = EXAM_SECONDS;
        var submitted = false;

        var courseSelector = $('courseSelector');
        var examHeader = $('examHeader');
        var examActions = $('examActions');
        var resultContainer = $('resultContainer');
        var examTitle = $('examTitle');
        var progressText = $('progressText');
        var timerEl = $('timer');
        var submitBtn = $('submitBtn');
        var resetBtn = $('resetBtn');

        // preselect course from ?course=
        var qsCourse = new URLSearchParams(window.location.search).get('course');
        if (qsCourse && QUESTIONS[qsCourse]) {
            currentCourse = qsCourse;
            if (courseSelector) {
                courseSelector.querySelectorAll('.course-select-btn').forEach(function (b) {
                    b.classList.toggle('active', b.getAttribute('data-course') === qsCourse);
                });
            }
        }

        function startExam() {
            currentAnswers = {};
            submitted = false;
            timeLeft = EXAM_SECONDS;
            if (examTitle) examTitle.textContent = 'امتحان ' + COURSE_NAMES[currentCourse];
            questionsContainer.innerHTML = '';
            if (resultContainer) resultContainer.innerHTML = '';
            if (examHeader) examHeader.style.display = 'flex';
            if (examActions) examActions.style.display = 'flex';

            QUESTIONS[currentCourse].forEach(function (q, index) {
                var card = document.createElement('div');
                card.className = 'question-card';

                var optionsHTML = '';
                q.options.forEach(function (opt, i) {
                    optionsHTML += '<div class="option-item" data-q="' + index + '" data-opt="' + i + '">' +
                        '<div class="option-radio"></div>' +
                        '<div class="option-text" dir="auto">' + escapeHtml(opt) + '</div>' +
                        '</div>';
                });

                card.innerHTML =
                    '<span class="question-number">Q' + (index + 1) + '</span>' +
                    '<div class="question-text">' + escapeHtml(q.q) + '</div>' +
                    '<div class="options-list">' + optionsHTML + '</div>';

                questionsContainer.appendChild(card);
            });

            startTimer();
            updateProgress();
        }

        questionsContainer.addEventListener('click', function (e) {
            var item = e.target.closest('.option-item');
            if (!item) return;

            var qIdx = item.getAttribute('data-q');
            var optIdx = item.getAttribute('data-opt');

            questionsContainer.querySelectorAll('.option-item[data-q="' + qIdx + '"]')
                .forEach(function (el) { el.classList.remove('selected'); });

            item.classList.add('selected');
            currentAnswers[qIdx] = parseInt(optIdx, 10);
            updateProgress();
        });

        function updateProgress() {
            var total = QUESTIONS[currentCourse].length;
            var answered = Object.keys(currentAnswers).length;
            if (progressText) progressText.textContent = 'تم الإجابة على ' + answered + ' من ' + total;
        }

        function startTimer() {
            clearInterval(timerInterval);
            if (!timerEl) return;
            timerEl.classList.remove('warning');
            updateTimerDisplay();

            timerInterval = setInterval(function () {
                timeLeft--;
                updateTimerDisplay();
                if (timeLeft <= 60) timerEl.classList.add('warning');
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    submitExam(true);
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            if (!timerEl) return;
            var m = Math.floor(timeLeft / 60);
            var s = timeLeft % 60;
            timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }

        function submitExam(timeUp) {
            if (submitted) return;
            submitted = true;
            clearInterval(timerInterval);

            var questions = QUESTIONS[currentCourse];
            var correct = 0;
            questions.forEach(function (q, i) {
                if (currentAnswers[i] === q.correct) correct++;
            });

            var total = questions.length;
            var percentage = Math.round((correct / total) * 100);
            var passed = percentage >= 60;

            var result = {
                course: currentCourse,
                courseName: COURSE_NAMES[currentCourse],
                icon: COURSE_ICONS[currentCourse],
                correct: correct,
                total: total,
                percentage: percentage,
                passed: passed,
                date: new Date().toISOString()
            };

            Store.saveResult(result).then(function () {
                showResult(correct, total, percentage, passed, timeUp, true);
            }).catch(function (err) {
                console.error(err);
                showResult(correct, total, percentage, passed, timeUp, false);
            });
        }

        function showResult(correct, total, percentage, passed, timeUp, saved) {
            if (examHeader) examHeader.style.display = 'none';
            if (examActions) examActions.style.display = 'none';
            questionsContainer.innerHTML = '';

            var message = timeUp
                ? 'انتهى الوقت! تم تسليم الامتحان تلقائياً.'
                : (passed ? 'مبروك! لقد اجتزت الامتحان بنجاح.' : 'للأسف لم تجتز الامتحان. حاول مرة أخرى.');
            if (!saved) message += ' ⚠️ تعذّر حفظ النتيجة، تأكد من اتصالك بالإنترنت وأعد المحاولة.';

            if (resultContainer) {
                resultContainer.innerHTML =
                    '<div class="result-card">' +
                    '<div class="result-score">' + correct + '<span>/' + total + '</span></div>' +
                    '<div class="result-status ' + (passed ? 'pass' : 'fail') + '">' +
                    (passed ? '✓ ناجح' : '✗ لم تجتز') + '</div>' +
                    '<div class="result-bar"><div class="result-fill" id="resultFill"></div></div>' +
                    '<p class="result-message">' + message + '</p>' +
                    '<div class="exam-actions">' +
                    '<a href="grades.html" class="exam-btn">عرض النتائج</a>' +
                    '<button class="exam-btn secondary" id="retryBtn" type="button">إعادة الامتحان</button>' +
                    '</div></div>';
            }

            setTimeout(function () {
                var fill = $('resultFill');
                if (fill) fill.style.width = percentage + '%';
            }, 200);

            var retry = $('retryBtn');
            if (retry) retry.addEventListener('click', startExam);
        }

        if (courseSelector) {
            courseSelector.addEventListener('click', function (e) {
                var btn = e.target.closest('.course-select-btn');
                if (!btn) return;

                courseSelector.querySelectorAll('.course-select-btn')
                    .forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');

                currentCourse = btn.getAttribute('data-course');
                startExam();
            });
        }

        if (submitBtn) submitBtn.addEventListener('click', function () {
            var left = QUESTIONS[currentCourse].length - Object.keys(currentAnswers).length;
            if (left > 0 && !confirm('لسه فاضل ' + left + ' سؤال من غير إجابة. تسلّم الامتحان؟')) return;
            submitExam(false);
        });
        if (resetBtn) resetBtn.addEventListener('click', startExam);

        startExam();
    }

    // ----- grades -----
    function initGrades(user) {
        var gradesList = $('gradesList');
        if (!gradesList) return;

        var statsGrid = $('statsGrid');
        var logoutBtn = $('logoutBtn');

        $('studentName').textContent = user ? user.name : 'طالب مجهول';
        $('studentEmail').textContent = user ? user.email : 'سجّل دخولك أولاً';
        $('studentAvatar').textContent = user ? String(user.name).charAt(0).toUpperCase() : '؟';

        if (logoutBtn && user) {
            logoutBtn.style.display = '';
            logoutBtn.addEventListener('click', function () {
                Store.logout().then(function () {
                    window.location.href = 'login.html';
                });
            });
        }

        if (!user) {
            if (statsGrid) statsGrid.innerHTML = '';
            gradesList.innerHTML =
                '<div class="empty-state">' +
                '<div class="empty-icon">🔒</div>' +
                '<div class="empty-title">سجّل دخولك الأول</div>' +
                '<p class="empty-text">لازم تسجّل دخولك علشان تشوف نتايجك وتحمّل الشهادة.</p>' +
                '<a href="login.html?next=grades.html" class="exam-btn">تسجيل الدخول</a>' +
                '</div>';
            return;
        }

        Store.getResults().then(function (myResults) {
            if (myResults.length === 0) {
                if (statsGrid) statsGrid.innerHTML = '';
                gradesList.innerHTML =
                    '<div class="empty-state">' +
                    '<div class="empty-icon">📊</div>' +
                    '<div class="empty-title">لا توجد نتائج بعد</div>' +
                    '<p class="empty-text">لم تقم بأداء أي امتحان حتى الآن.</p>' +
                    '<a href="exam.html" class="exam-btn">ابدأ الامتحان</a>' +
                    '</div>';
                return;
            }

            var totalExams = myResults.length;
            var avgScore = Math.round(myResults.reduce(function (s, r) { return s + r.percentage; }, 0) / totalExams);
            var bestScore = Math.max.apply(null, myResults.map(function (r) { return r.percentage; }));
            var uniqueCourses = new Set(myResults.map(function (r) { return r.course; })).size;

            if (statsGrid) {
                statsGrid.innerHTML =
                    '<div class="stat-box"><div class="stat-box-value">' + totalExams + '</div><div class="stat-box-label">إجمالي الامتحانات</div></div>' +
                    '<div class="stat-box"><div class="stat-box-value">' + avgScore + '%</div><div class="stat-box-label">المتوسط العام</div></div>' +
                    '<div class="stat-box"><div class="stat-box-value">' + bestScore + '%</div><div class="stat-box-label">أعلى درجة</div></div>' +
                    '<div class="stat-box"><div class="stat-box-value">' + uniqueCourses + '</div><div class="stat-box-label">كورسات مُختبرة</div></div>';
            }

            var sorted = myResults.slice().sort(function (a, b) {
                return new Date(b.date) - new Date(a.date);
            });

            gradesList.innerHTML = sorted.map(function (r) {
                var cls = 'poor';
                if (r.percentage >= 85) cls = 'excellent';
                else if (r.percentage >= 70) cls = 'good';
                else if (r.percentage >= 50) cls = 'average';

                var dateStr = new Date(r.date).toLocaleDateString('ar-EG', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                return '<div class="grade-card">' +
                    '<div class="grade-icon">' + (COURSE_ICONS[r.course] || '📚') + '</div>' +
                    '<div class="grade-info">' +
                    '<div class="grade-course-name">' + escapeHtml(r.courseName) + '</div>' +
                    '<div class="grade-meta">📅 ' + dateStr + ' • ' + r.correct + ' من ' + r.total + '</div>' +
                    '<div class="grade-bar"><div class="grade-fill ' + cls + '" data-width="' + Number(r.percentage) + '"></div></div>' +
                    '</div>' +
                    '<div class="grade-score">' +
                    '<div class="grade-score-value">' + Number(r.percentage) + '%</div>' +
                    '<div class="grade-score-label">' + (r.passed ? '✓ ناجح' : '✗ راسب') + '</div>' +
                    (r.passed ? '<a class="cert-btn" href="certificate.html?d=' + encodeURIComponent(r.id) + '">🎓 تحميل الشهادة</a>' : '') +
                    '</div></div>';
            }).join('');

            setTimeout(function () {
                document.querySelectorAll('.grade-fill').forEach(function (el) {
                    el.style.width = el.getAttribute('data-width') + '%';
                });
            }, 300);
        }).catch(function (err) {
            console.error(err);
            gradesList.innerHTML =
                '<div class="empty-state">' +
                '<div class="empty-icon">⚠️</div>' +
                '<div class="empty-title">تعذّر تحميل النتائج</div>' +
                '<p class="empty-text">تأكد من اتصالك بالإنترنت وحدّث الصفحة.</p>' +
                '</div>';
        });
    }

    // ----- feedback -----
    function initFeedback(user) {
        var feedbackForm = $('feedbackForm');
        if (!feedbackForm) return;

        var feedbackList = $('feedbackList');
        var feedbackCount = $('feedbackCount');
        var toast = $('toast');
        var nameInput = $('name');

        function showToast(msg, type) {
            if (!toast) return;
            toast.textContent = msg;
            toast.className = 'toast show' + (type === 'error' ? ' error' : '');
            setTimeout(function () { toast.classList.remove('show'); }, 3000);
        }

        function renderFeedbacks() {
            Store.getFeedbacks().then(function (feedbacks) {
                if (feedbackCount) feedbackCount.textContent = feedbacks.length + ' فيدباك';
                if (!feedbackList) return;

                if (feedbacks.length === 0) {
                    feedbackList.innerHTML =
                        '<div class="empty-state">' +
                        '<div class="empty-icon">💬</div>' +
                        '<div class="empty-title">لا توجد آراء بعد</div>' +
                        '<p class="empty-text">كن أول من يشارك تجربته!</p>' +
                        '</div>';
                    return;
                }

                var sorted = feedbacks.slice().sort(function (a, b) {
                    return new Date(b.date) - new Date(a.date);
                });

                feedbackList.innerHTML = sorted.map(function (f) {
                    var dateStr = new Date(f.date).toLocaleDateString('ar-EG', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    });
                    var stars = '';
                    for (var s = 1; s <= 5; s++) {
                        stars += '<span class="star ' + (s <= f.rating ? '' : 'empty') + '">★</span>';
                    }

                    return '<div class="feedback-item">' +
                        '<div class="feedback-header">' +
                        '<div class="feedback-avatar">' + escapeHtml(String(f.name).charAt(0).toUpperCase()) + '</div>' +
                        '<div class="feedback-user">' +
                        '<div class="feedback-name">' + escapeHtml(f.name) + '</div>' +
                        '<div class="feedback-course">📚 ' + escapeHtml(f.course) + '</div>' +
                        '</div>' +
                        '<div class="feedback-rating">' + stars + '</div>' +
                        '</div>' +
                        '<div class="feedback-comment">' + escapeHtml(f.comment) + '</div>' +
                        '<div class="feedback-date">' + dateStr + '</div>' +
                        '</div>';
                }).join('');
            }).catch(function (err) {
                console.error(err);
                if (feedbackList) {
                    feedbackList.innerHTML =
                        '<div class="empty-state"><div class="empty-icon">⚠️</div>' +
                        '<div class="empty-title">تعذّر تحميل الآراء</div></div>';
                }
            });
        }

        // cloud mode: only logged-in students can post
        if (Store.mode === 'cloud' && !user) {
            var card = document.querySelector('.feedback-form-card');
            if (card) {
                card.innerHTML =
                    '<div class="form-title">📝 اكتب فيدباك</div>' +
                    '<p class="form-subtitle">لازم تسجّل دخولك علشان تكتب رأيك.</p>' +
                    '<a href="login.html?next=feedback.html" class="exam-btn">تسجيل الدخول</a>';
            }
            renderFeedbacks();
            return;
        }

        if (user && nameInput) nameInput.value = user.name;

        feedbackForm.addEventListener('submit', function (e) {
            e.preventDefault();

            var name = nameInput.value.trim();
            var course = $('course').value;
            var comment = $('comment').value.trim();
            var rating = document.querySelector('input[name="rating"]:checked');

            if (!name) { showToast('❌ اكتب اسمك', 'error'); return; }
            if (!course) { showToast('❌ اختر الكورس', 'error'); return; }
            if (!rating) { showToast('❌ اختر تقييم', 'error'); return; }
            if (comment.length < 10) { showToast('❌ التعليق قصير جداً', 'error'); return; }

            var btn = feedbackForm.querySelector('button[type="submit"]');
            if (btn) btn.disabled = true;

            Store.addFeedback({
                name: name.slice(0, 60),
                course: course,
                rating: parseInt(rating.value, 10),
                comment: comment.slice(0, 1000)
            }).then(function () {
                feedbackForm.reset();
                if (user && nameInput) nameInput.value = user.name;
                renderFeedbacks();
                showToast('✓ تم إرسال الفيدباك بنجاح');
            }).catch(function (err) {
                console.error(err);
                showToast('❌ تعذّر الإرسال، جرّب تاني', 'error');
            }).then(function () {
                if (btn) btn.disabled = false;
            });
        });

        renderFeedbacks();
    }
})();
