/* Read-only GitHub Pages companion to the original Bee Monitor dashboard. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const set = (id, value) => { const node = $(id); if (node) node.textContent = value ?? '—'; };
  const allowedPhoto = path => /^photos\/capture_\d{2}_raw\.jpg$/.test(path || '') ? path : '';
  const state = { photos: [], messages: [], alerts: [], metrics: [], livePage: 1, alertPage: 1,
                  original: 'http://140.127.26.34:5000/', chart: null };
  const pageSize = 20;

  function openOriginal() { window.open(state.original, '_blank', 'noopener,noreferrer'); }
  function cell(row, value) { const td = document.createElement('td'); td.textContent = value ?? '—'; row.appendChild(td); return td; }
  function photoCell(row, path) {
    const td = document.createElement('td'); row.appendChild(td);
    path = allowedPhoto(path);
    if (!path) { td.textContent = '本機保留'; return; }
    const link = document.createElement('a'); link.href = path; link.target = '_blank'; link.rel = 'noopener noreferrer';
    const img = document.createElement('img'); img.src = path; img.alt = '已保存原圖'; img.className = 'archive-photo-thumb';
    link.appendChild(img); td.appendChild(link);
  }
  function emptyRow(body, columns, message) {
    const row = document.createElement('tr'); const td = document.createElement('td');
    td.colSpan = columns; td.className = 'archive-empty'; td.textContent = message; row.appendChild(td); body.appendChild(row);
  }
  function pageSelect(id, count, selected) {
    const select = $(id); select.replaceChildren();
    const pages = Math.max(1, Math.ceil(count / pageSize));
    for (let index = 1; index <= pages; index++) {
      const option = new Option(`第 ${index} / ${pages} 頁`, String(index)); select.add(option);
    }
    select.value = String(Math.min(selected, pages));
    return Math.min(selected, pages);
  }
  function matches(haystack, query) { return !query || haystack.toLowerCase().includes(query.toLowerCase()); }
  function renderMessages() {
    const global = ($('keyword').value || '').trim(); const local = ($('filter-live').value || '').trim();
    const rows = state.messages.slice().reverse().filter(item => {
      const text = [item.timestamp, item.topic, item.decoded, item.filename].join(' ');
      return matches(text, global) && matches(text, local);
    });
    state.livePage = pageSelect('sel-live-page', rows.length, state.livePage);
    set('cnt-live', rows.length);
    const body = $('tbl-live'); body.replaceChildren();
    for (const item of rows.slice((state.livePage - 1) * pageSize, state.livePage * pageSize)) {
      const row = document.createElement('tr'); cell(row, item.timestamp); photoCell(row, item.photo);
      cell(row, item.filename || item.decoded || item.topic); body.appendChild(row);
    }
    if (!rows.length) emptyRow(body, 3, '目前沒有符合條件的歷史紀錄');
  }
  function renderAlerts() {
    const global = ($('keyword').value || '').trim(); const local = ($('filter-alert').value || '').trim();
    const level = $('sel-alert-level').value;
    const rows = state.alerts.slice().reverse().filter(item => {
      const text = [item.timestamp, item.level, item.message, item.filename].join(' ');
      return (!level || item.level === level) && matches(text, global) && matches(text, local);
    });
    state.alertPage = pageSelect('sel-alert-page', rows.length, state.alertPage);
    set('cnt-alerts', rows.length);
    const body = $('tbl-alerts'); body.replaceChildren();
    for (const item of rows.slice((state.alertPage - 1) * pageSize, state.alertPage * pageSize)) {
      const row = document.createElement('tr'); cell(row, item.timestamp); cell(row, item.level);
      cell(row, item.message); photoCell(row, item.photo); cell(row, item.filename); body.appendChild(row);
    }
    if (!rows.length) emptyRow(body, 5, '目前沒有符合條件的警報紀錄');
  }
  function renderMetrics() {
    const canvas = $('chart-metrics'); if (!canvas) return;
    const seconds = Number($('sel-metrics-range').value || 300);
    const latest = state.metrics.length ? new Date(state.metrics.at(-1).t).getTime() : 0;
    const rows = state.metrics.filter(item => latest - new Date(item.t).getTime() <= seconds * 1000);
    if (!window.Chart) {
      canvas.insertAdjacentHTML('afterend', '<p class="archive-static-note">圖表元件暫時無法載入；原始指標仍保留於同步資料。</p>');
      return;
    }
    if (state.chart) state.chart.destroy();
    state.chart = new Chart(canvas, { type: 'line', data: { labels: rows.map(item => item.t.slice(11, 19)), datasets: [
      { label: 'CPU %', data: rows.map(item => item.cpu), borderColor: '#0d6efd', pointRadius: 0, tension: .2 },
      { label: 'RAM %', data: rows.map(item => item.ram), borderColor: '#198754', pointRadius: 0, tension: .2 },
      { label: '溫度 °C', data: rows.map(item => item.temp), borderColor: '#fd7e14', pointRadius: 0, tension: .2 }
    ] }, options: { responsive: true, interaction: { intersect: false, mode: 'index' },
                  plugins: { title: { display: true, text: '最後同步前的系統指標' } } } });
  }
  function showPhoto(path) {
    path = allowedPhoto(path); if (!path) return;
    $('preview-img').src = path;
    if (window.bootstrap?.Modal) window.bootstrap.Modal.getOrCreateInstance($('modalPreview')).show();
    else window.open(path, '_blank', 'noopener,noreferrer');
  }
  function renderOverview(photos, history) {
    const newest = photos.photos[0];
    const shot = newest?.captured_at || '無資料'; const sync = history.generated_at || photos.generated_at || '無資料';
    const raw = allowedPhoto(newest?.original);
    set('archive-sync-time', `最後同步：${sync}`);
    set('js-online-text', '歷史快照'); set('js-last-heartbeat', `最後同步：${sync}`);
    set('fab-text', '快照'); set('fab-heartbeat', shot);
    set('badge-live', state.messages.length); set('badge-alerts', state.alerts.length);
    set('capture-subtitle', 'Windows 已保存的最近一張原圖');
    if (raw) { $('capture-image').src = raw; $('capture-image').classList.remove('d-none'); $('capture-empty').classList.add('d-none'); }
    set('live-status', '此頁顯示最後同步的靜態照片；即時畫面請開啟原站。');
    set('manual-capture-status', '拍照與即時影像需在原站操作，裝置關機時無法拍攝。');
    $('capture-facts').classList.remove('d-none'); set('capture-shot-time', shot); set('capture-received-time', sync);
    set('capture-status', `原圖快照：${shot}；僅同步最近 20 張。`);
    $('ph-latest').classList.add('d-none');
    if (raw) { $('img-latest').src = raw; $('img-latest').classList.remove('d-none'); }
    set('ts-latest', shot);
    $('box-latest').insertAdjacentHTML('beforeend', '<p class="archive-static-note mt-2">此處只展示原圖。辨識框請回原站核對，歷史警報未經人工確認。</p>');
    set('health-summary', '最後同步資料'); set('health-updated', sync);
    set('health-camera', '請至原站查看即時狀態');
    const metric = state.metrics.at(-1);
    set('health-memory', metric?.ram == null ? '無資料' : `${metric.ram}%`);
    set('health-memory-detail', '最後同步的 RAM 使用率');
    set('health-disk', '未公開'); set('health-disk-detail', '儲存空間請至原站查看');
    set('health-uptime', '未公開'); set('health-boot-time', '即時狀態請至原站查看');
    $('health-processes').textContent = '程序狀態請至原站查看';
    $('health-events-list').textContent = '歷史警報請使用左側「警報」頁籤；此頁不顯示即時心跳。';
    if (history.camera_alignment_pending_at_sync) $('camera-alignment-warning').classList.remove('d-none');
    $('archive-open-original').href = state.original;
    $('btn-capture-preview').disabled = !raw;
    $('btn-live-toggle').disabled = false;
  }
  async function renderWeather() {
    try {
      const params = new URLSearchParams({ latitude: '22.26', longitude: '120.65',
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',
        timezone: 'Asia/Taipei' });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('weather request failed');
      const current = (await response.json()).current;
      set('weather-temp', current.temperature_2m); set('weather-feels', current.apparent_temperature);
      set('weather-humidity', current.relative_humidity_2m); set('weather-wind', current.wind_speed_10m);
      set('weather-rain', current.precipitation); set('weather-time', current.time);
      set('weather-updated', new Date().toLocaleString('zh-TW'));
      set('weather-kind', 'Open-Meteo 枋山地區模式資料，非測站實測');
      $('weather-values').classList.remove('d-none'); set('weather-status', '');
    } catch (_) { set('weather-status', '目前無法更新天氣；歷史監測資料仍可查看。'); }
  }
  function bindNavigation() {
    document.querySelectorAll('#bm-nav .nav-link').forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      document.querySelectorAll('#bm-nav .nav-link').forEach(item => item.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('main.bm-content > section[id^="view-"]').forEach(section => section.classList.add('d-none'));
      document.querySelector(link.dataset.target)?.classList.remove('d-none');
      if (link.dataset.target === '#view-metrics') renderMetrics();
      window.scrollTo({top: 0, behavior: 'smooth'});
    }));
    $('mobile-menu-toggle').addEventListener('click', () => $('app').querySelector('.bm-sidebar').classList.toggle('mobile-open'));
    $('mobile-tools-toggle').addEventListener('click', () => $('app').querySelector('.bm-toolbar').classList.toggle('mobile-tools-open'));
  }
  function bindControls() {
    const originalIds = ['btn-manual-snap','btn-sync-config','btn-ping-jetson','btn-test-discord','btn-clear-history',
      'btn-capture-now','btn-live-toggle','btn-add-schedule','btn-save-basic','btn-reload-basic',
      'btn-save-weather','btn-remove-cwa-key','btn-save-adv','btn-reload-adv'];
    for (const id of originalIds) { const button = $(id); if (!button) continue;
      button.disabled = false; button.title = '在原站操作'; button.addEventListener('click', event => { event.preventDefault(); openOriginal(); }); }
    for (const id of ['form-basic','form-adv']) $(id)?.querySelectorAll('input,select,textarea').forEach(input => {
      input.disabled = true; input.title = '設定請在原站查看及修改';
    });
    for (const id of ['weather-source-select','cwa-api-key']) { const input = $(id); if (input) input.disabled = true; }
    set('cwa-key-status', '設定與授權碼僅保存在原站，請至原站查看。');
    $('box-schedule').textContent = '排程設定請至原站查看與修改。';
    for (const id of ['btn-mobile-refresh','btn-refresh-all','btn-reload-latest','btn-reload-metrics'])
      $(id)?.addEventListener('click', () => location.reload());
    $('btn-capture-preview').addEventListener('click', () => showPhoto(state.photos[0]?.original));
    $('btn-open-preview').addEventListener('click', () => showPhoto(state.photos[0]?.original));
    $('sel-interval').disabled = true; $('btn-toggle-poll').disabled = true;
    set('js-poll-chip', '約每 30 分鐘同步');
    $('sel-theme').addEventListener('change', event => {
      localStorage.setItem('bee_archive_theme', event.target.value); applyTheme(event.target.value);
    });
    const theme = localStorage.getItem('bee_archive_theme') || 'auto'; $('sel-theme').value = theme; applyTheme(theme);
    for (const id of ['keyword','filter-live']) $(id).addEventListener('input', () => { state.livePage = 1; renderMessages(); });
    for (const id of ['keyword','filter-alert']) $(id).addEventListener('input', () => { state.alertPage = 1; renderAlerts(); });
    $('btn-clear-keyword').addEventListener('click', () => { $('keyword').value = ''; renderMessages(); renderAlerts(); });
    $('sel-alert-level').addEventListener('change', () => { state.alertPage = 1; renderAlerts(); });
    $('sel-live-page').addEventListener('change', event => { state.livePage = Number(event.target.value); renderMessages(); });
    $('sel-alert-page').addEventListener('change', event => { state.alertPage = Number(event.target.value); renderAlerts(); });
    $('sel-metrics-range').addEventListener('change', renderMetrics);
  }
  function applyTheme(value) {
    const dark = value === 'dark' || (value === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('theme-dark', dark);
  }
  async function main() {
    bindNavigation(); bindControls();
    try {
      const [photoResponse, historyResponse] = await Promise.all([
        fetch('photos.json', {cache: 'no-store'}), fetch('history.json', {cache: 'no-store'})
      ]);
      if (!photoResponse.ok || !historyResponse.ok) throw new Error('snapshot files unavailable');
      const photos = await photoResponse.json(), history = await historyResponse.json();
      state.photos = photos.photos || []; state.messages = history.messages || [];
      state.alerts = history.alerts || []; state.metrics = history.metrics || [];
      state.original = history.original_site_url || state.original;
      renderOverview(photos, history); renderMessages(); renderAlerts(); renderWeather();
    } catch (_) {
      set('capture-status', '歷史資料暫時無法載入，請稍後重整。');
      set('archive-sync-time', '快照讀取失敗');
    }
  }
  document.addEventListener('DOMContentLoaded', main);
})();
