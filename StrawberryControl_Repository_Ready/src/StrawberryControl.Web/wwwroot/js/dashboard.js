(() => {
  'use strict';
  const S = window.Strawberry;
  const CACHE_KEY = `strawberry.dashboard.v46.${S.isAdmin ? 'admin' : 'worker'}`;
  let loadedOnce = false;

  document.addEventListener('DOMContentLoaded', () => {
    renderStoredSnapshot();
    loadDashboard(false);
  });
  document.getElementById('refreshDashboard')?.addEventListener('click', () => loadDashboard(true));
  document.getElementById('syncButton')?.addEventListener('click', syncNow);

  function renderStoredSnapshot() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached?.data) return;
      renderData(cached.data);
      setFreshness(cached.savedAt, true);
      loadedOnce = true;
    } catch { /* cache local corrupto: se ignora */ }
  }

  async function loadDashboard(forceFresh) {
    const refreshButton = document.getElementById('refreshDashboard');
    if (forceFresh && refreshButton) {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Actualizando...';
    }

    try {
      const payload = forceFresh ? { fresh: true } : {};
      const data = await S.api(S.isAdmin ? 'adminDashboard' : 'operationalDashboard', payload, {
        loader: false,
        toast: !loadedOnce
      });
      renderData(data);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
      setFreshness(Date.now(), false);
      loadedOnce = true;
    } catch (error) {
      if (loadedOnce) {
        S.toast('Se mantienen los últimos datos cargados mientras se recupera la conexión.', 'default', 4200);
      }
    } finally {
      if (refreshButton) {
        refreshButton.disabled = false;
        refreshButton.textContent = 'Actualizar';
      }
    }
  }

  function renderData(data) {
    const operational = S.isAdmin ? data.dashboard?.operativo : data.dashboard;
    const financial = S.isAdmin ? data.dashboard?.financiero : null;
    renderOperational(operational || {});
    if (financial) renderFinancial(financial);
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

  function setFreshness(timestamp, fromCache) {
    const el = document.getElementById('dashboardFreshness');
    if (!el) return;
    const d = new Date(timestamp || Date.now());
    const time = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(d);
    el.textContent = `${fromCache ? 'Mostrando última carga' : 'Actualizado'} ${time}`;
  }

  async function syncNow() {
    if (!S.confirmAction('¿Sincronizar ahora los pedidos desde la hoja de Shopify?')) return;
    try {
      const result = await S.api('forceSync', {}, { loader: true });
      S.toast(result.message || 'Sincronización completada.', 'success');
      sessionStorage.removeItem(CACHE_KEY);
      await loadDashboard(true);
    } catch { }
  }
})();
