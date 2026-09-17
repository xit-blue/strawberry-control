(() => {
  'use strict';
  const S = window.Strawberry;
  let page = 1;
  let pages = 1;
  let maxAttempts = 5;
  let states = [];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    wireEvents();
    await Promise.allSettled([loadStates(), loadOrders(false)]);
  }

  function wireEvents() {
    document.getElementById('applyFilters')?.addEventListener('click', () => { page = 1; loadOrders(); });
    document.getElementById('refreshOrders')?.addEventListener('click', () => loadOrders(true));
    document.getElementById('clearFilters')?.addEventListener('click', () => {
      ['filterSearch','filterState','filterZone','filterFrom','filterTo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('filterPlatform').value = 'TODAS';
      page = 1; loadOrders();
    });
    document.getElementById('pageSize')?.addEventListener('change', () => { page = 1; loadOrders(); });
    document.getElementById('prevPage')?.addEventListener('click', () => { if (page > 1) { page--; loadOrders(); } });
    document.getElementById('nextPage')?.addEventListener('click', () => { if (page < pages) { page++; loadOrders(); } });
    document.getElementById('filterSearch')?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); page = 1; loadOrders(); } });
  }

  async function loadStates() {
    try {
      const data = await S.api('states', {}, { toast: false });
      states = [...new Set([...(data.lima || []), ...(data.provincia || [])])];
      const select = document.getElementById('filterState');
      states.forEach(state => select.insertAdjacentHTML('beforeend', `<option value="${S.escapeHtml(state)}">${S.escapeHtml(state)}</option>`));
    } catch { }
  }

  async function loadOrders(forceFresh = false) {
    const body = document.getElementById('ordersBody');
    body.innerHTML = '<tr><td colspan="10"><div class="table-loading">Cargando pedidos...</div></td></tr>';
    try {
      const payload = {
        q: document.getElementById('filterSearch').value,
        estado: document.getElementById('filterState').value,
        zona: document.getElementById('filterZone').value,
        plataforma: document.getElementById('filterPlatform').value,
        desde: document.getElementById('filterFrom').value,
        hasta: document.getElementById('filterTo').value,
        page,
        pageSize: Number(document.getElementById('pageSize').value || 50),
        fresh: forceFresh
      };
      const data = await S.api('listOrders', payload, { toast: false });
      const result = data.data || {};
      pages = result.pages || 1;
      page = result.page || 1;
      renderOrders(result.items || []);
      document.getElementById('ordersCount').textContent = `${S.number(result.total || 0)} pedidos`;
      document.getElementById('pageInfo').textContent = `Página ${page} de ${pages}`;
      document.getElementById('paginationLabel').textContent = `${page} / ${pages}`;
      document.getElementById('prevPage').disabled = page <= 1;
      document.getElementById('nextPage').disabled = page >= pages;
    } catch (error) {
      body.innerHTML = `<tr><td colspan="10"><div class="table-loading">${S.escapeHtml(error.message)}</div></td></tr>`;
    }
  }

  function renderOrders(items) {
    const body = document.getElementById('ordersBody');
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="10"><div class="table-loading">No se encontraron pedidos con esos filtros.</div></td></tr>';
      return;
    }
    body.innerHTML = items.map(order => {
      const phone = order.telefono ? `<a class="text-link" href="https://wa.me/${S.escapeHtml(order.whatsappNumero || ('51' + order.telefono))}" target="_blank" rel="noopener">${S.escapeHtml(order.telefono)}</a>` : '—';
      const busy = order.atendiendoPor ? `<strong>${S.escapeHtml(order.atendiendoPor)}</strong><small class="muted">${S.dateTime(order.atendiendoDesde)}</small>` : '<span class="muted">Libre</span>';
      return `<tr>
        <td><a class="order-link" href="/Orders/Details/${encodeURIComponent(order.pedido)}">#${S.escapeHtml(order.pedido)}</a><div class="muted">${S.date(order.fecha)}</div></td>
        <td class="client-cell"><strong>${S.escapeHtml(order.cliente || 'Sin nombre')}</strong><span class="muted">${S.escapeHtml(order.distrito || order.provincia || '')}</span></td>
        <td class="contact-cell"><strong>${phone}</strong><span class="muted">${S.escapeHtml(order.dni || '')}</span></td>
        <td><strong>${S.escapeHtml(order.zona)}</strong><div class="muted">${S.escapeHtml(order.plataforma || '')}</div></td>
        <td>${S.number(order.cantidadReal)}</td>
        <td><strong>${S.money(order.total)}</strong></td>
        <td>${S.statusBadge(order.estado)}</td>
        <td>${S.attemptDots(order.intentosLlamada, maxAttempts)}</td>
        <td>${busy}</td>
        <td><div class="table-actions"><a class="btn btn-ghost btn-sm" href="/Orders/Details/${encodeURIComponent(order.pedido)}">Abrir</a></div></td>
      </tr>`;
    }).join('');
  }
})();
