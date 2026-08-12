// 本周热门电影 — 示例数据(纯前端演示,非真实排行)
const MOVIES = [
  {
    id: 1,
    title: '星际牧歌',
    emoji: '🚀',
    year: 2026,
    region: '美国',
    genre: ['科幻', '剧情'],
    rating: 8.7,
    boxOffice: 312,
    desc: '一艘驶向银河系尽头的拓荒船,在抵达目标前发现了一个不该存在的信号。导演用三小时慢火炖出人类在宇宙尺度下的渺小与浪漫,配乐与长镜头堪称年度标杆。',
  },
  {
    id: 2,
    title: '夜行列车',
    emoji: '🚂',
    year: 2026,
    region: '韩国',
    genre: ['悬疑', '动作'],
    rating: 8.4,
    boxOffice: 186,
    desc: '开往釜山的末班列车上,十名互不相识的乘客被困三小时。节奏极快、反转极狠,结局那张照片值得倒带三遍。',
  },
  {
    id: 3,
    title: '外婆的菜园',
    emoji: '🥬',
    year: 2026,
    region: '中国',
    genre: ['剧情'],
    rating: 8.9,
    boxOffice: 240,
    desc: '95 岁外婆与孙女在乡下半年时光,没有戏剧冲突,只有切菜声、雨声、远处的鸡叫。哭点低的人请自备纸巾。',
  },
  {
    id: 4,
    title: '功夫熊猫 5',
    emoji: '🐼',
    year: 2026,
    region: '美国',
    genre: ['动画', '喜剧'],
    rating: 8.1,
    boxOffice: 480,
    desc: '阿宝这回不当神龙大侠了,改行当爹。新反派是个会打太极的反派熊孩子,动作戏诚意拉满,小朋友可以连看三遍。',
  },
  {
    id: 5,
    title: '无声告白',
    emoji: '🕯️',
    year: 2026,
    region: '日本',
    genre: ['悬疑', '剧情'],
    rating: 8.6,
    boxOffice: 96,
    desc: '一起十年前的失踪案,所有当事人都在说谎。役所广司 + 长泽雅美,光是看脸就值回票价,剧情更是层层剥开。',
  },
  {
    id: 6,
    title: '速度与激情 11',
    emoji: '🏎️',
    year: 2026,
    region: '美国',
    genre: ['动作'],
    rating: 7.6,
    boxOffice: 620,
    desc: '家人侠们这次把家开到了太空,前三十分钟是飙车,后三十分钟是飙飞船。爽就完事了,别问物理定律。',
  },
  {
    id: 7,
    title: '深海 2:光之海',
    emoji: '🐋',
    year: 2026,
    region: '中国',
    genre: ['动画', '剧情'],
    rating: 8.5,
    boxOffice: 410,
    desc: '续作把粒子水墨技术拉满,小女孩在海底找回自己的名字。画面美到想截图做壁纸,泪点也比第一部更克制。',
  },
  {
    id: 8,
    title: '加班俱乐部',
    emoji: '💼',
    year: 2026,
    region: '中国',
    genre: ['喜剧', '剧情'],
    rating: 7.9,
    boxOffice: 158,
    desc: '五个互联网人决定每周三晚强制不加班,结果发现「不工作」比「工作」还难。打工人的嘴替电影,笑着笑着就哭了。',
  },
];

// ============ 渲染 ============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function formatWeekRange(date) {
  // ISO 周:周一为一周开始
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => `${x.getMonth() + 1} 月 ${x.getDate()} 日`;
  return `${monday.getFullYear} · ${fmt(monday)} – ${fmt(sunday)}`;
}

function renderWeek() {
  $('#weekLabel').textContent = formatWeekRange(new Date());
  $('#year').textContent = new Date().getFullYear();
}

function renderStats() {
  const avg = (MOVIES.reduce((s, m) => s + m.rating, 0) / MOVIES.length).toFixed(1);
  const box = MOVIES.reduce((s, m) => s + m.boxOffice, 0);
  $('#movieCount').textContent = MOVIES.length;
  document.querySelectorAll('.hero-stats strong')[1].textContent = avg;
  document.querySelectorAll('.hero-stats strong')[2].textContent =
    box >= 1000 ? `${(box / 1000).toFixed(1)}B` : `${box}M`;
}

function posterStyle(emoji) {
  // 用 emoji 渲染成一张大字海报,避免引入图片资源
  const palette = [
    ['#ff5e5b', '#ffb259'],
    ['#2dd4a0', '#0ea5e9'],
    ['#8b5cf6', '#ec4899'],
    ['#f59e0b', '#ef4444'],
    ['#06b6d4', '#3b82f6'],
    ['#10b981', '#facc15'],
  ];
  const [a, b] = palette[Math.abs(emoji.charCodeAt(0)) % palette.length];
  return `background: linear-gradient(135deg, ${a} 0%, ${b} 100%);`;
}

function renderMovies(filter = 'all') {
  const grid = $('#movieGrid');
  const list = filter === 'all' ? MOVIES : MOVIES.filter((m) => m.genre.includes(filter));
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty">这个类型本周没有推荐,试试别的分类。</p>';
    return;
  }
  grid.innerHTML = list
    .sort((a, b) => b.rating - a.rating)
    .map(
      (m, i) => `
      <article class="card" data-id="${m.id}" tabindex="0" role="button" aria-label="查看 ${m.title} 详情">
        <div class="poster" style="${posterStyle(m.emoji)}">
          <span class="rank-badge">#${i + 1}</span>
          <span class="rating-badge">★ ${m.rating.toFixed(1)}</span>
          <span>${m.emoji}</span>
        </div>
        <div class="body">
          <h3 class="title">${m.title}</h3>
          <p class="meta">${m.year} · ${m.region} · 票房 ${m.boxOffice}M</p>
          <div class="tags">
            ${m.genre.map((g) => `<span class="tag">${g}</span>`).join('')}
          </div>
        </div>
      </article>`
    )
    .join('');
}

// ============ 事件 ============
function bindFilters() {
  $('#genreFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    $$('.chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderMovies(btn.dataset.genre);
  });
}

function openModal(id) {
  const m = MOVIES.find((x) => x.id === Number(id));
  if (!m) return;
  $('#modalPoster').innerHTML = `
    <div style="position:absolute;inset:0;${posterStyle(m.emoji)};display:grid;place-items:center;">
      <span style="font-size:96px">${m.emoji}</span>
    </div>`;
  $('#modalTitle').textContent = m.title;
  $('#modalMeta').textContent = `${m.year} · ${m.region} · ★ ${m.rating.toFixed(1)} · 票房 ${m.boxOffice}M USD`;
  $('#modalDesc').textContent = m.desc;
  $('#modalTags').innerHTML = m.genre.map((g) => `<span class="tag">${g}</span>`).join('');
  $('#modal').classList.add('is-open');
  $('#modal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('#modal').classList.remove('is-open');
  $('#modal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
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
document.addEventListener('DOMContentLoaded', () => {
  renderWeek();
  renderStats();
  renderMovies();
  bindFilters();
  bindModal();
});
