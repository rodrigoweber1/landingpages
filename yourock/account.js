'use strict';
// ---------- Conta: login, senha, perfil e sincronização (Supabase via REST, sem bibliotecas) ----------
// Preencha com os dados do seu projeto Supabase (Project Settings > API). A chave "anon/publishable" é pública por design;
// quem protege os dados é a Row Level Security do supabase-setup.sql.
const SB = { url: '', key: '' };

const accActs = {};
const Acct = (() => {
  const K = 'yourock.auth';
  const AV = ['🎸', '🤘', '🎵', '🔥', '⚡', '🌟', '🦄', '🐺', '🦁', '🎧', '🥁', '🎹'];
  let ses = null, recovery = false, mode = 'in', last = 0, syncing = false, timer = 0, offline = false, pendingErr = '', msg = null, busy = false;
  try { ses = JSON.parse(localStorage.getItem(K)); } catch (e) {}
  const persist = () => { try { ses ? localStorage.setItem(K, JSON.stringify(ses)) : localStorage.removeItem(K); } catch (e) {} };
  const configured = () => !!(SB.url && SB.key);
  const user = () => (ses && ses.user) || null;
  const meta = () => (user() && user().user_metadata) || {};

  // link de e-mail (confirmação / recuperação de senha) volta para o app com #access_token=...
  (function () {
    const h = location.hash;
    if (h.indexOf('access_token=') < 0 && h.indexOf('error_description=') < 0) return;
    const p = new URLSearchParams(h.replace(/^#\/?/, ''));
    if (p.get('error_description')) pendingErr = p.get('error_description');
    else if (p.get('access_token')) {
      ses = { access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: +p.get('expires_at') || Math.floor(Date.now() / 1000) + (+p.get('expires_in') || 3600) };
      recovery = p.get('type') === 'recovery'; persist();
    }
    history.replaceState(null, '', location.pathname + location.search + '#/account');
  })();

  const ERR = [
    [/invalid login/i, 'E-mail ou senha incorretos.'], [/already registered|already been registered/i, 'Este e-mail já tem conta. Use "Entrar".'],
    [/not confirmed/i, 'Confirme seu e-mail: enviamos um link para a sua caixa de entrada.'], [/at least|weak|too short/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/rate limit|too many|seconds/i, 'Muitas tentativas. Aguarde um minuto e tente de novo.'], [/valid email|invalid email|unable to validate email/i, 'E-mail inválido.'],
    [/same password|different from the old/i, 'A nova senha precisa ser diferente da atual.'], [/signups? not allowed|disabled/i, 'Novas contas estão desativadas no momento.'],
  ];
  const friendly = e => { const t = (e && (e.msg || e.message || e.error_description || e.error)) || ''; for (const [re, m] of ERR) if (re.test(t)) return m; return t ? 'Não foi possível concluir: ' + t : 'Sem conexão. Tente de novo.'; };
  const mkErr = (j, status) => { const e = new Error((j && (j.msg || j.message || j.error_description || j.error)) || 'HTTP ' + status); e.status = status; e.body = j; return e; };

  async function raw(path, o) {
    o = o || {};
    const h = Object.assign({ apikey: SB.key, 'Content-Type': 'application/json' }, o.headers);
    if (o.token) h.Authorization = 'Bearer ' + o.token;
    const r = await fetch(SB.url + path, { method: o.method || 'GET', headers: h, body: o.body ? JSON.stringify(o.body) : undefined });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw mkErr(j, r.status);
    return j;
  }
  function setSession(j) {
    ses = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: j.user || (ses && ses.user) };
    persist();
  }
  async function token() {
    if (!ses) throw mkErr({ msg: 'Sem sessão' }, 401);
    if (ses.expires_at * 1000 - Date.now() < 60000) {
      try { setSession(await raw('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: ses.refresh_token } })); }
      catch (e) { if (e.status === 400 || e.status === 401 || e.status === 403) { ses = null; persist(); paintBtn(); } throw e; }
    }
    return ses.access_token;
  }
  const authed = async (path, o) => raw(path, Object.assign({}, o, { token: await token() }));

  // ---------- sincronização do progresso ----------
  function merge(a, b) {
    const newer = (a.uat || 0) >= (b.uat || 0) ? a : b, older = newer === a ? b : a;
    const m = Object.assign({}, older, newer);
    const ss = new Map(); [].concat(a.sessions || [], b.sessions || []).forEach(s => ss.set(s.t + '|' + s.ex, s));
    m.sessions = [...ss.values()].sort((x, y) => x.t - y.t);
    m.best = {}; const ids = new Set(Object.keys(a.best || {}).concat(Object.keys(b.best || {})));
    ids.forEach(id => { const x = (a.best || {})[id], y = (b.best || {})[id]; if (!x || !y) { m.best[id] = x || y; return; }
      const w = (x.clean || 0) !== (y.clean || 0) ? ((x.clean || 0) > (y.clean || 0) ? x : y) : ((x.t || 0) >= (y.t || 0) ? x : y);
      m.best[id] = Object.assign({}, w, { n: Math.max(x.n || 0, y.n || 0) }); });
    m.fav = [...new Set([].concat(a.fav || [], b.fav || []))];
    const rs = new Map(); [].concat(older.routines || [], newer.routines || []).forEach(r => rs.set(r.id, r)); m.routines = [...rs.values()];
    m.bonus = Math.max(a.bonus || 0, b.bonus || 0); m.misCount = Math.max(a.misCount || 0, b.misCount || 0);
    m.placed = newer.placed || older.placed;
    m.settings = Object.assign({}, older.settings, newer.settings, { latency: (a.settings || {}).latency });   // latência é do aparelho
    m.uat = Math.max(a.uat || 0, b.uat || 0);
    return m;
  }
  async function sync() {
    if (!user() || syncing || !configured()) return;
    syncing = true;
    try {
      const rows = await authed('/rest/v1/progress?select=data&user_id=eq.' + user().id);
      const cloud = rows && rows[0] && rows[0].data, before = JSON.stringify(DB);
      const m = cloud ? merge(DB, cloud) : JSON.parse(before);
      if (JSON.stringify(m) !== before) {
        Object.keys(DB).forEach(k => delete DB[k]); Object.assign(DB, m);
        try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {}
        refreshViews();
      }
      if (!cloud || JSON.stringify(m) !== JSON.stringify(cloud)) await push(m);
      last = Date.now(); offline = false;
    } catch (e) { offline = true; if (e.status === 404) msg = ['bad', 'A tabela "progress" não existe no Supabase. Rode o supabase-setup.sql.']; }
    syncing = false; paintStatus();
  }
  const push = d => authed('/rest/v1/progress?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: user().id, data: d, updated_at: new Date().toISOString() } });
  function refreshViews() {
    const r = (location.hash || '#/home').slice(2).split('?')[0];
    if (['home', 'stats', 'vault', 'account', 'settings'].indexOf(r) >= 0) render();
  }
  function dirty() { if (!user()) return; clearTimeout(timer); timer = setTimeout(sync, 5000); }

  // ---------- botão do cabeçalho ----------
  function paintBtn() {
    const b = document.getElementById('accBtn'); if (!b) return;
    const u = user();
    b.innerHTML = u ? '<span class="av">' + esc(meta().avatar || AV[0]) + '</span>' : '<svg><use href="#i-user"/></svg>';
    b.title = u ? (meta().name || u.email) : 'Entrar';
    b.classList.toggle('on', (location.hash || '').indexOf('#/account') === 0);
  }
  function paintStatus() {
    const e = document.getElementById('accSync'); if (!e) return;
    e.textContent = syncing ? 'Sincronizando…' : offline ? 'Sem conexão: seu progresso fica salvo no aparelho e sobe quando voltar.' : last ? '✓ Sincronizado às ' + new Date(last).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  }

  // ---------- tela ----------
  const val = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
  const note = () => msg ? `<div class="accmsg ${msg[0]}">${esc(msg[1])}</div>` : '';
  const setMsg = (k, t) => { msg = t ? [k, t] : null; const e = document.getElementById('accMsg'); if (e) e.innerHTML = note(); };
  function viewAccount() {
    const u = user();
    if (!configured()) {
      view.innerHTML = '<h1>Conta</h1><div class="card"><h2>Em breve</h2><div class="mut" style="margin-top:6px">O login ainda não está ativado neste app. Enquanto isso, tudo funciona normalmente e seu progresso fica salvo neste aparelho.</div></div>';
      return;
    }
    if (u && recovery) {
      view.innerHTML = `<h1>Nova senha</h1><form class="card" data-form="accNewPass" autocomplete="on"><div class="mut small">Crie uma nova senha para a conta <b>${esc(u.email || '')}</b>.</div>
        <label class="lbl" for="aP1">Nova senha</label><input id="aP1" type="password" autocomplete="new-password" minlength="6" required>
        <label class="lbl" for="aP2">Repita a nova senha</label><input id="aP2" type="password" autocomplete="new-password" minlength="6" required>
        <div id="accMsg" aria-live="polite">${note()}</div><div class="row" style="margin-top:12px"><button class="btn pri" type="submit">Salvar nova senha</button></div></form>`;
      return;
    }
    if (!u) {
      const up = mode === 'up', fg = mode === 'forgot';
      view.innerHTML = `<h1>${fg ? 'Recuperar senha' : up ? 'Criar conta' : 'Entrar'}</h1>
      <form class="card" data-form="accSubmit" autocomplete="on">
        ${fg ? '<div class="mut small">Informe seu e-mail e enviaremos um link para criar uma nova senha.</div>' : '<div class="mut small">Com uma conta, seu progresso (XP, estrelas, rotinas e histórico) acompanha você em qualquer aparelho. O app continua funcionando sem conta.</div>'}
        ${up ? '<label class="lbl" for="aName">Nome</label><input id="aName" type="text" autocomplete="name" maxlength="40" required>' : ''}
        <label class="lbl" for="aMail">E-mail</label><input id="aMail" type="email" autocomplete="email" inputmode="email" required>
        ${fg ? '' : `<label class="lbl" for="aPass">Senha</label><div class="pw"><input id="aPass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="6" required><button type="button" class="btn sm" data-act="accShowPw" aria-label="Mostrar senha">👁</button></div>${up ? '<div class="mut small" style="margin-top:4px">Mínimo de 6 caracteres.</div>' : ''}`}
        <div id="accMsg" aria-live="polite">${note()}</div>
        <div class="row" style="margin-top:12px"><button class="btn pri" type="submit" id="accGo">${fg ? 'Enviar link' : up ? 'Criar conta' : 'Entrar'}</button></div>
        <div class="row accLinks">${fg ? '<a href="#/account" data-act="accMode" data-m="in">Voltar</a>' : up ? 'Já tem conta? <a href="#/account" data-act="accMode" data-m="in">Entrar</a>' : '<a href="#/account" data-act="accMode" data-m="forgot">Esqueci a senha</a><span>Novo por aqui? <a href="#/account" data-act="accMode" data-m="up">Criar conta</a></span>'}</div>
      </form>`;
      return;
    }
    const xp = totalXP(), rk = rankOf(xp), av = meta().avatar || AV[0];
    view.innerHTML = `<h1>Perfil</h1>
    <div class="card"><div class="row" style="gap:14px"><div class="avBig">${esc(av)}</div><div><div style="font-size:18px;font-weight:700">${esc(meta().name || 'Guitarrista')}</div><div class="mut small">${esc(u.email || '')}</div><div class="small" style="margin-top:4px"><b>${esc(T(rk.name))}</b> · ${xp} XP · ${DB.sessions.length} <span>treinos</span></div></div></div>
      <div class="small mut" id="accSync" style="margin-top:10px"></div>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-act="accSync">Sincronizar agora</button></div></div>
    <form class="card" data-form="accProfile"><h2>Editar perfil</h2>
      <label class="lbl" for="aName">Nome</label><input id="aName" type="text" maxlength="40" value="${esc(meta().name || '')}" autocomplete="name" required>
      <label class="lbl">Avatar</label><div class="avs" id="avs">${AV.map(a => `<button type="button" class="avp ${a === av ? 'on' : ''}" data-act="accAv" data-a="${a}" aria-label="Avatar ${a}">${a}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn pri" type="submit">Salvar perfil</button></div></form>
    <form class="card" data-form="accNewPass"><h2>Alterar senha</h2>
      <input type="text" autocomplete="username" value="${esc(u.email || '')}" hidden aria-hidden="true" tabindex="-1">
      <label class="lbl" for="aP1">Nova senha</label><input id="aP1" type="password" autocomplete="new-password" minlength="6" required>
      <label class="lbl" for="aP2">Repita a nova senha</label><input id="aP2" type="password" autocomplete="new-password" minlength="6" required>
      <div class="row" style="margin-top:12px"><button class="btn" type="submit">Alterar senha</button></div></form>
    <div id="accMsg" aria-live="polite">${note()}</div>
    <div class="card"><button class="btn" data-act="accOut">Sair da conta</button><div class="mut small" style="margin-top:6px">Seus dados continuam neste aparelho e na nuvem.</div></div>`;
    paintStatus();
  }

  // ---------- ações ----------
  const lock = (f, on) => f.querySelectorAll('button').forEach(b => { b.disabled = on; });
  accActs.accMode = d => { mode = d.m; msg = null; viewAccount(); };
  accActs.accShowPw = () => { const p = document.getElementById('aPass'); if (p) p.type = p.type === 'password' ? 'text' : 'password'; };
  accActs.accSync = async () => { msg = null; await sync(); toast(offline ? 'Sem conexão' : 'Progresso sincronizado'); };
  accActs.accOut = async () => {
    try { await authed('/auth/v1/logout', { method: 'POST' }); } catch (e) {}
    ses = null; recovery = false; persist(); paintBtn(); mode = 'in'; msg = null; toast('Você saiu da conta'); viewAccount();
  };
  const forms = {
    async accSubmit(f) {
      const email = val('aMail'); msg = null; lock(f, true);
      try {
        if (mode === 'forgot') {
          await raw('/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', body: { email } });
          setMsg('ok', 'Pronto! Se este e-mail tiver conta, você receberá um link para criar uma nova senha.');
        } else if (mode === 'up') {
          const j = await raw('/auth/v1/signup?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { method: 'POST', body: { email, password: val('aPass'), data: { name: val('aName'), avatar: AV[0] } } });
          if (j && j.access_token) { setSession(j); await afterLogin(); return; }
          setMsg('ok', 'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois use "Entrar".'); mode = 'in';
        } else {
          setSession(await raw('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password: val('aPass') } }));
          await afterLogin(); return;
        }
      } catch (e) { setMsg('bad', friendly(e)); }
      lock(f, false);
    },
    async accProfile(f) {
      lock(f, true);
      try {
        const av = (document.querySelector('.avp.on') || {}).dataset; const j = await authed('/auth/v1/user', { method: 'PUT', body: { data: { name: val('aName'), avatar: av ? av.a : meta().avatar } } });
        ses.user = j; persist(); paintBtn(); toast('Perfil salvo'); viewAccount();
      } catch (e) { setMsg('bad', friendly(e)); lock(f, false); }
    },
    async accNewPass(f) {
      const a = val('aP1'), b = val('aP2'); msg = null;
      if (a.length < 6) return setMsg('bad', 'A senha precisa ter pelo menos 6 caracteres.');
      if (a !== b) return setMsg('bad', 'As senhas não são iguais.');
      lock(f, true);
      try { await authed('/auth/v1/user', { method: 'PUT', body: { password: a } }); const was = recovery; recovery = false; toast('Senha alterada'); if (was) await afterLogin(); else viewAccount(); }
      catch (e) { setMsg('bad', friendly(e)); lock(f, false); }
    },
  };
  async function afterLogin() { paintBtn(); msg = null; toast('Bem-vindo, ' + (meta().name || 'guitarrista') + '!'); viewAccount(); await sync(); if (location.hash.indexOf('#/account') === 0) viewAccount(); }
  document.addEventListener('submit', e => { const f = e.target.closest && e.target.closest('[data-form]'); if (f && forms[f.dataset.form]) { e.preventDefault(); forms[f.dataset.form](f); } });
  accActs.accAv = (d, el) => { document.querySelectorAll('.avp').forEach(b => b.classList.toggle('on', b === el)); };
  addEventListener('hashchange', paintBtn);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && user()) sync(); });
  addEventListener('online', () => sync());

  async function boot() {
    paintBtn();
    if (pendingErr) { toast(pendingErr.replace(/\+/g, ' ')); pendingErr = ''; }
    if (!configured() || !ses) return;
    try {
      if (!ses.user) { ses.user = await authed('/auth/v1/user'); persist(); }
      paintBtn(); if (location.hash.indexOf('#/account') === 0) viewAccount();
      if (!recovery) await sync();
    } catch (e) { paintBtn(); }
  }
  setTimeout(boot, 0);
  return { dirty, sync, viewAccount, user, configured, forcePush: async () => { if (user()) { try { await push(DB); } catch (e) {} } } };
})();
