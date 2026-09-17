(() => {
  'use strict';

  const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
  const role = document.querySelector('meta[name="user-role"]')?.content || '';
  const name = document.querySelector('meta[name="user-name"]')?.content || '';

  class ApiError extends Error {
    constructor(message, code, payload) {
      super(message || 'Ocurrió un error.');
      this.name = 'ApiError';
      this.code = code || 'ERROR';
      this.payload = payload;
    }
  }

  async function api(action, payload = {}, options = {}) {
    if (options.loader) setLoading(true);
    try {
      const response = await fetch('/api/gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'RequestVerificationToken': csrf
        },
        credentials: 'same-origin',
        body: JSON.stringify({ action, payload })
      });

      if (response.status === 401) {
        window.location.href = '/Auth/Login?expired=true';
        throw new ApiError('Tu sesión terminó.', 'AUTH_REQUIRED');
      }
      if (response.status === 403) throw new ApiError('No tienes permiso para realizar esta acción.', 'FORBIDDEN');

      const text = await response.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; }
      catch { throw new ApiError('La respuesta del servidor no es válida.', 'INVALID_JSON', text); }

      if (!response.ok || data.ok === false) {
        throw new ApiError(data.message || 'No se pudo completar la operación.', data.code || `HTTP_${response.status}`, data);
      }

      setConnection(true, response.headers.get('X-Strawberry-Cache') === 'HIT'
        ? 'Conectado · respuesta rápida'
        : 'Conectado a Google Sheets');
      return data;
    } catch (error) {
      if (['TIMEOUT', 'NETWORK_ERROR', 'INVALID_JSON'].includes(error?.code)) {
        setConnection(false, 'Conexión lenta');
      }
      if (options.toast !== false && error?.code !== 'AUTH_REQUIRED') toast(error.message || 'Error inesperado.', 'error');
      throw error;
    } finally {
      if (options.loader) setLoading(false);
    }
  }

  function toast(message, type = 'default', duration = 3200) {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    host.appendChild(item);
    window.setTimeout(() => item.remove(), duration);
  }

  function setLoading(show) {
    document.getElementById('pageLoader')?.classList.toggle('hidden', !show);
  }

  function money(value) {
    const n = Number(value || 0);
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(n);
  }

  function number(value) {
    return new Intl.NumberFormat('es-PE').format(Number(value || 0));
  }

  function date(value) {
    if (!value) return '—';
    const d = parseDate(value);
    if (!d) return String(value);
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  }

  function dateTime(value) {
    if (!value) return '—';
    const d = parseDate(value);
    if (!d) return String(value);
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(d);
  }

  function toDateInput(value) {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const d = parseDate(value);
    if (!d) return '';
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 10);
  }

  function toDateTimeLocal(value) {
    if (!value) return '';
    const d = parseDate(value);
    if (!d) return '';
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function parseDate(value) {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const raw = String(value ?? '').trim();
    const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
      const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12, 0, 0, 0);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function slug(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function statusBadge(status) {
    return `<span class="status-badge ${slug(status) || 'neutral'}">${escapeHtml(status || 'Sin estado')}</span>`;
  }

  function renderBars(container, states = {}) {
    if (!container) return;
    const entries = Object.entries(states).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      container.innerHTML = '<p class="muted">No hay datos para mostrar.</p>';
      return;
    }
    const max = Math.max(...entries.map(([, count]) => Number(count || 0)), 1);
    container.innerHTML = entries.map(([label, count]) => {
      const width = Math.max(2, (Number(count || 0) / max) * 100);
      return `<div class="bar-row"><span>${escapeHtml(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong class="bar-value">${number(count)}</strong></div>`;
    }).join('');
  }

  function attemptDots(count, max = 5) {
    const active = Math.max(0, Math.min(Number(count || 0), max));
    return `<span class="attempt-mini" title="${active}/${max} intentos">${Array.from({ length: max }, (_, i) => `<span class="${i < active ? 'on' : ''}"></span>`).join('')}</span>`;
  }

  function collectForm(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function setConnection(ok, text) {
    const el = document.getElementById('connectionStatus');
    if (!el) return;
    el.className = `connection-status ${ok ? 'ok' : 'bad'}`;
    el.textContent = text || (ok ? 'Conectado' : 'Sin conexión');
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  menuToggle?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  document.addEventListener('click', (event) => {
    if (window.innerWidth > 900 || !sidebar?.classList.contains('open')) return;
    if (!sidebar.contains(event.target) && event.target !== menuToggle) sidebar.classList.remove('open');
  });

  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });

  window.Strawberry = {
    api, ApiError, toast, setLoading, setConnection, money, number, date, dateTime, toDateInput, toDateTimeLocal,
    escapeHtml, slug, statusBadge, renderBars, attemptDots, collectForm, confirmAction,
    role, name, isAdmin: role === 'ADMIN'
  };

  // No hacemos un ping adicional. La primera llamada real de cada pantalla actualiza el estado de conexión.
  setConnection(true, 'Sistema listo');
})();
