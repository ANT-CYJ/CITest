// 中国大陆本周院线热门
// 数据来源:TMDb movie/now_playing?region=CN,每周一由 GitHub Actions 抓取并写入 data/movies.json
// 如果 JSON 加载失败(尚未生成、网络异常),回退到内置兜底数据,保证页面不白屏

// ============ 兜底数据(数据未刷新时使用) ============
const FALLBACK_MOVIES = [
  { id: 'fb-1', title: '示例:数据加载中', year: 2025, rating: 0, genres: [], overview: 'GitHub Actions 还没生成首份数据,或本周 TMDb 接口暂不可用。等下一次定时任务跑完刷新即可。' },
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
  // statsStrong[2] 由 HTML 静态写「CN」地区标签,这里不动
  const statsStrong = document.querySelectorAll('.hero-stats strong');
  statsStrong[1].textContent = avg;
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

function posterFallbackEl(seed) {
  const el = document.createElement('div');
  el.className = 'poster-fallback';
  el.style.cssText = posterStyleFor(seed);
  el.innerHTML = '<span>🎬</span>';
  return el;
}

// 海报 URL 进 <img>,这样 CDN 失败才会触发原生 error 事件 —— 用 background-image 不会触发
function posterInner(m, seed) {
  if (m.poster) {
    return `<img class="poster-img" src="${escapeAttr(m.poster)}" alt="${escapeAttr(m.title)}" loading="lazy" data-fallback="${seed}">`;
  }
  // 没有 poster 字段直接走 fallback,不用浪费一次 img 请求
  return `<div class="poster-fallback" style="${posterStyleFor(seed)}"><span>🎬</span></div>`;
}

// 海报加载失败(CDN 不通/被墙):整体替换为渐变 + emoji 占位
function bindPosterFallback() {
  $('#movieGrid').addEventListener('error', (e) => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.classList && t.classList.contains('poster-img')) {
      const seed = Number(t.dataset.fallback || 0);
      t.replaceWith(posterFallbackEl(seed));
    }
  }, true);
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
        <div class="poster">
          ${posterInner(m, i)}
          <span class="rank-badge">#${i + 1}</span>
          <span class="rating-badge">${m.rating ? '★ ' + m.rating.toFixed(1) : 'NEW'}</span>
        </div>
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

function escapeAttr(s) {
  return escapeHtml(s);
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
function formatRuntime(min) {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return h > 0 ? `${h} 小时 ${r} 分` : `${r} 分钟`;
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function voteLabel(n) {
  if (!n) return null;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万人评分`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} 千人评分`;
  return `${n} 人评分`;
}

function scoreCircle(rating) {
  if (!rating) return '';
  // 把 0-10 映射到 0-360 度,作为圆环进度
  const pct = Math.max(0, Math.min(100, (rating / 10) * 100));
  const deg = (pct * 3.6).toFixed(1);
  const color = rating >= 7 ? 'var(--good)' : rating >= 5 ? 'var(--warn)' : 'var(--accent)';
  return `<div class="score-circle" style="background: conic-gradient(${color} ${deg}deg, rgba(255,255,255,0.12) 0deg);">
    <div class="score-circle-inner"><strong>${rating.toFixed(1)}</strong><small>/10</small></div>
  </div>`;
}

function peopleAvatars(people, withRole = true) {
  if (!people || people.length === 0) return '';
  return people.map((p) => {
    const initial = (p.name || '?')[0]?.toUpperCase() || '?';
    const avatar = p.profile
      ? `<img src="${escapeAttr(p.profile)}" alt="${escapeAttr(p.name)}" loading="lazy" data-person-name="${escapeAttr(p.name)}">`
      : `<div class="avatar-fallback">${escapeHtml(initial)}</div>`;
    const role = withRole
      ? `<small>${escapeHtml(p.character || p.role || '')}</small>`
      : '';
    return `<div class="person">
      ${avatar}
      <div class="person-meta">
        <strong>${escapeHtml(p.name)}</strong>
        ${role}
      </div>
    </div>`;
  }).join('');
}

// 给一组 person 头像绑圆形 fallback:头像加载失败时换成首字母
function bindAvatarFallbacks() {
  const card = $('#modal').querySelector('.modal-card');
  if (!card) return;
  card.querySelectorAll('img[data-person-name]').forEach((img) => {
    img.addEventListener('error', () => {
      const name = img.dataset.personName || '?';
      const initial = (name[0] || '?').toUpperCase();
      const fb = document.createElement('div');
      fb.className = 'avatar-fallback';
      fb.textContent = initial;
      img.replaceWith(fb);
    }, { once: true });
  });
}

// 渲染详情弹窗
function renderModal(m) {
  const seed = String(m.id).split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  // ----- 顶部 hero:背景图 + 海报 + 标题 -----
  const fallback = posterFallbackEl(seed);
  const hero = fallback;
  const backdrop = m.backdrop
    ? `<img class="modal-backdrop-img" src="${escapeAttr(m.backdrop)}" alt="${escapeAttr(m.title)} 剧照" loading="lazy">`
    : (m.poster ? `<img class="modal-backdrop-img" src="${escapeAttr(m.poster)}" alt="${escapeAttr(m.title)}" loading="lazy">` : '');
  const poster = m.poster
    ? `<img class="modal-poster-img" src="${escapeAttr(m.poster)}" alt="${escapeAttr(m.title)} 海报" loading="lazy" data-fallback="${seed}">`
    : '';

  const pills = [
    m.year || (m.releaseDate ? m.releaseDate.slice(0, 4) : null),
    formatRuntime(m.runtime),
    ...((m.genres || []).slice(0, 2))
  ].filter(Boolean);

  const heroHtml = `
    <div class="modal-hero">
      <div class="modal-backdrop-slot">${backdrop || '<div class="modal-backdrop-fallback"></div>'}</div>
      <div class="modal-hero-overlay"></div>
      <button class="modal-close" data-close="true" aria-label="关闭">×</button>
      <div class="modal-hero-content">
        <div class="modal-poster-slot">${poster || `<div class="modal-poster-img" style="${posterStyleFor(seed)};display:grid;place-items:center;"><span style="font-size:80px">🎬</span></div>`}</div>
        <div class="modal-hero-text">
          <h2 id="modalTitle">${escapeHtml(m.title)}</h2>
          ${m.originalTitle && m.originalTitle !== m.title ? `<p class="modal-original">${escapeHtml(m.originalTitle)}</p>` : ''}
          <div class="modal-pills">${pills.map((p) => `<span class="pill">${escapeHtml(p)}</span>`).join('')}</div>
        </div>
      </div>
    </div>`;

  // ----- 评分 + tagline -----
  const voteText = voteLabel(m.voteCount);
  const tagline = m.tagline ? `<p class="modal-tagline">"${escapeHtml(m.tagline)}"</p>` : '';
  const scoreHtml = (m.rating || voteText) ? `
    <div class="modal-score-row">
      ${m.rating ? scoreCircle(m.rating) : ''}
      <div class="modal-score-meta">
        ${voteText ? `<small class="modal-vote">${escapeHtml(voteText)}</small>` : ''}
        ${tagline}
      </div>
    </div>` : '';

  // ----- 简介 -----
  const overviewHtml = m.overview ? `
    <section class="modal-section">
      <h4>剧情简介</h4>
      <p class="modal-desc">${escapeHtml(m.overview)}</p>
    </section>` : '';

  // ----- 导演 + 主演 -----
  const director = m.director ? { name: m.director.name, role: '导演' } : null;
  const cast = (m.cast || []).slice(0, 6).map((c) => ({ name: c.name, role: c.character, profile: c.profile }));
  const people = [director, ...cast].filter(Boolean);
  const peopleHtml = people.length ? `
    <section class="modal-section">
      <h4>导演 & 主演</h4>
      <div class="modal-people">${peopleAvatars(people)}</div>
    </section>` : '';

  // ----- 制作信息 -----
  const infoRows = [
    m.genres?.length && ['类型', m.genres.join(' / ')],
    m.runtime && ['时长', formatRuntime(m.runtime)],
    (m.releaseDate || m.year) && ['上映', formatDate(m.releaseDate) || m.year],
    m.status && ['状态', m.status],
    m.productionCompanies?.length && ['制作', m.productionCompanies.join(' · ')],
    m.originalLanguage && ['语言', m.originalLanguage.toUpperCase()],
  ].filter(Boolean);
  const infoHtml = infoRows.length ? `
    <section class="modal-section">
      <h4>制作信息</h4>
      <ul class="modal-info">
        ${infoRows.map(([k, v]) => `<li><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></li>`).join('')}
      </ul>
    </section>` : '';

  // ----- 预告片 -----
  const trailer = m.trailer;
  const trailerHtml = trailer ? `
    <section class="modal-section">
      <h4>预告片 · ${escapeHtml(trailer.name || 'Trailer')}</h4>
      <div class="modal-trailer">
        <iframe src="https://www.youtube-nocookie.com/embed/${escapeAttr(trailer.key)}?rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
      </div>
    </section>` : '';

  // ----- 跳转链接 -----
  const tmdbUrl = `https://www.themoviedb.org/movie/${m.id}`;
  const ytSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent((m.originalTitle || m.title) + ' 预告片')}`;
  const actionsHtml = `
    <div class="modal-actions">
      <a class="action-btn" target="_blank" rel="noopener" href="${escapeAttr(ytSearch)}">▶ 在 YouTube 搜索</a>
      <a class="action-btn ghost" target="_blank" rel="noopener" href="${escapeAttr(tmdbUrl)}">在 TMDb 查看 →</a>
    </div>`;

  // 拼到 modal 里
  const card = $('#modal').querySelector('.modal-card');
  card.innerHTML = heroHtml + `
    <div class="modal-body">
      ${scoreHtml}
      ${overviewHtml}
      ${peopleHtml}
      ${infoHtml}
      ${trailerHtml}
      ${actionsHtml}
    </div>`;

  // 海报加载失败兜底
  const modalImg = card.querySelector('img.modal-poster-img');
  if (modalImg) {
    modalImg.addEventListener('error', () => {
      modalImg.replaceWith(posterFallbackEl(seed));
    }, { once: true });
  }
  const backdropImg = card.querySelector('.modal-backdrop-img');
  if (backdropImg) {
    backdropImg.addEventListener('error', () => {
      backdropImg.style.display = 'none';
    }, { once: true });
  }
  bindAvatarFallbacks();
}

function openModal(id) {
  const m = MOVIES.find((x) => String(x.id) === String(id));
  if (!m) return;
  renderModal(m);
  $('#modal').classList.add('is-open');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.remove('is-open');
  $('#modal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // 停止播放 YouTube(iframe 被销毁即可)
  const card = $('#modal').querySelector('.modal-card');
  if (card) card.innerHTML = '';
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
  bindPosterFallback();
});