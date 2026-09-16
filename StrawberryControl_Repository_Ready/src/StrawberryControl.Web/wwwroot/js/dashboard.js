(() => {
  'use strict';
  const S = window.Strawberry;

  document.addEventListener('DOMContentLoaded', loadDashboard);
  document.getElementById('refreshDashboard')?.addEventListener('click', loadDashboard);
  document.getElementById('syncButton')?.addEventListener('click', syncNow);

  async function loadDashboard() {
    try {
      const data = await S.api(S.isAdmin ? 'adminDashboard' : 'operationalDashboard', {}, { loader: true });
      const operational = S.isAdmin ? data.dashboard?.operativo : data.dashboard;
      const financial = S.isAdmin ? data.dashboard?.financiero : null;
      renderOperational(operational || {});
      if (financial) renderFinancial(financial);
    } catch { /* toast handled globally */ }
  }

  function renderOperational(d) {
    document.getElementById('heroTotal').textContent = `${S.number(d.total || 0)} pedidos`;
    document.getElementById('heroText').textContent = `${S.number(d.zonas?.LIMA || 0)} Lima · ${S.number(d.zonas?.PROVINCIA || 0)} Provincia`;
    document.getElementById('callsToday').textContent = S.number(d.llamadasHoy || 0);
    document.getElementById('activeNow').textContent = S.number(d.atendiendoAhora || 0);
    document.getElementById('overdueCallbacks').textContent = S.number(d.volverALlamarVencidas || 0);
    document.getElementById('advanceNearExpiry').textContent = S.number(d.esperandoAdelantoProximosAVencer || 0);

    document.querySelectorAll('[data-state]').forEach(el => {
      el.textContent = S.number(d.estados?.[el.dataset.state] || 0);
    });
    S.renderBars(document.getElementById('stateBars'), d.estados || {});
  }

  function renderFinancial(financial) {
    const real = financial.real || {};
    const projection = financial.proyeccion || {};
    document.getElementById('realIncome').textContent = S.money(real.ingresos);
    document.getElementById('realProfit').textContent = S.money(real.ganancia);
    document.getElementById('projectedIncome').textContent = S.money(projection.ingresos);
    document.getElementById('projectedProfit').textContent = S.money(projection.ganancia);
    document.getElementById('realPeriod').textContent = financial.desde && financial.hasta ? `${S.date(financial.desde)} al ${S.date(financial.hasta)}` : 'Periodo actual';
  }

  async function syncNow() {
    if (!S.confirmAction('¿Sincronizar ahora los pedidos desde la hoja de Shopify?')) return;
    try {
      const result = await S.api('forceSync', {}, { loader: true });
      S.toast(result.message || 'Sincronización completada.', 'success');
      await loadDashboard();
    } catch { }
  }
})();
