(() => {
  'use strict';
  const S = window.Strawberry;
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.getElementById('refreshAudit').addEventListener('click', load);
    document.getElementById('applyAudit').addEventListener('click', load);
    document.getElementById('auditSearch').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); load(); } });
    load();
  }

  async function load() {
    const body = document.getElementById('auditBody');
    body.innerHTML = '<tr><td colspan="7"><div class="table-loading">Cargando auditoría...</div></td></tr>';
    try {
      const data = await S.api('listAudit', {
        q: document.getElementById('auditSearch').value,
        pedido: document.getElementById('auditOrder').value,
        limit: Number(document.getElementById('auditLimit').value || 200)
      }, { toast: false });
      const items = data.items || [];
      body.innerHTML = items.length ? items.map(item => `<tr><td>${S.dateTime(item.fecha)}</td><td><strong>${S.escapeHtml(item.usuario)}</strong></td><td>${S.escapeHtml(item.rol)}</td><td>${S.escapeHtml(item.accion)}</td><td>${item.pedido ? `<a class="order-link" href="/Orders/Details/${encodeURIComponent(item.pedido)}">#${S.escapeHtml(item.pedido)}</a>` : '—'}</td><td>${S.escapeHtml(item.detalle || '')}</td><td>${S.escapeHtml(item.origen || '')}</td></tr>`).join('') : '<tr><td colspan="7"><div class="table-loading">No se encontraron registros.</div></td></tr>';
    } catch (error) {
      body.innerHTML = `<tr><td colspan="7"><div class="table-loading">${S.escapeHtml(error.message)}</div></td></tr>`;
    }
  }
})();
