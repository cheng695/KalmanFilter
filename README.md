# 🔬 Kalman Filter — 从直觉到理解

一个面向大一新生的卡尔曼滤波交互式教学网站。不推公式，建立直觉。

通过 6 个渐进式模块和 p5.js 交互可视化，从概率论基础一路走到完整的卡尔曼滤波递推流程。

## 🚀 如何运行

### 准备工作

你的电脑需要安装 [Node.js](https://nodejs.org/)（版本 18 或以上）。

克隆仓库后，先安装依赖：

```bash
cd KalmanFilter
npm install
```

### 开发模式（推荐）

```bash
npm run dev
```

终端会显示一个本地地址，通常是：

```
http://localhost:5173
```

在浏览器中打开即可。修改代码后页面会自动刷新。

### 生产构建

```bash
npm run build
npm run preview
```

`build` 会在 `dist/` 目录生成优化后的静态文件，可以直接部署到任何静态服务器（Nginx、GitHub Pages 等）。

## 📦 技术栈

| 技术 | 用途 |
|------|------|
| [Vite](https://vite.dev/) | 构建工具 & 开发服务器 |
| [p5.js](https://p5js.org/) | 交互式可视化（概率分布、协方差椭圆、目标追踪等） |
| [KaTeX](https://katex.org/) | 数学公式渲染（通过 CDN 加载） |

## 📁 项目结构

```
KalmanFilter/
├── index.html          # 主页面（所有 HTML/CSS 结构）
├── src/
│   ├── main.js         # 入口文件，初始化所有 sketch
│   ├── style.css       # 全局样式
│   ├── kalman/         # 卡尔曼滤波核心算法
│   │   ├── kalman-filter.js
│   │   ├── models.js
│   │   └── noise.js
│   ├── sketches/       # 6 个 p5.js 交互模块
│   │   ├── section0-statistics.js    # 模块零：概率论基础
│   │   ├── section1-fusion-formula.js # 模块一：数据融合公式
│   │   ├── section1-gaussians.js     # 高斯分布可视化
│   │   ├── section2-observer.js      # 模块二：状态观测器
│   │   ├── section2-prior-post.js    # 先验 & 后验
│   │   ├── section3-gain.js          # 模块三：卡尔曼增益
│   │   ├── section4-ellipses.js      # 模块四：协方差矩阵
│   │   └── section5-tracker.js       # 模块五：完整滤波追踪
│   ├── ui/             # UI 组件
│   │   ├── i18n.js
│   │   ├── section-manager.js
│   │   └── sliders.js
│   └── utils/          # 工具函数
│       ├── colors.js
│       ├── ellipse.js
│       └── matrix.js
├── public/             # 静态资源
│   ├── favicon.svg
│   └── icons.svg
├── vite.config.js
└── package.json
```

## 📖 教学内容

网站包含 6 个模块，建议按顺序阅读：

1. **模块零：概率论基础** — 均值、方差、高斯分布
2. **模块一：数据融合** — 两个传感器的测量，应该信哪个？
3. **模块二：状态观测器** — 用模型预测 + 测量修正
4. **模块三：先验 & 后验** — 预测（先验）和更新（后验）的直观理解
5. **模块四：卡尔曼增益** — 最优权重的来源
6. **模块五：完整滤波流程** — 五步递推：Predict → Update

每个模块都配有可交互的 p5.js 可视化，拖动滑块、移动鼠标即可直观感受参数变化的影响。

## ⚠️ 注意事项

- 首次打开需要网络连接（数学公式通过 KaTeX CDN 加载），之后浏览器缓存会生效
- 离线环境下公式可能无法渲染，但交互可视化不受影响
