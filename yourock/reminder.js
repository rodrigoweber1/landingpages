'use strict';
// ---------- Lembrete diário de treino ----------
// Notificação local: aparece quando o app está aberto (inclusive em segundo plano) e o horário passou sem treino no dia.
// Sem servidor de push, o navegador não acorda o app fechado; por isso também há um aviso na tela inicial.
const Reminder = (() => {
  const today = () => dkey(Date.now());
  const trained = () => DB.sessions.some(s => dkey(s.t) === today());
  const on = () => !!S().rem;
  const time = () => /^\d\d:\d\d$/.test(S().remT || '') ? S().remT : '19:00';
  const passed = () => { const [h, m] = time().split(':').map(Number), n = new Date(); return n.getHours() * 60 + n.getMinutes() >= h * 60 + m; };
  const due = () => on() && passed() && !trained();
  const canNotify = () => 'Notification' in window && Notification.permission === 'granted';
  async function notify() {
    const tt = typeof tr === 'function' ? tr : x => x, title = tt('Hora de treinar 🎸'), opts = { body: tt('Sua missão do dia está esperando. Leva poucos minutos.'), icon: 'icon-192.png', badge: 'icon-192.png', tag: 'yourock-daily' };
    try { const reg = await navigator.serviceWorker.getRegistration(); if (reg) return reg.showNotification(title, opts); } catch (e) {}
    try { new Notification(title, opts); } catch (e) {}
  }
  function check() {
    if (!due() || S().remLast === today()) return;
    S().remLast = today(); save();
    if (canNotify()) notify();
  }
  async function enable() {
    if (!('Notification' in window)) return 'Este navegador não suporta notificações. O aviso aparece na tela inicial do app.';
    if (Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} }
    return Notification.permission === 'granted' ? '' : 'Notificações bloqueadas: libere nas permissões do site. Enquanto isso, o aviso aparece na tela inicial.';
  }
  function bannerHTML() {
    if (!due()) return '';
    return `<div class="card row sp" style="margin-bottom:12px;border-color:var(--acc)"><div><b>🎸 Hora de treinar!</b><div class="mut small">Você ainda não treinou hoje. Seu lembrete era às ${time()}.</div></div><button class="btn pri" data-act="startToday2">▶ Treinar agora</button></div>`;
  }
  function settingsHTML() {
    return `<div class="card"><h2>Lembrete de treino</h2>
      <label class="lbl"><input type="checkbox" data-in="rem" ${on() ? 'checked' : ''}> Lembrar de treinar todo dia</label>
      <label class="lbl" for="remT">Horário</label><input id="remT" type="time" data-in="remT" value="${time()}" style="width:auto">
      <div class="mut small" id="remInfo" style="margin-top:8px">O lembrete só avisa se você ainda não treinou no dia. A notificação aparece quando o app está aberto ou em segundo plano; com o app fechado, o aviso aparece na tela inicial na próxima vez que você abrir.</div></div>`;
  }
  document.addEventListener('input', async e => {
    const k = e.target.dataset && e.target.dataset.in; if (k !== 'rem' && k !== 'remT') return;
    await new Promise(x => setTimeout(x, 0));   // deixa o app.js gravar o ajuste antes
    if (k === 'rem' && e.target.checked) { const m = await enable(); const i = document.getElementById('remInfo'); if (m && i) i.textContent = m; S().remLast = null; save(); check(); }
    if (k === 'remT') { S().remLast = null; save(); check(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(check, 60000);
  setTimeout(check, 3000);
  return { bannerHTML, settingsHTML, check };
})();
