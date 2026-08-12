// 本周热门电影
// 数据来源:TMDb trending/movie/week,每周一由 GitHub Actions 抓取并写入 data/movies.json
// 如果 JSON 加载失败(尚未生成、网络异常),回退到内置兜底数据,保证页面不白屏

// ============ 兜底数据(数据未刷新时使用) ============
const FALLBACK_MOVIES = [
  { id: 'fb-1', title: '示例:数据加载中', year: 2025, rating: 0, genres: [], overview: 'GitHub Actions 还没生成首份数据,或本周 trending 接口暂不可用。等下一次定时任务跑完刷新即可。' },
];

// ============ 渲染 ============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function formatWeekRange(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => `${x.getMonth() + 1} 月 ${x.getDate()} 日`;
  return `${monday.getFullYear()} · ${fmt(monday)} – ${fmt(sunday)}`;
}

function renderWeek() {
  $('#weekLabel').textContent = formatWeekRange(new Date());
  $('#year').textContent = new Date().getFullYear();
}

function renderStats(movies) {
  const rated = movies.filter((m) => m.rating);
  const avg = rated.length ? (rated.reduce((s, m) => s + m.rating, 0) / rated.length).toFixed(1) : '—';
  $('#movieCount').textContent = movies.length;
  const statsStrong = document.querySelectorAll('.hero-stats strong');
  statsStrong[1].textContent = avg;
  // 票房字段在新数据源里没有,展示平均评分 + 数据生成时间更实在
  statsStrong[2].textContent = movies.length ? 'TMDb' : '—';
}

// 把 TMDb genre 名映射到 chip key
const GENRE_CHIPS = [
  { key: 'all', label: '全部' },
  { key: '动作', label: '动作' },
  { key: '剧情', label: '剧情' },
  { key: '科幻', label: '科幻' },
  { key: '动画', label: '动画' },
  { key: '悬疑', label: '悬疑' },
  { key: '喜剧', label: '喜剧' },
];

function renderFilters(movies) {
  // 只显示数据里真实存在的类型
  const present = new Set(movies.flatMap((m) => m.genres || []));
  const list = GENRE_CHIPS.filter((c) => c.key === 'all' || present.has(c.key));
  $('#genreFilters').innerHTML = list
    .map((c) => `<button class="chip ${c.key === 'all' ? 'is-active' : ''}" data-genre="${c.key}">${c.label}</button>`)
    .join('');
}

function posterStyleFor(seed) {
  const palette = [
    ['#ff5e5b', '#ffb259'],
    ['#2dd4a0', '#0ea5e9'],
    ['#8b5cf6', '#ec4899'],
    ['#f59e0b', '#ef4444'],
    ['#06b6d4', '#3b82f6'],
    ['#10b981', '#facc15'],
  ];
  const [a, b] = palette[Math.abs(seed) % palette.length];
  return `background: linear-gradient(135deg, ${a} 0%, ${b} 100%);`;
}

function posterMarkup(m, seed) {
  if (m.poster) {
    return `
      <div class="poster-img" style="background-image:url('${m.poster}');${posterStyleFor(seed)}"></div>
      <span class="rank-badge">#${seed + 1}</span>
      <span class="rating-badge">${m.rating ? '★ ' + m.rating.toFixed(1) : 'NEW'}</span>
    `;
  }
  return `
    <div class="poster-fallback" style="${posterStyleFor(seed)}">
      <span class="rank-badge">#${seed + 1}</span>
      <span class="rating-badge">${m.rating ? '★ ' + m.rating.toFixed(1) : 'NEW'}</span>
      <span>🎬</span>
    </div>
  `;
}

function renderMovies(movies, filter = 'all') {
  const grid = $('#movieGrid');
  const list = filter === 'all' ? movies : movies.filter((m) => (m.genres || []).includes(filter));
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">这个类型本周没有推荐,试试别的分类。</p>';
    return;
  }
  const sorted = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  grid.innerHTML = sorted
    .map(
      (m, i) => `
      <article class="card" data-id="${m.id}" tabindex="0" role="button" aria-label="查看 ${m.title} 详情">
        ${posterMarkup(m, i)}
        <div class="body">
          <h3 class="title">${escapeHtml(m.title)}</h3>
          <p class="meta">${m.year || '—'}${m.genres?.length ? ' · ' + m.genres.slice(0, 2).join(' / ') : ''}</p>
          <div class="tags">
            ${(m.genres || []).slice(0, 3).map((g) => `<span class="tag">${escapeHtml(g)}</span>`).join('')}
          </div>
        </div>
      </article>`
    )
    .join('');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ============ 数据加载 ============
let MOVIES = [];

async function loadMovies() {
  try {
    const res = await fetch('data/movies.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    MOVIES = json.movies || [];
    if (json.generatedAt) {
      const gen = new Date(json.generatedAt);
      const stamp = `${gen.getMonth() + 1}/${gen.getDate()} ${gen.getHours()}:${String(gen.getMinutes()).padStart(2, '0')}`;
      const label = document.getElementById('dataStamp');
      if (label) label.textContent = `数据更新于 ${stamp}`;
    }
  } catch (err) {
    console.warn('[movie-weekly] data/movies.json 加载失败,使用兜底数据:', err);
    MOVIES = FALLBACK_MOVIES;
  }
}

// ============ 弹窗 ============
function openModal(id) {
  const m = MOVIES.find((x) => String(x.id) === String(id));
  if (!m) return;
  const seed = String(m.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const posterBg = m.poster
    ? `background-image:url('${m.poster}');${posterStyleFor(seed)}`
    : posterStyleFor(seed);
  $('#modalPoster').innerHTML = `
    <div class="modal-poster-img" style="${posterBg}">
      ${!m.poster ? '<span style="font-size:96px">🎬</span>' : ''}
    </div>`;
  $('#modalTitle').textContent = m.title;
  const meta = [
    m.year || '—',
    m.rating ? '★ ' + m.rating.toFixed(1) : null,
    m.originalTitle && m.originalTitle !== m.title ? m.originalTitle : null,
  ].filter(Boolean).join(' · ');
  $('#modalMeta').textContent = meta || '—';
  $('#modalDesc').textContent = m.overview || '暂无简介。';
  $('#modalTags').innerHTML = (m.genres || []).map((g) => `<span class="tag">${escapeHtml(g)}</span>`).join('');
  $('#modal').classList.add('is-open');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.remove('is-open');
  $('#modal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ============ 事件 ============
function bindFilters() {
  $('#genreFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    $$('.chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderMovies(MOVIES, btn.dataset.genre);
  });
}

function bindModal() {
  $('#movieGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) openModal(card.dataset.id);
  });
  $('#movieGrid').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.card');
      if (card) {
        e.preventDefault();
        openModal(card.dataset.id);
      }
    }
  });
  $('#modal').addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// ============ 启动 ============
document.addEventListener('DOMContentLoaded', async () => {
  renderWeek();
  await loadMovies();
  renderStats(MOVIES);
  renderFilters(MOVIES);
  renderMovies(MOVIES);
  bindFilters();
  bindModal();
});