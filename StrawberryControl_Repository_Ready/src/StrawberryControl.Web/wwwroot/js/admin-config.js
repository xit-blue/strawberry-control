(() => {
  'use strict';
  const S = window.Strawberry;
  const ids = ['precio1','precio2','precio3','precioExtra','costoUnitario','fleteLima','fleteProvincia','tipoCambioPublicidad','producto','um','maxIntentos','diasEsperaAdelanto','minutosBloqueo','horasSesion'];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.getElementById('configForm').addEventListener('submit', save);
    document.getElementById('forceSync').addEventListener('click', sync);
    load();
  }

  async function load() {
    try {
      const data = await S.api('getConfig', {}, { loader: true });
      fill(data.config || {});
    } catch { }
  }

  function fill(config) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && config[id] !== undefined && config[id] !== null) el.value = config[id];
    });
  }

  async function save(event) {
    event.preventDefault();
    const payload = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      payload[id] = el.type === 'number' ? Number(el.value || 0) : el.value.trim();
    });

    if (payload.precio1 < 0 || payload.precio2 < 0 || payload.precio3 < 0 || payload.precioExtra < 0 || payload.costoUnitario < 0 || payload.fleteLima < 0 || payload.fleteProvincia < 0 || payload.tipoCambioPublicidad <= 0) {
      S.toast('Precios, costos y fletes no pueden ser negativos y el tipo de cambio debe ser mayor que 0.', 'error');
      return;
    }

    try {
      const data = await S.api('updateConfig', payload, { loader: true });
      fill(data.config || {});
      S.toast('Configuración guardada. Se recalcularon montos, fletes, saldos, resumen y proyecciones.', 'success', 5200);
    } catch { }
  }

  async function sync() {
    if (!S.confirmAction('¿Sincronizar ahora Hoja 1 hacia GESTION PEDIDOS y recalcular todo?')) return;
    try {
      const data = await S.api('forceSync', {}, { loader: true });
      S.toast(data.message || 'Sincronización completada.', 'success', 4500);
    } catch { }
  }
})();
