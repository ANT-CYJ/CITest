// 本周热门电影 — 2024-2025 真实电影 + 真实评分
// 评分以豆瓣 / IMDb 为参考,票房为全球票房(单位:$M 百万美元)
const MOVIES = [
  {
    id: 1,
    title: '哪吒之魔童闹海',
    emoji: '🔥',
    year: 2025,
    region: '中国',
    genre: ['动画', '动作'],
    rating: 8.5,
    boxOffice: 2100,
    desc: '饺子导演续作。哪吒与敖丙共抗天劫,粒子水墨特效全开,目前全球单一市场票房第一,中国票房突破 154 亿元。',
  },
  {
    id: 2,
    title: '头脑特工队 2',
    emoji: '🧠',
    year: 2024,
    region: '美国',
    genre: ['动画', '喜剧'],
    rating: 8.4,
    boxOffice: 1700,
    desc: '皮克斯续作。Riley 长到 11 岁,焦焦、慕慕、尬尬、丧丧四个新情绪入驻总部,焦虑和快乐正面交锋,笑中带泪。',
  },
  {
    id: 3,
    title: '死侍与金刚狼',
    emoji: '💀',
    year: 2024,
    region: '美国',
    genre: ['动作', '喜剧'],
    rating: 7.7,
    boxOffice: 1340,
    desc: 'Ryan Reynolds 与 Hugh Jackman 时隔多年重聚,贱贱和小狼狗组队穿越多元宇宙,顺手把漫威宇宙从 TVA 里捞回来。',
  },
  {
    id: 4,
    title: '沙丘:第二部',
    emoji: '🏜️',
    year: 2024,
    region: '美国',
    genre: ['科幻', '动作'],
    rating: 8.5,
    boxOffice: 714,
    desc: '维伦纽瓦的史诗。保罗与弗雷曼人并肩作战,沙虫登场,汉斯·季默配乐依然是年度最强,IMAX 二刷仍震撼。',
  },
  {
    id: 5,
    title: '好东西',
    emoji: '💃',
    year: 2024,
    region: '中国',
    genre: ['剧情', '喜剧'],
    rating: 9.1,
    boxOffice: 50,
    desc: '邵艺辉继《爱情神话》后新作。两个单亲妈妈和一群小孩的上海日常,女性视角的轻盈幽默,豆瓣 9.1 是 2024 国产片最高分。',
  },
  {
    id: 6,
    title: '海洋奇缘 2',
    emoji: '🌊',
    year: 2024,
    region: '美国',
    genre: ['动画', '冒险'],
    rating: 7.0,
    boxOffice: 1000,
    desc: '迪士尼续集。莫阿娜远航寻找神秘岛屿,与失散多年的族人重逢,海画面依旧美到能直接当壁纸。',
  },
  {
    id: 7,
    title: '异形:夺命舰',
    emoji: '👽',
    year: 2024,
    region: '美国',
    genre: ['科幻', '惊悚'],
    rating: 7.5,
    boxOffice: 350,
    desc: '雷德利·斯科特监制。一群年轻殖民者闯入废弃空间站,撞上正在孵化的异形,回归 1979 年那种冷峻工业感。',
  },
  {
    id: 8,
    title: '角斗士 2',
    emoji: '⚔️',
    year: 2024,
    region: '美国',
    genre: ['动作', '剧情'],
    rating: 6.8,
    boxOffice: 450,
    desc: '雷德利·斯科特 24 年后的续篇。卢修斯为家国复仇重返斗兽场,Paul Mescal 与 Denzel Washington 对戏,场面依旧宏大。',
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
