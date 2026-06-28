/**
 * 模块 1 — 高斯融合动画
 * 展示两个高斯分布相乘得到更窄高斯的过程
 * 直观表达："两个不确定信息融合后比任何一个都更确定"
 */
import { COLORS, rgba } from '../utils/colors.js';
import { T } from '../ui/i18n.js';

export function createSection1Sketch(container) {
  return function (p) {
    // 模型分布参数
    let modelMean = 0;
    let modelStd = 2;
    // 测量分布参数
    let measMean = 2.5;
    let measStd = 1.5;
    // 动画参数
    let animProgress = 0; // 0-1: 融合进度
    let targetProgress = 0;
    // 滑块引用
    let modelSlider, measSlider, fuseBtn;
    // 画布尺寸
    let W, H;

    p.setup = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      const canvas = p.createCanvas(W, H);
      canvas.parent(container);

      // 创建滑块（放在 DOM overlay 中）
      const overlay = container.querySelector('.viz-overlay');
      if (!overlay) {
        const div = document.createElement('div');
        div.className = 'viz-overlay';
        div.style.cssText = 'position:absolute;bottom:10px;left:10px;right:10px;padding:10px;';
        div.innerHTML = `
          <div class="slider-container" style="display:flex;gap:16px;flex-wrap:wrap;">
            <div id="s1-model-slider"></div>
            <div id="s1-meas-slider"></div>
            <div id="s1-buttons" style="display:flex;align-items:center;gap:8px;"></div>
          </div>
        `;
        container.appendChild(div);
      }

      // 延迟创建 DOM 滑块（等 DOM 准备好）
      setTimeout(() => setupSliders(), 100);
    };

    function setupSliders() {
      const modelDiv = document.getElementById('s1-model-slider');
      const measDiv = document.getElementById('s1-meas-slider');
      const btnDiv = document.getElementById('s1-buttons');

      if (!modelDiv || !measDiv || !btnDiv) return;

      // "模型不确定性" 滑块
      modelDiv.innerHTML = `
        <div class="slider-label-row">
          <span class="slider-label">${T.section1.legend.modelPrediction} σₘ</span>
          <span class="slider-value" id="s1-model-val">2.0</span>
        </div>
        <input type="range" class="param-slider" id="s1-model-input" min="0.3" max="4" step="0.1" value="2">
      `;
      // "传感器不确定性" 滑块
      measDiv.innerHTML = `
        <div class="slider-label-row">
          <span class="slider-label">${T.section1.legend.measurement} σᵣ</span>
          <span class="slider-value" id="s1-meas-val">1.5</span>
        </div>
        <input type="range" class="param-slider" id="s1-meas-input" min="0.3" max="4" step="0.1" value="1.5">
      `;
      // 动画按钮
      btnDiv.innerHTML = `
        <button class="ctrl-btn" id="s1-fuse-btn">融合演示</button>
        <button class="ctrl-btn" id="s1-reset-btn">重置</button>
      `;

      document.getElementById('s1-model-input').addEventListener('input', (e) => {
        modelStd = parseFloat(e.target.value);
        document.getElementById('s1-model-val').textContent = modelStd.toFixed(1);
      });
      document.getElementById('s1-meas-input').addEventListener('input', (e) => {
        measStd = parseFloat(e.target.value);
        document.getElementById('s1-meas-val').textContent = measStd.toFixed(1);
      });
      document.getElementById('s1-fuse-btn').addEventListener('click', () => {
        targetProgress = 1;
      });
      document.getElementById('s1-reset-btn').addEventListener('click', () => {
        targetProgress = 0;
      });
    }

    p.draw = function () {
      p.background(10, 10, 26);

      // 平滑动画
      animProgress += (targetProgress - animProgress) * 0.05;
      if (Math.abs(targetProgress - animProgress) < 0.001) {
        animProgress = targetProgress;
      }

      const scaleX = W / 10;
      const offsetX = W / 2;
      // 调整 model/meas 均值到画布坐标
      const mMeanX = offsetX + modelMean * scaleX;
      const mMidX = offsetX + measMean * scaleX;

      // 计算融合高斯参数
      // 两个高斯相乘: μ_fused = (μ₁σ₂² + μ₂σ₁²) / (σ₁² + σ₂²)
      const v1 = modelStd * modelStd;
      const v2 = measStd * measStd;
      const fusedStd = Math.sqrt((v1 * v2) / (v1 + v2));
      const fusedMean = (modelMean * v2 + measMean * v1) / (v1 + v2);
      const fusedMeanX = offsetX + fusedMean * scaleX;

      const maxY = H * 0.75;
      const baseY = H * 0.85;

      // 辅助函数：绘制高斯曲线
      function drawGauss(meanX, std, color, alpha, lineWidth = 3) {
        const stdPixels = std * scaleX;
        p.noFill();
        p.stroke(color[0], color[1], color[2], alpha);
        p.strokeWeight(lineWidth);
        p.beginShape();
        const startX = meanX - 4 * stdPixels;
        const endX = meanX + 4 * stdPixels;
        for (let x = Math.max(0, startX); x <= Math.min(W, endX); x++) {
          const z = (x - meanX) / stdPixels;
          const y = baseY - maxY * Math.exp(-0.5 * z * z);
          p.vertex(x, y);
        }
        p.endShape();

        // 均值竖线
        p.stroke(color[0], color[1], color[2], alpha * 0.5);
        p.strokeWeight(1);
        p.drawingContext.setLineDash([4, 4]);
        p.line(meanX, baseY, meanX, baseY - maxY);
        p.drawingContext.setLineDash([]);
      }

      // 填充
      function fillGauss(meanX, std, color, alpha) {
        const stdPixels = std * scaleX;
        p.noStroke();
        p.fill(color[0], color[1], color[2], alpha);
        p.beginShape();
        const startX = meanX - 4 * stdPixels;
        const endX = meanX + 4 * stdPixels;
        p.vertex(Math.max(0, startX), baseY);
        for (let x = Math.max(0, startX); x <= Math.min(W, endX); x++) {
          const z = (x - meanX) / stdPixels;
          const y = baseY - maxY * Math.exp(-0.5 * z * z);
          p.vertex(x, y);
        }
        p.vertex(Math.min(W, endX), baseY);
        p.endShape(p.CLOSE);
      }

      // --- 绘制 ---

      // 网格线
      p.stroke(60, 60, 90, 60);
      p.strokeWeight(1);
      for (let i = 0; i <= 10; i++) {
        const x = i * W / 10;
        p.line(x, 0, x, H);
      }

      // 模型分布（蓝色）
      fillGauss(mMeanX, modelStd, COLORS.gaussModel, 60);
      drawGauss(mMeanX, modelStd, COLORS.gaussModel, 220);

      // 测量分布（红色）
      fillGauss(mMidX, measStd, COLORS.gaussMeasure, 60);
      drawGauss(mMidX, measStd, COLORS.gaussMeasure, 220);

      // 融合分布（绿色） — 始终绘制，但透明度由 animProgress 控制
      if (animProgress > 0.01) {
        fillGauss(fusedMeanX, fusedStd, COLORS.gaussFused, Math.floor(animProgress * 120));
        drawGauss(fusedMeanX, fusedStd, COLORS.gaussFused, Math.floor(animProgress * 255), 4);
      }

      // X 轴
      p.stroke(150, 150, 180, 120);
      p.strokeWeight(1);
      p.line(0, baseY, W, baseY);

      // 标签
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);

      // 模型标签
      p.fill(COLORS.gaussModel[0], COLORS.gaussModel[1], COLORS.gaussModel[2], 200);
      p.text(`模型预测 σ=${modelStd.toFixed(1)}`, mMeanX, baseY + 5);

      // 测量标签
      p.fill(COLORS.gaussMeasure[0], COLORS.gaussMeasure[1], COLORS.gaussMeasure[2], 200);
      p.text(`传感器测量 σ=${measStd.toFixed(1)}`, mMidX, baseY + 5);

      // 融合结果标签
      if (animProgress > 0.3) {
        p.fill(COLORS.gaussFused[0], COLORS.gaussFused[1], COLORS.gaussFused[2], Math.floor(animProgress * 255));
        p.text(`融合结果 σ=${fusedStd.toFixed(2)}`, fusedMeanX, baseY - maxY - 25);

        // 标准差比较
        const smaller = fusedStd < Math.min(modelStd, measStd);
        if (smaller && animProgress > 0.7) {
          p.fill(255, 220, 0, animProgress * 200);
          p.textSize(16);
          p.textStyle(p.BOLD);
          p.text('✓ 融合后比两者都更窄！', W / 2, 25);
          p.textStyle(p.NORMAL);
          p.textSize(14);
        }
      }

      // 标题
      p.fill(200, 200, 230, 180);
      p.textSize(12);
      p.textAlign(p.RIGHT, p.TOP);
      p.text('两个高斯相乘 = 更窄的高斯', W - 15, 10);
      p.textAlign(p.LEFT, p.TOP);
    };

    p.windowResized = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
