(() => {
  'use strict';
  const S = window.Strawberry;
  const page = document.getElementById('orderPage');
  if (!page) return;

  const pedido = page.dataset.order;
  const isAdmin = page.dataset.admin === 'true';
  let currentOrder = null;
  let states = { lima: [], provincia: [] };
  let maxAttempts = 5;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    wireEvents();
    await loadStates();
    await loadOrder();
  }

  function wireEvents() {
    document.getElementById('claimOrder')?.addEventListener('click', claimOrder);
    document.getElementById('releaseOrder')?.addEventListener('click', releaseOrder);
    document.getElementById('noAnswerButton')?.addEventListener('click', registerNoAnswer);
    document.getElementById('answeredButton')?.addEventListener('click', () => document.getElementById('responseDialog')?.showModal());
    document.getElementById('reloadHistory')?.addEventListener('click', loadHistory);
    document.getElementById('orderForm')?.addEventListener('submit', saveOrder);
    document.getElementById('responseResult')?.addEventListener('change', updateResponseFields);
    document.getElementById('confirmResponse')?.addEventListener('click', registerResponse);
    document.getElementById('zona')?.addEventListener('change', refreshStateSelect);
    document.getElementById('modoZona')?.addEventListener('change', toggleZoneEditing);
    document.getElementById('estado')?.addEventListener('change', toggleOperationalFields);
    document.getElementById('adelanto')?.addEventListener('input', updateBalancePreview);
    document.getElementById('fechaEntrega')?.addEventListener('change', syncOperationalInputs);
    document.getElementById('fechaEnvio')?.addEventListener('change', syncOperationalInputs);
    document.getElementById('fleteShalom')?.addEventListener('change', syncOperationalInputs);
    document.getElementById('claveShalom')?.addEventListener('change', syncOperationalInputs);
    document.getElementById('confirmReopen')?.addEventListener('click', reopenOrder);
  }

  async function loadStates() {
    try {
      const data = await S.api('states', {}, { toast: false });
      states = { lima: data.lima || [], provincia: data.provincia || [] };
    } catch { }
  }

  async function loadOrder() {
    try {
      const data = await S.api('getOrder', { pedido }, { loader: true });
      currentOrder = data.order;
      renderOrder(currentOrder);
      renderHistory(data.history || []);
      await loadOperationalConfig();
    } catch (error) {
      document.getElementById('orderSubtitle').textContent = error.message;
    }
  }

  async function loadOperationalConfig() {
    try {
      const dashboard = await S.api('operationalDashboard', {}, { toast: false });
      maxAttempts = Number(dashboard.dashboard?.maxIntentos || 5);
      renderAttempts();
    } catch { renderAttempts(); }
  }

  function renderOrder(order) {
    if (!order) return;
    document.getElementById('orderNumber').textContent = order.pedido;
    document.getElementById('orderStatusBadge').outerHTML = S.statusBadge(order.estado).replace('<span ', '<span id="orderStatusBadge" ');
    document.getElementById('orderSubtitle').textContent = `${order.cliente || 'Sin nombre'} · ${order.telefono || 'Sin teléfono'} · ${order.zona}`;

    setValue('cliente', order.cliente);
    setValue('telefono', order.telefono);
    setValue('dni', order.dni);
    setValue('departamento', order.departamento);
    setValue('provincia', order.provincia);
    setValue('distrito', order.distrito);
    setValue('direccion', order.direccion);
    setValue('cantidadShopify', order.cantidadShopify);
    setValue('cantidadReal', order.cantidadReal);
    setValue('zona', order.zona);
    setValue('modoZona', order.modoZona || 'AUTO');
    setValue('comentario', order.comentario);
    setValue('fechaEntrega', S.toDateInput(order.fechaEntrega));
    setValue('fechaEnvio', S.toDateInput(order.fechaEnvio));
    setValue('adelanto', order.adelanto || 0);
    setValue('saldo', S.money(order.saldo || 0));
    setValue('fleteShalom', order.fleteShalom || 0);
    setValue('claveShalom', order.claveShalom || '');

    refreshStateSelect(order.estado);
    renderAttempts();
    renderAttention(order);
    renderSummary(order);
    renderQuickFlow(order);
    toggleZoneEditing();
    toggleOperationalFields();
    applyClosedState(order);

    const whatsapp = document.getElementById('whatsappButton');
    const number = order.whatsappNumero || (order.telefono ? `51${order.telefono}` : '');
    if (whatsapp) {
      whatsapp.href = number ? `https://wa.me/${encodeURIComponent(number)}` : '#';
      whatsapp.classList.toggle('hidden', !number);
    }
  }

  function renderAttempts() {
    const attempts = Number(currentOrder?.intentosLlamada || 0);
    document.getElementById('attemptBadge').textContent = `${attempts} / ${maxAttempts}`;
    document.getElementById('attemptProgress').style.width = `${Math.min(100, (attempts / Math.max(maxAttempts, 1)) * 100)}%`;
  }

  function renderAttention(order) {
    const banner = document.getElementById('attentionBanner');
    if (!banner) return;
    if (order.atendiendoPor) {
      banner.classList.remove('hidden');
      banner.textContent = `Este pedido está siendo atendido por ${order.atendiendoPor} desde ${S.dateTime(order.atendiendoDesde)}.`;
    } else {
      banner.classList.add('hidden');
      banner.textContent = '';
    }
  }

  function renderSummary(order) {
    document.getElementById('summaryProduct').textContent = `${order.producto || '—'} · ${S.number(order.cantidadReal)} ${order.um || ''}`;
    document.getElementById('summaryPlatform').textContent = order.plataforma || '—';
    document.getElementById('summaryZone').textContent = order.zona || '—';
    document.getElementById('summaryTotal').textContent = S.money(order.total);
    document.getElementById('summaryPayment').textContent = order.condicionPago || '—';
    document.getElementById('summaryUpdated').textContent = order.actualizadoEn ? `${S.dateTime(order.actualizadoEn)} · ${order.actualizadoPor || 'Sistema'}` : '—';
  }

  function renderQuickFlow(order) {
    const host = document.getElementById('quickFlow');
    if (!host) return;
    const buttons = [];
    const state = String(order.estado || '').toLowerCase();
    const zone = String(order.zona || '').toUpperCase();

    if (!order.cerrado) {
      if (zone === 'LIMA' && state === 'confirmado') buttons.push(buttonHtml('Programar entrega', 'program-lima'));
      if (zone === 'PROVINCIA' && state === 'confirmado') buttons.push(buttonHtml('Esperando adelanto', 'wait-advance'));
      if (zone === 'PROVINCIA' && state === 'esperando adelanto' && Number(order.adelanto || 0) > 0) buttons.push(buttonHtml('Marcar enviado', 'mark-sent'));
      if ((zone === 'LIMA' && state === 'programado') || (zone === 'PROVINCIA' && state === 'enviado')) buttons.push(buttonHtml('Marcar entregado', 'mark-delivered', 'btn-primary'));
    }
    if (isAdmin && order.cerrado) buttons.push(buttonHtml('Reabrir pedido', 'reopen', 'btn-ghost'));

    host.innerHTML = buttons.join('');
    host.querySelectorAll('[data-flow]').forEach(button => button.addEventListener('click', handleQuickFlow));
  }

  function buttonHtml(label, action, css = 'btn-ghost') {
    return `<button type="button" class="btn ${css}" data-flow="${action}">${S.escapeHtml(label)}</button>`;
  }

  async function handleQuickFlow(event) {
    const action = event.currentTarget.dataset.flow;
    if (action === 'reopen') return document.getElementById('reopenDialog')?.showModal();

    const payload = { pedido };
    if (action === 'program-lima') {
      const date = document.getElementById('fechaEntrega').value;
      if (!date) return S.toast('Selecciona primero la fecha de entrega.', 'warning');
      payload.estado = 'Programado'; payload.fechaEntrega = date;
    }
    if (action === 'wait-advance') payload.estado = 'Esperando adelanto';
    if (action === 'mark-sent') {
      const shipping = document.getElementById('fechaEnvio').value;
      if (!shipping) return S.toast('Selecciona primero la fecha de envío.', 'warning');
      payload.estado = 'Enviado'; payload.fechaEnvio = shipping;
      payload.adelanto = Number(document.getElementById('adelanto').value || 0);
      payload.fleteShalom = Number(document.getElementById('fleteShalom').value || 0);
      payload.claveShalom = document.getElementById('claveShalom').value;
    }
    if (action === 'mark-delivered') payload.estado = 'Entregado';

    await updateOrder(payload, `Estado actualizado a ${payload.estado}.`);
  }

  async function claimOrder() {
    try {
      const data = await S.api('claimOrder', { pedido }, { loader: true });
      currentOrder = data.order;
      renderOrder(currentOrder);
      S.toast('Pedido tomado para atención.', 'success');
    } catch { }
  }

  async function releaseOrder() {
    try {
      const data = await S.api('releaseOrder', { pedido }, { loader: true });
      currentOrder = data.order;
      renderOrder(currentOrder);
      S.toast('Atención liberada.', 'success');
    } catch { }
  }

  async function registerNoAnswer() {
    if (!S.confirmAction('¿Registrar que el cliente no respondió? Esto incrementará automáticamente el contador.')) return;
    try {
      const data = await S.api('registerNoAnswer', { pedido }, { loader: true });
      currentOrder = data.result?.order || currentOrder;
      renderOrder(currentOrder);
      await loadHistory();
      if (data.result?.autoCancelled) S.toast('Se alcanzó el máximo de intentos. El pedido fue cancelado automáticamente.', 'warning', 5200);
      else S.toast(`Intento ${data.result?.attempt || ''}/${data.result?.maxAttempts || maxAttempts} registrado.`, 'success');
    } catch { }
  }

  function updateResponseFields() {
    const result = document.getElementById('responseResult').value;
    document.getElementById('callbackField').classList.toggle('hidden', result !== 'Volver a llamar');
    document.getElementById('cancelReasonField').classList.toggle('hidden', result !== 'Cancelado');
  }

  async function registerResponse() {
    const result = document.getElementById('responseResult').value;
    const payload = {
      pedido,
      resultado: result,
      comentario: document.getElementById('responseComment').value
    };
    if (result === 'Volver a llamar') {
      const callback = document.getElementById('callbackDate').value;
      if (!callback) return S.toast('Indica fecha y hora para volver a llamar.', 'warning');
      payload.proximaLlamada = callback;
    }
    if (result === 'Cancelado') {
      const reason = document.getElementById('cancelReason').value;
      if (!reason) return S.toast('Selecciona el motivo de cancelación.', 'warning');
      payload.motivo = reason;
    }
    try {
      const data = await S.api('registerResponse', payload, { loader: true });
      currentOrder = data.result?.order || currentOrder;
      document.getElementById('responseDialog')?.close();
      document.getElementById('responseComment').value = '';
      renderOrder(currentOrder);
      await loadHistory();
      S.toast('Respuesta del cliente registrada.', 'success');
    } catch { }
  }

  async function saveOrder(event) {
    event.preventDefault();
    const payload = {
      pedido,
      cliente: value('cliente'),
      telefono: value('telefono'),
      dni: value('dni'),
      departamento: value('departamento'),
      provincia: value('provincia'),
      distrito: value('distrito'),
      direccion: value('direccion'),
      cantidadReal: Number(value('cantidadReal') || 0),
      modoZona: value('modoZona'),
      comentario: value('comentario'),
      estado: value('estado')
    };
    if (payload.modoZona === 'MANUAL') payload.zona = value('zona');
    syncOperationalInputs(payload);

    if (payload.estado === 'Cancelado' && !currentOrder?.motivo) {
      return S.toast('Para cancelar usa “Respondió” y selecciona un motivo, o registra el motivo desde la acción correspondiente.', 'warning');
    }
    await updateOrder(payload, 'Pedido actualizado correctamente.');
  }

  function syncOperationalInputs(target = null) {
    const payload = target || {};
    payload.fechaEntrega = value('fechaEntrega');
    payload.fechaEnvio = value('fechaEnvio');
    payload.adelanto = Number(value('adelanto') || 0);
    payload.fleteShalom = Number(value('fleteShalom') || 0);
    payload.claveShalom = value('claveShalom');
    return payload;
  }

  async function updateOrder(payload, successMessage) {
    try {
      let data = await S.api('updateOrder', payload, { loader: true });
      currentOrder = data.order;

      // API V4.5 valida/limpia CLAVE SHALOM según el estado existente antes de aplicar
      // el cambio de estado. Si en la misma operación pasamos a ENVIADO/ENTREGADO,
      // guardamos la clave en una segunda llamada ya con el estado válido.
      const requestedKey = String(payload.claveShalom || '').trim();
      const resultingState = String(currentOrder?.estado || '').toLowerCase();
      if (requestedKey && ['enviado', 'entregado'].includes(resultingState) && currentOrder?.claveShalom !== requestedKey) {
        data = await S.api('updateOrder', { pedido, claveShalom: requestedKey }, { loader: false });
        currentOrder = data.order;
      }

      renderOrder(currentOrder);
      S.toast(successMessage, 'success');
      return currentOrder;
    } catch { return null; }
  }

  async function loadHistory() {
    try {
      const data = await S.api('listCallHistory', { pedido, limit: 100 }, { toast: false });
      renderHistory(data.history || []);
    } catch { }
  }

  function renderHistory(items) {
    const host = document.getElementById('callHistory');
    if (!items.length) {
      host.innerHTML = '<p class="muted">Aún no hay llamadas registradas.</p>';
      return;
    }
    host.innerHTML = items.map(item => `<div class="timeline-item"><div class="timeline-head"><strong>${S.escapeHtml(item.resultado || item.tipo || 'Actividad')}</strong><span>${S.dateTime(item.fecha)}</span></div><p>${S.escapeHtml(item.nombreUsuario || item.usuario || 'Sistema')} · ${S.escapeHtml(item.estadoAntes || '')}${item.estadoDespues ? ` → ${S.escapeHtml(item.estadoDespues)}` : ''}${item.intento ? ` · Intento ${S.escapeHtml(item.intento)}` : ''}</p>${item.proximaLlamada ? `<p>Próxima llamada: <strong>${S.dateTime(item.proximaLlamada)}</strong></p>` : ''}${item.comentario ? `<p>${S.escapeHtml(item.comentario)}</p>` : ''}</div>`).join('');
  }

  function refreshStateSelect(selected = null) {
    const zone = String(value('zona') || currentOrder?.zona || 'LIMA').toUpperCase();
    const options = zone === 'PROVINCIA' ? states.provincia : states.lima;
    const select = document.getElementById('estado');
    const current = selected || select.value || currentOrder?.estado || '';
    select.innerHTML = options.map(state => `<option value="${S.escapeHtml(state)}">${S.escapeHtml(state)}</option>`).join('');
    if (options.includes(current)) select.value = current;
  }

  function toggleZoneEditing() {
    const manual = value('modoZona') === 'MANUAL';
    document.getElementById('zona').disabled = !manual || isReadOnly();
  }

  function toggleOperationalFields() {
    const zone = String(value('zona') || currentOrder?.zona || '').toUpperCase();
    const province = zone === 'PROVINCIA';
    ['shippingDateField','advanceField','balanceField','shalomFreightField','shalomKeyField'].forEach(id => document.getElementById(id)?.classList.toggle('hidden', !province));
    document.getElementById('deliveryDateField')?.classList.toggle('hidden', province);
    updateBalancePreview();
  }

  function applyClosedState(order) {
    const readOnly = order.cerrado && !isAdmin;
    document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea, #logisticsCard input, #logisticsCard select').forEach(el => el.disabled = readOnly || (el.id === 'zona' && value('modoZona') !== 'MANUAL'));
    document.getElementById('saveOrder').disabled = readOnly;
    document.getElementById('noAnswerButton').disabled = readOnly;
    document.getElementById('answeredButton').disabled = readOnly;
  }

  function isReadOnly() { return Boolean(currentOrder?.cerrado && !isAdmin); }

  function updateBalancePreview() {
    if (!currentOrder) return;
    const total = Number(currentOrder.total || 0);
    const advance = Number(value('adelanto') || 0);
    setValue('saldo', S.money(Math.max(0, total - advance)));
  }

  async function reopenOrder() {
    const state = value('reopenState');
    try {
      const data = await S.api('reopenOrder', { pedido, estado: state }, { loader: true });
      currentOrder = data.order;
      document.getElementById('reopenDialog')?.close();
      renderOrder(currentOrder);
      S.toast('Pedido reabierto.', 'success');
    } catch { }
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  }
  function value(id) { return document.getElementById(id)?.value ?? ''; }
})();
