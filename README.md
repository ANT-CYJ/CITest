# 本周热门电影推荐 · Movie Weekly

一个纯静态的前端小项目,展示「本周热门电影推荐」,带类型筛选、详情弹窗、周次自动计算。

## ✨ 功能

- 🎯 **编辑精选**:8 部本周热门,综合票房 / 评分 / 热度
- 🏷️ **类型筛选**:全部 / 动作 / 剧情 / 科幻 / 动画 / 悬疑 / 喜剧
- 🪟 **详情弹窗**:点击卡片查看简介、配图(emoji 风格海报)
- 📅 **周次自动**:页面打开即计算当前 ISO 周(周一到周日)
- 📱 **响应式**:手机 / 平板 / 桌面都好看
- ♿ **可达性**:键盘 Enter / Space 打开弹窗,Esc 关闭

## 🛠️ 技术栈

- 原生 HTML / CSS / JavaScript,**无任何依赖、零构建**
- Google Fonts: Inter + Noto Sans SC
- CSS Grid + 自定义属性主题
- 纯前端 mock 数据,后端可后续替换

## 🚀 本地预览

直接用浏览器打开 `index.html` 即可,或者起一个本地服务器:

```bash
# 任选其一
python -m http.server 8000
npx serve .
```

然后访问 <http://localhost:8000>。

## 📁 目录结构

```
movie-weekly/
├── index.html      # 页面骨架
├── styles.css      # 主题 + 布局 + 响应式
├── script.js       # 数据 + 渲染 + 交互
├── 404.html        # 自定义 404
├── .nojekyll       # 跳过 Jekyll 渲染
└── README.md       # 你正在看的
```

## 🔧 后续可扩展

- 接 TMDb / 豆瓣 API 替换 mock 数据
- 加入「收藏」「看过」本地状态(localStorage)
- 加上深色 / 浅色主题切换
- 接入 GitHub Actions 自动部署到 Pages
