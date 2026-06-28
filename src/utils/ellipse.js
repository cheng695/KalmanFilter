/**
 * 从 2×2 协方差矩阵绘制置信椭圆
 * 使用特征值分解获得椭圆的长短轴和旋转角
 */
import { eigen2x2 } from './matrix.js';

/**
 * 在 p5.js 画布上绘制协方差椭圆
 * @param {Object} p - p5.js 实例
 * @param {number[][]} P - 2×2 协方差矩阵
 * @param {number} cx - 椭圆中心 x
 * @param {number} cy - 椭圆中心 y
 * @param {number[]} colorRGB - RGB 颜色数组 [r,g,b]
 * @param {number} alpha - 透明度 0-255
 * @param {number} scale - 置信度缩放因子 (95% = 5.991, 68% = 2.28, 39% = 1.0)
 */
export function drawCovarianceEllipse(p, P, cx, cy, colorRGB, alpha = 200, scale = 5.991) {
  const { eigenvalues, eigenvectors } = eigen2x2(P);
  const [lambda1, lambda2] = eigenvalues;

  // 特征值可能接近零（数值误差）
  const a = Math.sqrt(Math.max(0, lambda1) * scale);
  const b = Math.sqrt(Math.max(0, lambda2) * scale);
  const angle = Math.atan2(eigenvectors[0][1], eigenvectors[0][0]);

  p.push();
  p.translate(cx, cy);
  p.rotate(angle);

  // 实心填充（非常透明）
  p.fill(colorRGB[0], colorRGB[1], colorRGB[2], 30);
  p.stroke(colorRGB[0], colorRGB[1], colorRGB[2], alpha);
  p.strokeWeight(2);
  p.ellipse(0, 0, 2 * a, 2 * b);

  // 绘制主轴（虚线）
  p.stroke(colorRGB[0], colorRGB[1], colorRGB[2], 100);
  p.strokeWeight(1);
  p.drawingContext.setLineDash([5, 5]);
  p.line(-a, 0, a, 0);
  p.line(0, -b, 0, b);
  p.drawingContext.setLineDash([]);

  p.pop();
}

/**
 * 绘制带有十字线的测量噪声圆
 */
export function drawMeasurementCircle(p, cx, cy, r, colorRGB, alpha = 180) {
  p.push();
  p.noFill();
  p.stroke(colorRGB[0], colorRGB[1], colorRGB[2], alpha);
  p.strokeWeight(2);
  p.ellipse(cx, cy, 2 * r, 2 * r);

  // 十字线
  p.strokeWeight(1);
  p.drawingContext.setLineDash([3, 3]);
  const crossSize = r * 1.3;
  p.line(cx - crossSize, cy, cx + crossSize, cy);
  p.line(cx, cy - crossSize, cx, cy + crossSize);
  p.drawingContext.setLineDash([]);
  p.pop();
}

/**
 * 绘制从先验到后验的修正箭头
 */
export function drawCorrectionArrow(p, fromX, fromY, toX, toY, colorRGB) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.5) return;

  const headSize = Math.min(10, dist / 3);
  const angle = Math.atan2(dy, dx);

  p.push();
  p.stroke(colorRGB[0], colorRGB[1], colorRGB[2], 220);
  p.strokeWeight(2.5);
  p.fill(colorRGB[0], colorRGB[1], colorRGB[2], 220);

  // 箭头线
  p.line(fromX, fromY, toX, toY);

  // 箭头头部
  p.translate(toX, toY);
  p.rotate(angle);
  p.triangle(0, 0, -headSize, -headSize / 2, -headSize, headSize / 2);

  p.pop();
}
