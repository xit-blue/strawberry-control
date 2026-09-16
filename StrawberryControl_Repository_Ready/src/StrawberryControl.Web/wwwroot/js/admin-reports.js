(() => {
  'use strict';
  const S = window.Strawberry;
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    document.getElementById('reportFrom').value = localDate(first);
    document.getElementById('reportTo').value = localDate(now);
    document.getElementById('applyReport').addEventListener('click', load);
    document.getElementById('refreshReport').addEventListener('click', load);
    load();
  }

  async function load() {
    try {
      const payload = {
        desde: document.getElementById('reportFrom').value,
        hasta: document.getElementById('reportTo').value,
        plataforma: document.getElementById('reportPlatform').value
      };
      const data = await S.api('adminDashboard', payload, { loader: true });
      const d = data.dashboard || {};
      renderFinance(d.financiero || {});
      S.renderBars(document.getElementById('reportStateBars'), d.operativo?.estados || {});
    } catch { }
  }

  function renderFinance(financial) {
    const period = financial.desde && financial.hasta ? `${S.date(financial.desde)} al ${S.date(financial.hasta)}` : 'Periodo';
    document.getElementById('realRange').textContent = period;
    document.getElementById('projectionRange').textContent = period;
    renderMetrics(document.getElementById('realMetrics'), financial.real || {});
    renderMetrics(document.getElementById('projectionMetrics'), financial.proyeccion || {});
  }

  function renderMetrics(host, m) {
    const rows = [
      ['Unidades', S.number(m.unidades)],
      ['Ingresos', S.money(m.ingresos)],
      ['Publicidad', S.money(m.publicidad)],
      ['Costo producción', S.money(m.costoProduccion)],
      ['Flete courier', S.money(m.fleteCourier)],
      ['Flete Shalom', S.money(m.fleteShalom)],
      ['Ganancia / pérdida', S.money(m.ganancia)]
    ];
    host.innerHTML = rows.map(([k,v]) => `<div class="report-metric"><span>${k}</span><strong>${v}</strong></div>`).join('');
  }

  function localDate(d) {
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
  }
})();
