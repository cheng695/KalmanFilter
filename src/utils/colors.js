// 卡尔曼滤波教学网站 — 统一调色板
export const COLORS = {
  // 核心数据元素
  groundTruth:   [ 46, 204,  64], // #2ECC40 绿色 — 真实轨迹
  measurement:   [255,  65,  54], // #FF4136 红色 — 测量值
  posterior:     [  0, 116, 217], // #0074D9 蓝色 — 后验估计
  prior:         [255, 133,  27], // #FF851B 橙色 — 先验预测
  covariance:    [255, 220,   0], // #FFDC00 黄色 — 协方差椭圆
  kalmanArrow:   [255, 255, 255], // 白色 — 修正箭头

  // 高斯曲线
  gaussModel:    [100, 149, 237], // 矢车菊蓝 — 模型预测分布
  gaussMeasure:  [255,  99,  71], // 番茄红   — 测量分布
  gaussFused:    [ 50, 205,  50], // 酸橙绿   — 融合后分布

  // UI 辅助
  panelBg:       [ 30,  30,  50], // 面板背景
  gridLine:      [ 60,  60,  90], // 网格线
  textPrimary:   [220, 220, 240], // 主文字
  textSecondary: [150, 150, 180], // 辅助文字
};

// 将 RGB 数组转为 CSS rgba 字符串
export function rgba(color, alpha = 1) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

// 将 RGB 数组转为 p5.js 可用的数组（0-255）
export function rgb(color) {
  return color;
}
