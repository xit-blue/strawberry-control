(() => {
  'use strict';
  const S = window.Strawberry;
  let items = [];
  let exchangeRate = 3.5;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.getElementById('advertisingDate').value = today();
    document.getElementById('advertisingForm').addEventListener('submit', save);
    document.getElementById('newAdvertising').addEventListener('click', clearForm);
    document.getElementById('clearAdvertising').addEventListener('click', clearForm);
    ['fbUsd','ttPen'].forEach(id => document.getElementById(id).addEventListener('input', updateTotal));
    load();
  }

  async function load() {
    try {
      const data = await S.api('listAdvertising', {}, { loader: true });
      items = data.items || [];
      exchangeRate = Number(data.tipoCambioPublicidad || 3.5);
      const note = document.getElementById('exchangeRateNote');
      if (note) note.textContent = `Conversión automática: Facebook US$ × ${exchangeRate.toFixed(2)} = Facebook S/`;
      render();
      updateTotal();
    } catch { }
  }

  function render() {
    const body = document.getElementById('advertisingBody');
    if (!items.length) {
      body.innerHTML = '<tr><td colspan="7"><div class="table-loading">No hay gastos registrados.</div></td></tr>';
      return;
    }
    body.innerHTML = items.map(item => `<tr>
      <td>${S.date(item.fecha)}</td><td>${Number(item.fbDolares || 0).toFixed(2)}</td><td>${S.money(item.fbSoles)}</td><td>${S.money(item.tiktokSoles)}</td><td><strong>${S.money(item.totalSoles)}</strong></td><td>${S.escapeHtml(item.observacion || '')}</td>
      <td><div class="table-actions"><button class="btn btn-ghost btn-sm" data-edit="${S.escapeHtml(item.id)}">Editar</button><button class="btn btn-ghost btn-sm" data-delete="${S.escapeHtml(item.id)}">Eliminar</button></div></td>
    </tr>`).join('');
    body.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => edit(btn.dataset.edit)));
    body.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => remove(btn.dataset.delete)));
  }

  function edit(id) {
    const item = items.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('advertisingId').value = item.id;
    document.getElementById('advertisingDate').value = String(item.fecha || '').slice(0,10);
    document.getElementById('fbUsd').value = item.fbDolares || 0;
    document.getElementById('fbPen').value = item.fbSoles || 0;
    document.getElementById('ttPen').value = item.tiktokSoles || 0;
    document.getElementById('advertisingNote').value = item.observacion || '';
    document.getElementById('advertisingFormTitle').textContent = 'Editar gasto';
    updateTotal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save(event) {
    event.preventDefault();
    const payload = {
      id: document.getElementById('advertisingId').value,
      fecha: document.getElementById('advertisingDate').value,
      fbDolares: Number(document.getElementById('fbUsd').value || 0),
      tiktokSoles: Number(document.getElementById('ttPen').value || 0),
      observacion: document.getElementById('advertisingNote').value
    };
    try {
      await S.api('saveAdvertising', payload, { loader: true });
      S.toast('Gasto guardado.', 'success');
      clearForm();
      await load();
    } catch { }
  }

  async function remove(id) {
    if (!S.confirmAction('¿Eliminar este gasto de publicidad?')) return;
    try {
      await S.api('deleteAdvertising', { id }, { loader: true });
      S.toast('Gasto eliminado.', 'success');
      await load();
    } catch { }
  }

  function clearForm() {
    document.getElementById('advertisingId').value = '';
    document.getElementById('advertisingDate').value = today();
    document.getElementById('fbUsd').value = 0;
    document.getElementById('fbPen').value = 0;
    document.getElementById('ttPen').value = 0;
    document.getElementById('advertisingNote').value = '';
    document.getElementById('advertisingFormTitle').textContent = 'Agregar gasto';
    updateTotal();
  }

  function updateTotal() {
    const usd = Number(document.getElementById('fbUsd').value || 0);
    const fb = Math.round((usd * exchangeRate) * 100) / 100;
    const tt = Number(document.getElementById('ttPen').value || 0);
    const total = Math.round((fb + tt) * 100) / 100;
    document.getElementById('fbPen').value = fb.toFixed(2);
    document.getElementById('totalPen').value = S.money(total);
  }

  function today() {
    const d = new Date(); const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
  }
})();
