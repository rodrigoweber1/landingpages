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
      err: 'No se pudo completar. Inténtalo de nuevo.', acct: 'Cuenta', role: 'Rol', out: 'Salir', close: 'Cerrar', admin: 'Administración', users: 'Usuarios y accesos', loading: 'Cargando…', none: 'Sin usuarios.', saved: 'Guardado', roleAdmin: 'admin', roleTeste: 'prueba' },
    en: { title: 'Sign in', sub: 'Test version with an account.', mail: 'Email', pass: 'Password', in: 'Sign in', up: 'Create account', magic: 'Email me a link', toUp: 'First time? Create your account', toIn: 'I already have an account',
      checkMail: 'Check your email to continue.', created: 'Account created. If asked to confirm, check your email.', bad: 'Wrong email or password.', need: 'Enter your email and password.', needMail: 'Enter your email.',
      err: 'Could not complete. Try again.', acct: 'Account', role: 'Role', out: 'Sign out', close: 'Close', admin: 'Administration', users: 'Users and access', loading: 'Loading…', none: 'No users.', saved: 'Saved', roleAdmin: 'admin', roleTeste: 'test' }
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
    '#yr-acct .note{font-size:13px;color:#BDB6AA}'
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
      + '<div class="row"><button class="b" id="yr-out" type="button">' + t('out') + '</button><button class="b g" id="yr-cl" type="button">' + t('close') + '</button></div>'
      + (admin ? '<h3>' + t('admin') + ' · ' + t('users') + '</h3><div id="yr-users" class="note">' + t('loading') + '</div>' : '') + '</div>';
    panel.querySelector('#yr-cl').addEventListener('click', function () { panel.hidden = true; });
    panel.querySelector('#yr-out').addEventListener('click', function () { panel.hidden = true; SB.auth.signOut(); });
    if (admin) loadUsers();
  }
  panel.addEventListener('click', function (e) { if (e.target === panel) panel.hidden = true; });
  btn.addEventListener('click', openPanel);

  function loadUsers() {
    var box = panel.querySelector('#yr-users');
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
    if (!sess) { document.documentElement.classList.remove('yr-ok'); profile = null; btn.hidden = true; panel.hidden = true; drawGate(); gate.hidden = false; return; }
    document.documentElement.classList.add('yr-ok');
    gate.hidden = true; btn.hidden = false; btn.textContent = (sess.user.email || '?').charAt(0).toUpperCase();
    SB.from('profiles').select('id,email,role').eq('id', sess.user.id).maybeSingle().then(function (r) {
      profile = r.data || null; if (profile) btn.textContent = initial();
      window.YR_USER = { id: sess.user.id, email: sess.user.email, role: profile ? profile.role : null };
    });
  }
  function start() {
    document.body.appendChild(gate); document.body.appendChild(btn); document.body.appendChild(panel);
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
