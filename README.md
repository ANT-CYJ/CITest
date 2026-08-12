# 本周热门电影推荐 · Movie Weekly

一个纯静态的前端小项目,展示「本周热门电影推荐」,带类型筛选、详情弹窗、周次自动计算。
数据由 GitHub Actions 每周自动从 TMDb 抓取,前端只读 JSON,API key 不暴露在前端。

## ✨ 功能

- 🎯 **本周热门**:综合 TMDb trending 热度 + 评分 + 海报
- 🏷️ **类型筛选**:全部 / 动作 / 剧情 / 科幻 / 动画 / 悬疑 / 喜剧(自动匹配本周真实存在的类型)
- 🪟 **详情弹窗**:点击卡片查看简介、原名、类型、原始海报
- 📅 **周次自动**:页面打开即计算当前 ISO 周(周一到周日)
- 🔄 **数据自动**:每周一北京时间上午 9 点(UTC 01:00)自动刷新
- 📱 **响应式**:手机 / 平板 / 桌面都好看
- ♿ **可达性**:键盘 Enter / Space 打开弹窗,Esc 关闭

## 🛠️ 技术栈

- 原生 HTML / CSS / JavaScript,**无任何依赖、零构建**
- Google Fonts: Inter + Noto Sans SC
- CSS Grid + 自定义属性主题
- 数据来源:[TMDb](https://www.themoviedb.org/) trending API(`/trending/movie/week` + `/genre/movie/list`)

## 🚀 本地预览

直接用浏览器打开 `index.html` 即可,或者起一个本地服务器(走 JSON 时记得用 http 协议,直接 file:// 会被浏览器 CORS 拦):

```bash
python -m http.server 8000
# 浏览器访问 http://localhost:8000
```

## ⚙️ 配置自动刷新(可选,首次部署后)

1. 去 https://www.themoviedb.org/settings/api 申请一个 v3 API key
2. 在本仓库 `Settings → Secrets and variables → Actions → New repository secret`
3. Name 填 `TMDB_API_KEY`,Secret 填你的 v3 key,保存
4. 去 `Actions` 页面 → 左侧 `Refresh weekly trending movies` → `Run workflow` 手动跑一次,生成首份 `data/movies.json`
5. 之后每周一 UTC 01:00 自动跑,数据变了才会 commit 推送

## 📁 目录结构

```
movie-weekly/
├── index.html               # 页面骨架
├── styles.css               # 主题 + 布局 + 响应式
├── script.js                # 渲染 + 交互(读 data/movies.json,失败回退)
├── 404.html                 # 自定义 404
├── .nojekyll                # 跳过 Jekyll 渲染
├── data/
│   └── movies.json          # 每周 Actions 自动生成的本周数据
├── scripts/
│   └── build-movies-json.mjs # 把 TMDb 响应合并成 movies.json
└── .github/workflows/
    └── refresh-movies.yml   # 每周定时抓 TMDb
```

## 🙏 致谢

本产品使用了 [TMDb](https://www.themoviedb.org/) 的 API,但不为此背书。