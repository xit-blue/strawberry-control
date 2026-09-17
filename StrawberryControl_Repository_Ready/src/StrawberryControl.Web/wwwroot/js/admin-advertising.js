(() => {
  'use strict';
  const S = window.Strawberry;
  let items = [];
  let exchangeRate = 3.5;

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('resize', debounce(() => renderChart(), 160));

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
      renderChart();
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
      <td>${formatDateOnly(item.fecha)}</td><td>${Number(item.fbDolares || 0).toFixed(2)}</td><td>${S.money(item.fbSoles)}</td><td>${S.money(item.tiktokSoles)}</td><td><strong>${S.money(item.totalSoles)}</strong></td><td>${S.escapeHtml(item.observacion || '')}</td>
      <td><div class="table-actions"><button class="btn btn-ghost btn-sm" data-edit="${S.escapeHtml(item.id)}">Editar</button><button class="btn btn-ghost btn-sm" data-delete="${S.escapeHtml(item.id)}">Eliminar</button></div></td>
    </tr>`).join('');
    body.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => edit(btn.dataset.edit)));
    body.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => remove(btn.dataset.delete)));
  }

  function renderChart() {
    const host = document.getElementById('advertisingChart');
    if (!host) return;

    const daily = aggregateDailyUsd(items);
    updateChartMetrics(daily);

    if (!daily.length) {
      host.innerHTML = '<div class="chart-empty">No hay datos de publicidad para graficar.</div>';
      return;
    }

    const width = Math.max(760, 116 + daily.length * 82);
    const height = 360;
    const margin = { top: 26, right: 30, bottom: 64, left: 74 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const maxValue = Math.max(...daily.map(x => x.usd), 0);
    const yMax = niceMax(maxValue);
    const ticks = 5;
    const xStep = daily.length > 1 ? plotW / (daily.length - 1) : 0;

    const x = index => daily.length > 1 ? margin.left + index * xStep : margin.left + plotW / 2;
    const y = value => margin.top + plotH - (value / yMax) * plotH;
    const points = daily.map((d, i) => `${x(i).toFixed(1)},${y(d.usd).toFixed(1)}`).join(' ');

    let grid = '';
    for (let i = 0; i <= ticks; i++) {
      const value = (yMax / ticks) * i;
      const py = y(value);
      grid += `<line class="ad-chart-grid" x1="${margin.left}" y1="${py}" x2="${width - margin.right}" y2="${py}"></line>`;
      grid += `<text class="ad-chart-y-label" x="${margin.left - 13}" y="${py + 4}" text-anchor="end">$${formatTick(value)}</text>`;
    }

    const xLabels = daily.map((d, i) => {
      const px = x(i);
      return `<text class="ad-chart-x-label" x="${px}" y="${height - 30}" text-anchor="middle">${escapeSvg(shortDate(d.date))}</text>`;
    }).join('');

    const dots = daily.map((d, i) => {
      const px = x(i), py = y(d.usd);
      return `<g class="ad-chart-point"><circle cx="${px}" cy="${py}" r="5"></circle><title>${escapeSvg(formatDateOnly(d.date))}: US$ ${d.usd.toFixed(2)}</title></g>`;
    }).join('');

    const area = daily.length > 1
      ? `${margin.left},${margin.top + plotH} ${points} ${width - margin.right},${margin.top + plotH}`
      : `${x(0)-1},${margin.top + plotH} ${x(0)},${y(daily[0].usd)} ${x(0)+1},${margin.top + plotH}`;

    host.innerHTML = `<svg class="advertising-line-chart" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
      <defs>
        <linearGradient id="adAreaGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity=".20"></stop>
          <stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop>
        </linearGradient>
      </defs>
      ${grid}
      <line class="ad-chart-axis" x1="${margin.left}" y1="${margin.top + plotH}" x2="${width - margin.right}" y2="${margin.top + plotH}"></line>
      <line class="ad-chart-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotH}"></line>
      <polygon class="ad-chart-area" points="${area}"></polygon>
      ${daily.length > 1 ? `<polyline class="ad-chart-line" points="${points}"></polyline>` : ''}
      ${dots}
      ${xLabels}
      <text class="ad-chart-axis-title" x="${margin.left + plotW / 2}" y="${height - 4}" text-anchor="middle">Días</text>
      <text class="ad-chart-axis-title" transform="translate(17 ${margin.top + plotH / 2}) rotate(-90)" text-anchor="middle">Facebook US$</text>
    </svg>`;
  }

  function aggregateDailyUsd(source) {
    const byDate = new Map();
    source.forEach(item => {
      const date = normalizeDateOnly(item.fecha);
      if (!date) return;
      const usd = Math.max(0, Number(item.fbDolares || 0));
      byDate.set(date, (byDate.get(date) || 0) + usd);
    });
    return Array.from(byDate, ([date, usd]) => ({ date, usd: Math.round(usd * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function updateChartMetrics(daily) {
    const total = daily.reduce((sum, x) => sum + x.usd, 0);
    const average = daily.length ? total / daily.length : 0;
    const max = daily.length ? Math.max(...daily.map(x => x.usd)) : 0;
    setText('chartTotalUsd', `US$ ${total.toFixed(2)}`);
    setText('chartAverageUsd', `US$ ${average.toFixed(2)}`);
    setText('chartMaxUsd', `US$ ${max.toFixed(2)}`);
  }

  function edit(id) {
    const item = items.find(x => String(x.id) === String(id));
    if (!item) return;
    document.getElementById('advertisingId').value = item.id;
    document.getElementById('advertisingDate').value = normalizeDateOnly(item.fecha) || today();
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

  function normalizeDateOnly(value) {
    const raw = String(value ?? '').trim();
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const latam = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (latam) return `${latam[3]}-${latam[2].padStart(2,'0')}-${latam[1].padStart(2,'0')}`;
    return '';
  }

  function formatDateOnly(value) {
    const iso = normalizeDateOnly(value);
    if (!iso) return '—';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  function shortDate(value) {
    const iso = normalizeDateOnly(value);
    if (!iso) return '';
    const [,m,d] = iso.split('-');
    return `${d}/${m}`;
  }

  function niceMax(value) {
    if (!(value > 0)) return 10;
    const target = value * 1.15;
    const magnitude = Math.pow(10, Math.floor(Math.log10(target)));
    const normalized = target / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
  }

  function formatTick(value) {
    return value >= 100 ? Math.round(value).toString() : Number(value.toFixed(1)).toString();
  }

  function escapeSvg(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  }

  function today() {
    const d = new Date(); const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0,10);
  }
})();
