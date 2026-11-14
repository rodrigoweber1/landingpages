// You Rock Academy · versión con login (Supabase). Se carga solo en /app-test/.
// 1) pantalla de entrada que tapa la app hasta que hay sesión  2) botón de cuenta  3) panel de administración (solo rol admin)
(function () {
  'use strict';
  var CFG = window.YR_CONFIG || {};
  var SB = null, session = null, profile = null;

  function lang() { try { return localStorage.getItem('guitar.lang') === 'en' ? 'en' : 'es'; } catch (e) { return 'es'; } }
  var TX = {
    es: { title: 'Entrar', sub: 'Versión de pruebas con cuenta.', mail: 'Correo', pass: 'Contraseña', in: 'Entrar', up: 'Crear cuenta', magic: 'Enviarme un enlace por correo', toUp: '¿Primera vez? Crea tu cuenta', toIn: 'Ya tengo cuenta',
      checkMail: 'Revisa tu correo para continuar.', created: 'Cuenta creada. Si te pide confirmar, revisa tu correo.', bad: 'Correo o contraseña incorrectos.', need: 'Escribe tu correo y tu contraseña.', needMail: 'Escribe tu correo.',
      err: 'No se pudo completar. Inténtalo de nuevo.', acct: 'Cuenta', role: 'Rol', out: 'Salir', close: 'Cerrar', admin: 'Administración', users: 'Usuarios y accesos', loading: 'Cargando…', none: 'Sin usuarios.', saved: 'Guardado', roleAdmin: 'admin', roleTeste: 'prueba',
      openAdmin: 'Abrir página Admin', lessons: 'Lecciones', protectedL: 'Lecciones protegidas (prueba)', locked: 'Bloqueada · requiere el módulo', open: 'Abrir', newL: 'Nueva lección', edit: 'Editar', del: 'Borrar', save: 'Guardar',
      module: 'Módulo', titleEs: 'Título (ES)', titleEn: 'Title (EN)', bodyEs: 'Texto (ES)', bodyEn: 'Text (EN)', confirmDel: '¿Borrar esta lección?', noLessons: 'Aún no hay lecciones.', adminTitle: 'Admin', usersTab: 'Usuarios y accesos' },
    en: { title: 'Sign in', sub: 'Test version with an account.', mail: 'Email', pass: 'Password', in: 'Sign in', up: 'Create account', magic: 'Email me a link', toUp: 'First time? Create your account', toIn: 'I already have an account',
      checkMail: 'Check your email to continue.', created: 'Account created. If asked to confirm, check your email.', bad: 'Wrong email or password.', need: 'Enter your email and password.', needMail: 'Enter your email.',
      err: 'Could not complete. Try again.', acct: 'Account', role: 'Role', out: 'Sign out', close: 'Close', admin: 'Administration', users: 'Users and access', loading: 'Loading…', none: 'No users.', saved: 'Saved', roleAdmin: 'admin', roleTeste: 'test',
      openAdmin: 'Open Admin page', lessons: 'Lessons', protectedL: 'Protected lessons (test)', locked: 'Locked · requires module', open: 'Open', newL: 'New lesson', edit: 'Edit', del: 'Delete', save: 'Save',
      module: 'Module', titleEs: 'Title (ES)', titleEn: 'Title (EN)', bodyEs: 'Text (ES)', bodyEn: 'Text (EN)', confirmDel: 'Delete this lesson?', noLessons: 'No lessons yet.', adminTitle: 'Admin', usersTab: 'Users and access' }
  };
  function t(k) { return TX[lang()][k]; }
  function el(tag, attrs, html) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ───────── estilos ─────────
  var css = el('style', null, [
    '#yr-auth{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:#0D0B0A;color:#F4EEE6;font-family:Inter,system-ui,sans-serif;overflow:auto}',
    '#yr-auth[hidden]{display:none}',
    '#yr-auth .box{width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px}',
    '#yr-auth h1{margin:0;font:400 28px/1.1 "Archivo Black",Inter,sans-serif;text-transform:uppercase;letter-spacing:.01em}',
    '#yr-auth p{margin:0;color:#BDB6AA;font-size:15px;line-height:22px}',
    '#yr-auth label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#CFC6BA}',
    '#yr-auth input{box-sizing:border-box;width:100%;min-height:48px;padding:0 16px;border:1px solid #3A302A;border-radius:999px;background:#17120F;color:#F4EEE6;font:500 16px Inter,system-ui,sans-serif;outline:none}',
    '#yr-auth input:focus{border-color:#E31B23}',
    '#yr-auth .go{min-height:48px;border:0;border-radius:999px;background:#E31B23;color:#fff;font:700 16px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-auth .lnk{background:none;border:0;padding:8px;color:#FF6B70;font:600 14px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
    '#yr-auth .msg{min-height:20px;font-size:14px;line-height:20px;color:#FFC400}',
    '#yr-acct-btn{position:fixed;z-index:90;left:12px;bottom:calc(env(safe-area-inset-bottom) + 86px);width:40px;height:40px;border-radius:50%;border:1px solid #3A302A;background:rgba(23,18,15,.94);color:#F4EEE6;font:700 15px Inter,system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    '@media(min-width:900px){#yr-acct-btn{left:16px;bottom:16px}}',
    '#yr-acct{position:fixed;inset:0;z-index:10001;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif}',
    '#yr-acct[hidden]{display:none}',
    '#yr-acct .sheet{box-sizing:border-box;width:100%;max-width:560px;max-height:88vh;overflow:auto;padding:20px 18px 28px;border-radius:20px 20px 0 0;background:#17120F;color:#F4EEE6;border:1px solid #3A302A;display:flex;flex-direction:column;gap:12px}',
    '@media(min-width:700px){#yr-acct{align-items:center}#yr-acct .sheet{border-radius:20px}}',
    '#yr-acct h2{margin:0;font:400 20px/1.2 "Archivo Black",Inter,sans-serif;text-transform:uppercase}',
    '#yr-acct h3{margin:8px 0 0;font:400 15px/1.2 "Archivo Black",Inter,sans-serif;text-transform:uppercase;color:#FFC400}',
    '#yr-acct .kv{display:flex;justify-content:space-between;gap:12px;font-size:15px;color:#CFC6BA}',
    '#yr-acct .kv b{color:#F4EEE6;word-break:break-all;text-align:right}',
    '#yr-acct .row{display:flex;gap:10px;flex-wrap:wrap}',
    '#yr-acct button.b{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#E31B23;color:#fff;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-acct button.g{background:#2A211C;color:#F4EEE6}',
    '#yr-acct .u{padding:12px;border:1px solid #3A302A;border-radius:14px;display:flex;flex-direction:column;gap:8px}',
    '#yr-acct .u .em{font-weight:700;font-size:14px;word-break:break-all}',
    '#yr-acct .u .rl{font-size:12px;color:#BDB6AA}',
    '#yr-acct .chips{display:flex;gap:6px;flex-wrap:wrap}',
    '#yr-acct .chip{min-height:36px;padding:0 12px;border:1px solid #3A302A;border-radius:999px;background:#221B17;color:#CFC6BA;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-acct .chip[aria-pressed="true"]{border-color:#FFC400;color:#FFC400}',
    '#yr-acct .note{font-size:13px;color:#BDB6AA}',
    '#yr-acct .les{padding:12px;border:1px solid #3A302A;border-radius:14px;display:flex;flex-direction:column;gap:8px}',
    '#yr-acct .les b{font-size:15px}',
    '#yr-acct .les .txt{white-space:pre-wrap;font-size:15px;line-height:22px;color:#F4EEE6}',
    '#yr-acct .lock{font-size:13px;color:#FFC400}',
    '#yr-admin{position:fixed;inset:0;z-index:10002;display:flex;flex-direction:column;background:#0D0B0A;color:#F4EEE6;font-family:Inter,system-ui,sans-serif}',
    '#yr-admin[hidden]{display:none}',
    '#yr-admin header{display:flex;align-items:center;gap:12px;padding:calc(env(safe-area-inset-top) + 12px) 16px 12px;border-bottom:1px solid #3A302A}',
    '#yr-admin header h1{flex:1;margin:0;font:400 20px/1.2 "Archivo Black",Inter,sans-serif;text-transform:uppercase}',
    '#yr-admin .main{flex:1;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:12px;max-width:720px;width:100%;box-sizing:border-box;margin:0 auto}',
    '#yr-admin .seg{display:flex;gap:4px;padding:4px;border:1px solid #3A302A;border-radius:999px}',
    '#yr-admin .seg button{flex:1;min-height:44px;border:0;border-radius:999px;background:transparent;color:#CFC6BA;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-admin .seg button[aria-pressed="true"]{background:#E31B23;color:#fff}',
    '#yr-admin button.b{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#E31B23;color:#fff;font:700 14px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-admin button.g{background:#2A211C;color:#F4EEE6}',
    '#yr-admin .row{display:flex;gap:10px;flex-wrap:wrap}',
    '#yr-admin .u,#yr-admin .les{padding:12px;border:1px solid #3A302A;border-radius:14px;display:flex;flex-direction:column;gap:8px}',
    '#yr-admin .u .em,#yr-admin .les b{font-weight:700;font-size:14px;word-break:break-all}',
    '#yr-admin .u .rl,#yr-admin .note{font-size:13px;color:#BDB6AA}',
    '#yr-admin .chips{display:flex;gap:6px;flex-wrap:wrap}',
    '#yr-admin .chip{min-height:36px;padding:0 12px;border:1px solid #3A302A;border-radius:999px;background:#221B17;color:#CFC6BA;font:600 13px Inter,system-ui,sans-serif;cursor:pointer}',
    '#yr-admin .chip[aria-pressed="true"]{border-color:#FFC400;color:#FFC400}',
    '#yr-admin label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#CFC6BA}',
    '#yr-admin input,#yr-admin textarea,#yr-admin select{box-sizing:border-box;width:100%;padding:10px 14px;border:1px solid #3A302A;border-radius:14px;background:#17120F;color:#F4EEE6;font:500 16px Inter,system-ui,sans-serif;outline:none}',
    '#yr-admin textarea{min-height:110px;resize:vertical}',
    '#yr-admin input:focus,#yr-admin textarea:focus,#yr-admin select:focus{border-color:#E31B23}'
  ].join('\n'));
  document.head.appendChild(css);

  // ───────── pantalla de entrada ─────────
  var gate = el('div', { id: 'yr-auth', role: 'dialog', 'aria-modal': 'true' });
  var mode = 'in';
  function gateHtml() {
    return '<div class="box"><h1>' + t(mode === 'in' ? 'title' : 'up') + '</h1><p>' + t('sub') + '</p>'
      + '<label>' + t('mail') + '<input id="yr-em" type="email" autocomplete="email" inputmode="email"></label>'
      + '<label>' + t('pass') + '<input id="yr-pw" type="password" autocomplete="' + (mode === 'in' ? 'current-password' : 'new-password') + '"></label>'
      + '<div class="msg" id="yr-msg" role="status"></div>'
      + '<button class="go" id="yr-go" type="button">' + t(mode === 'in' ? 'in' : 'up') + '</button>'
      + '<button class="lnk" id="yr-magic" type="button">' + t('magic') + '</button>'
      + '<button class="lnk" id="yr-sw" type="button">' + t(mode === 'in' ? 'toUp' : 'toIn') + '</button></div>';
  }
  function msg(s) { var m = document.getElementById('yr-msg'); if (m) m.textContent = s || ''; }
  function drawGate() {
    gate.innerHTML = gateHtml();
    gate.querySelector('#yr-sw').addEventListener('click', function () { mode = mode === 'in' ? 'up' : 'in'; drawGate(); });
    gate.querySelector('#yr-go').addEventListener('click', submit);
    gate.querySelector('#yr-pw').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    gate.querySelector('#yr-magic').addEventListener('click', function () {
      var em = gate.querySelector('#yr-em').value.trim();
      if (!em) return msg(t('needMail'));
      SB.auth.signInWithOtp({ email: em, options: { emailRedirectTo: location.origin + location.pathname } }).then(function (r) { msg(r.error ? t('err') : t('checkMail')); });
    });
  }
  function submit() {
    var em = gate.querySelector('#yr-em').value.trim(), pw = gate.querySelector('#yr-pw').value;
    if (!em || !pw) return msg(t('need'));
    msg('…');
    var p = mode === 'in' ? SB.auth.signInWithPassword({ email: em, password: pw })
                          : SB.auth.signUp({ email: em, password: pw, options: { emailRedirectTo: location.origin + location.pathname } });
    p.then(function (r) {
      if (r.error) return msg(mode === 'in' ? t('bad') : t('err'));
      if (mode === 'up' && !r.data.session) msg(t('created'));
    });
  }

  // ───────── botón de cuenta + panel ─────────
  var btn = el('button', { id: 'yr-acct-btn', type: 'button', hidden: '' }, '·');
  var panel = el('div', { id: 'yr-acct', hidden: '' });
  function initial() { var e = (profile && profile.email) || (session && session.user && session.user.email) || '?'; return e.charAt(0).toUpperCase(); }
  function openPanel() { drawPanel(); panel.hidden = false; }
  function drawPanel() {
    var admin = profile && profile.role === 'admin';
    panel.innerHTML = '<div class="sheet"><h2>' + t('acct') + '</h2>'
      + '<div class="kv"><span>' + t('mail') + '</span><b>' + esc(profile ? profile.email : session.user.email) + '</b></div>'
      + '<div class="kv"><span>' + t('role') + '</span><b>' + esc(profile ? profile.role : '…') + '</b></div>'
      + '<div class="row">' + (admin ? '<button class="b" id="yr-adm" type="button">' + t('openAdmin') + '</button>' : '') + '<button class="b g" id="yr-out" type="button">' + t('out') + '</button><button class="b g" id="yr-cl" type="button">' + t('close') + '</button></div>'
      + '<h3>' + t('protectedL') + '</h3><div id="yr-less" class="note">' + t('loading') + '</div></div>';
    panel.querySelector('#yr-cl').addEventListener('click', function () { panel.hidden = true; });
    panel.querySelector('#yr-out').addEventListener('click', function () { panel.hidden = true; SB.auth.signOut(); });
    var ab = panel.querySelector('#yr-adm'); if (ab) ab.addEventListener('click', function () { panel.hidden = true; openAdmin(); });
    loadLessons(panel.querySelector('#yr-less'));
  }

  // ───────── lecciones protegidas: lo que ve cada usuario según sus derechos ─────────
  function loadLessons(box) {
    Promise.all([SB.rpc('lesson_catalog'), SB.from('modules').select('id,title_es,title_en')]).then(function (rs) {
      if (rs[0].error) { box.textContent = t('err'); return; }
      var cat = rs[0].data || [], mods = {}; (rs[1].data || []).forEach(function (m) { mods[m.id] = lang() === 'en' ? m.title_en : m.title_es; });
      if (!cat.length) { box.textContent = t('noLessons'); return; }
      box.className = ''; box.innerHTML = '';
      cat.forEach(function (c) {
        var title = (lang() === 'en' && c.title_en) ? c.title_en : c.title_es;
        var d = el('div', { class: 'les' }, '<b>' + esc(title) + '</b>');
        if (!c.unlocked) { d.appendChild(el('div', { class: 'lock' }, '🔒 ' + t('locked') + ' «' + esc(mods[c.module_id] || c.module_id) + '»')); box.appendChild(d); return; }
        var b = el('button', { type: 'button', class: 'b' }, t('open'));
        b.addEventListener('click', function () {
          SB.from('lessons').select('body_es,body_en').eq('id', c.id).maybeSingle().then(function (r) {
            if (r.error || !r.data) { b.textContent = t('err'); return; }
            var tx = el('div', { class: 'txt' }); tx.textContent = (lang() === 'en' && r.data.body_en) ? r.data.body_en : r.data.body_es;
            d.appendChild(tx); b.remove();
          });
        });
        d.appendChild(b); box.appendChild(d);
      });
    });
  }

  // ───────── página Admin (solo rol admin) ─────────
  var adminPage = el('div', { id: 'yr-admin', hidden: '' });
  var adminTab = 'users';
  function openAdmin() { adminTab = 'users'; drawAdmin(); adminPage.hidden = false; }
  function drawAdmin() {
    adminPage.innerHTML = '<header><h1>' + t('adminTitle') + '</h1><button class="b g" id="yr-ad-x" type="button">' + t('close') + '</button></header>'
      + '<div class="main"><div class="seg"><button type="button" data-tab="users" aria-pressed="' + (adminTab === 'users') + '">' + t('usersTab') + '</button><button type="button" data-tab="lessons" aria-pressed="' + (adminTab === 'lessons') + '">' + t('lessons') + '</button></div><div id="yr-ad-body" class="note">' + t('loading') + '</div></div>';
    adminPage.querySelector('#yr-ad-x').addEventListener('click', function () { adminPage.hidden = true; });
    Array.prototype.forEach.call(adminPage.querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { adminTab = b.getAttribute('data-tab'); drawAdmin(); }); });
    var body = adminPage.querySelector('#yr-ad-body');
    if (adminTab === 'users') loadUsers(body); else loadAdminLessons(body);
  }
  function loadAdminLessons(box) {
    Promise.all([SB.from('lessons').select('*').order('sort').order('created_at'), SB.from('modules').select('id,title_es,title_en,sort').order('sort')]).then(function (rs) {
      if (rs[0].error || rs[1].error) { box.textContent = t('err'); return; }
      var ls = rs[0].data || [], mods = rs[1].data || [];
      box.className = ''; box.innerHTML = '';
      var nb = el('button', { type: 'button', class: 'b' }, '+ ' + t('newL')); nb.addEventListener('click', function () { form(null); }); box.appendChild(nb);
      if (!ls.length) box.appendChild(el('div', { class: 'note' }, t('noLessons')));
      ls.forEach(function (l) {
        var mt = ''; mods.forEach(function (m) { if (m.id === l.module_id) mt = lang() === 'en' ? m.title_en : m.title_es; });
        var d = el('div', { class: 'les' }, '<b>' + esc(l.title_es) + '</b><div class="note">' + esc(mt || l.module_id) + '</div>');
        var r = el('div', { class: 'row' }), eb = el('button', { type: 'button', class: 'b g' }, t('edit')), db = el('button', { type: 'button', class: 'b g' }, t('del'));
        eb.addEventListener('click', function () { form(l); });
        db.addEventListener('click', function () { if (confirm(t('confirmDel'))) SB.from('lessons').delete().eq('id', l.id).then(function () { drawAdmin(); }); });
        r.appendChild(eb); r.appendChild(db); d.appendChild(r); box.appendChild(d);
      });
      function form(l) {
        box.innerHTML = '';
        var opts = mods.map(function (m) { return '<option value="' + esc(m.id) + '"' + (l && l.module_id === m.id ? ' selected' : '') + '>' + esc(lang() === 'en' ? m.title_en : m.title_es) + '</option>'; }).join('');
        var f = el('div', { class: 'les' }, '<label>' + t('module') + '<select id="f-mod">' + opts + '</select></label>'
          + '<label>' + t('titleEs') + '<input id="f-te" type="text"></label><label>' + t('titleEn') + '<input id="f-tn" type="text"></label>'
          + '<label>' + t('bodyEs') + '<textarea id="f-be"></textarea></label><label>' + t('bodyEn') + '<textarea id="f-bn"></textarea></label>'
          + '<div class="note" id="f-msg"></div><div class="row"><button class="b" id="f-save" type="button">' + t('save') + '</button><button class="b g" id="f-cancel" type="button">' + t('close') + '</button></div>');
        box.appendChild(f);
        f.querySelector('#f-te').value = l ? l.title_es : ''; f.querySelector('#f-tn').value = l ? l.title_en : '';
        f.querySelector('#f-be').value = l ? l.body_es : ''; f.querySelector('#f-bn').value = l ? l.body_en : '';
        f.querySelector('#f-cancel').addEventListener('click', drawAdmin);
        f.querySelector('#f-save').addEventListener('click', function () {
          var row = { module_id: f.querySelector('#f-mod').value, title_es: f.querySelector('#f-te').value.trim(), title_en: f.querySelector('#f-tn').value.trim(), body_es: f.querySelector('#f-be').value, body_en: f.querySelector('#f-bn').value };
          if (!row.title_es) { f.querySelector('#f-msg').textContent = '…'; return; }
          if (l) row.id = l.id;
          SB.from('lessons').upsert(row).then(function (r) { if (r.error) f.querySelector('#f-msg').textContent = t('err'); else drawAdmin(); });
        });
      }
    });
  }
  panel.addEventListener('click', function (e) { if (e.target === panel) panel.hidden = true; });
  btn.addEventListener('click', openPanel);

  function loadUsers(box) {
    Promise.all([
      SB.from('profiles').select('id,email,role,created_at').order('created_at'),
      SB.from('modules').select('id,title_es,title_en,sort').order('sort'),
      SB.from('entitlements').select('user_id,module_id')
    ]).then(function (rs) {
      if (rs[0].error || rs[1].error || rs[2].error) { box.textContent = t('err'); return; }
      var users = rs[0].data || [], mods = rs[1].data || [], ents = rs[2].data || [];
      if (!users.length) { box.textContent = t('none'); return; }
      var has = {}; ents.forEach(function (x) { has[x.user_id + '|' + x.module_id] = true; });
      box.className = ''; box.innerHTML = '';
      users.forEach(function (u) {
        var d = el('div', { class: 'u' }, '<div class="em">' + esc(u.email) + '</div><div class="rl">' + esc(u.role) + '</div>');
        var chips = el('div', { class: 'chips' });
        mods.forEach(function (m) {
          var on = !!has[u.id + '|' + m.id];
          var c = el('button', { type: 'button', class: 'chip', 'aria-pressed': String(on) }, esc(lang() === 'en' ? m.title_en : m.title_es));
          c.addEventListener('click', function () {
            var now = c.getAttribute('aria-pressed') === 'true';
            var q = now ? SB.from('entitlements').delete().eq('user_id', u.id).eq('module_id', m.id)
                        : SB.from('entitlements').upsert({ user_id: u.id, module_id: m.id, source: 'manual' });
            q.then(function (r) { if (!r.error) c.setAttribute('aria-pressed', String(!now)); else c.textContent = t('err'); });
          });
          chips.appendChild(c);
        });
        d.appendChild(chips); box.appendChild(d);
      });
    });
  }

  // ───────── arranque ─────────
  function show(sess) {
    session = sess;
    if (!sess) { document.documentElement.classList.remove('yr-ok'); profile = null; btn.hidden = true; panel.hidden = true; adminPage.hidden = true; drawGate(); gate.hidden = false; return; }
    document.documentElement.classList.add('yr-ok');
    gate.hidden = true; btn.hidden = false; btn.textContent = (sess.user.email || '?').charAt(0).toUpperCase();
    SB.from('profiles').select('id,email,role').eq('id', sess.user.id).maybeSingle().then(function (r) {
      profile = r.data || null; if (profile) btn.textContent = initial();
      window.YR_USER = { id: sess.user.id, email: sess.user.email, role: profile ? profile.role : null };
    });
  }
  function start() {
    document.body.appendChild(gate); document.body.appendChild(btn); document.body.appendChild(panel); document.body.appendChild(adminPage);
    gate.innerHTML = '<div class="box"><p>…</p></div>';
    if (!CFG.supabaseUrl || !window.supabase) { gate.innerHTML = '<div class="box"><p>' + t('err') + '</p></div>'; return; }
    SB = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    window.YR_SB = SB;
    SB.auth.getSession().then(function (r) { show(r.data.session); });
    SB.auth.onAuthStateChange(function (_e, s) { show(s); });
  }
  var sc = document.createElement('script');
  sc.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  sc.onload = function () { if (document.body) start(); else document.addEventListener('DOMContentLoaded', start); };
  sc.onerror = function () { if (document.body) { document.body.appendChild(gate); gate.innerHTML = '<div class="box"><p>' + t('err') + '</p></div>'; } };
  document.head.appendChild(sc);
  gate.hidden = false;
})();
