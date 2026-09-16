(() => {
  'use strict';
  const S = window.Strawberry;
  const ids = ['precio1','precio2','precio3','precioExtra','costoUnitario','fleteLima','fleteProvincia','producto','um','maxIntentos','diasEsperaAdelanto','minutosBloqueo','horasSesion'];

  document.addEventListener('DOMContentLoaded', init);
  function init() {
    document.getElementById('configForm').addEventListener('submit', save);
    document.getElementById('forceSync').addEventListener('click', sync);
    load();
  }

  async function load() {
    try {
      const data = await S.api('getConfig', {}, { loader: true });
      const config = data.config || {};
      ids.forEach(id => { if (document.getElementById(id) && config[id] !== undefined) document.getElementById(id).value = config[id]; });
    } catch { }
  }

  async function save(event) {
    event.preventDefault();
    const payload = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      payload[id] = el.type === 'number' ? Number(el.value || 0) : el.value;
    });
    try {
      const data = await S.api('updateConfig', payload, { loader: true });
      S.toast('Configuración actualizada. Los pedidos fueron recalculados.', 'success', 4300);
      const config = data.config || {};
      ids.forEach(id => { if (document.getElementById(id) && config[id] !== undefined) document.getElementById(id).value = config[id]; });
    } catch { }
  }

  async function sync() {
    if (!S.confirmAction('¿Sincronizar ahora todos los pedidos?')) return;
    try {
      const data = await S.api('forceSync', {}, { loader: true });
      S.toast(data.message || 'Sincronización completada.', 'success');
    } catch { }
  }
})();
