/**
 * 模块一(A) — 数据融合公式
 * 两个不准确的测量，通过加权融合得到一个更可信的估计
 * 核心公式: ẑ = z₁ + K(z₂ − z₁)  |  K = σ₁²/(σ₁²+σ₂²)
 * 融合后方差 σ² = σ₁²σ₂²/(σ₁²+σ₂²) < min(σ₁², σ₂²)
 */
import { COLORS } from '../utils/colors.js';

export function createSection1FusionSketch(container) {
  return function (p) {
    let W, H;

    // 两个测量值（逻辑坐标 0-10）
    let z1 = 3.0;
    let z2 = 7.0;
    // 两个标准差
    let sigma1 = 1.2;
    let sigma2 = 0.8;

    // 拖动状态
    let dragging = null; // 'z1' | 'z2' | null
    const POINT_R = 10;

    p.setup = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      const canvas = p.createCanvas(W, H);
      canvas.parent(container);
      setTimeout(() => setupDOM(), 100);
    };

    // === 坐标转换 ===
    function toScreenX(lx) { return p.map(lx, 0, 10, 80, W - 80); }
    function toLogicX(sx) { return p.map(sx, 80, W - 80, 0, 10); }

    // === 计算融合结果 ===
    function computeFusion() {
      const v1 = sigma1 * sigma1;
      const v2 = sigma2 * sigma2;
      const K = v1 / (v1 + v2);             // 最优卡尔曼增益
      const zHat = z1 + K * (z2 - z1);      // 融合估计
      const vFused = (v1 * v2) / (v1 + v2); // 融合方差
      const sigmaFused = Math.sqrt(vFused);
      return { K, zHat, vFused, sigmaFused, v1, v2 };
    }

    // === DOM ===
    function setupDOM() {
      let overlay = container.querySelector('.viz-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'viz-overlay';
        overlay.style.cssText = 'position:absolute;bottom:10px;left:10px;right:10px;padding:10px;';
        overlay.innerHTML = `
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;">
            <div id="s1f-sigma1-slider"></div>
            <div id="s1f-sigma2-slider"></div>
            <div style="color:var(--text-muted);font-size:0.75rem;padding-bottom:4px;">
              💡 拖动 z₁(蓝)、z₂(红) 改变测量值
            </div>
          </div>
        `;
        container.appendChild(overlay);
      }

      function makeSlider(id, label, min, max, val, step, fmt, callback) {
        const div = document.getElementById(id);
        if (!div) return;
        div.innerHTML = `
          <div class="slider-label-row">
            <span class="slider-label">${label}</span>
            <span class="slider-value" id="${id}-val">${fmt(val)}</span>
          </div>
          <input type="range" class="param-slider" id="${id}-input" min="${min}" max="${max}" step="${step}" value="${val}">
        `;
        document.getElementById(`${id}-input`).addEventListener('input', (e) => {
          const v = parseFloat(e.target.value);
          document.getElementById(`${id}-val`).textContent = fmt(v);
          callback(v);
        });
      }

      makeSlider('s1f-sigma1-slider', 'σ₁ (测量1标准差)', 0.1, 3, sigma1, 0.05,
        v => v.toFixed(2), v => { sigma1 = v; });
      makeSlider('s1f-sigma2-slider', 'σ₂ (测量2标准差)', 0.1, 3, sigma2, 0.05,
        v => v.toFixed(2), v => { sigma2 = v; });
    }

    // === 事件 ===
    p.mousePressed = function () {
      if (dragging) return;
      const sx1 = toScreenX(z1);
      const sx2 = toScreenX(z2);
      const axY = H * 0.66; // 与 draw 中的 axisY 一致
      if (Math.abs(p.mouseX - sx1) < POINT_R + 8 && Math.abs(p.mouseY - axY) < 70) {
        dragging = 'z1';
      } else if (Math.abs(p.mouseX - sx2) < POINT_R + 8 && Math.abs(p.mouseY - axY) < 70) {
        dragging = 'z2';
      }
    };
    p.mouseDragged = function () {
      if (dragging === 'z1') z1 = p.constrain(toLogicX(p.mouseX), 0.2, 9.8);
      if (dragging === 'z2') z2 = p.constrain(toLogicX(p.mouseX), 0.2, 9.8);
    };
    p.mouseReleased = function () { dragging = null; };

    // === 绘制 ===
    p.draw = function () {
      p.background(10, 10, 26);
      const fusion = computeFusion();
      const sc = (W - 160) / 10;

      // 布局：上半画高斯曲线，下半画数轴和条带
      const gaussBaseY = H * 0.42;  // 高斯曲线的基线
      const gaussPeakY = H * 0.04;  // 高斯曲线峰值顶部
      const axisY = H * 0.66;       // 数轴位置
      const bandHalfH = 28;         // 不确定条带半高

      // === 坐标映射 ===
      const z1x = toScreenX(z1);
      const z2x = toScreenX(z2);
      const zHatX = toScreenX(fusion.zHat);

      // --- 0. 高斯概率密度曲线（上半部分） ---
      // 峰值 ∝ 1/σ：以最小的 σ 为基准，其峰值达到 gaussPeakY
      const minSigma = Math.min(sigma1, sigma2, fusion.sigmaFused);
      drawGaussianCurve(z1x, sigma1, COLORS.gaussModel, gaussBaseY, gaussPeakY, minSigma, 'σ₁=' + sigma1.toFixed(2));
      drawGaussianCurve(z2x, sigma2, COLORS.gaussMeasure, gaussBaseY, gaussPeakY, minSigma, 'σ₂=' + sigma2.toFixed(2));
      drawGaussianCurve(zHatX, fusion.sigmaFused, COLORS.gaussFused, gaussBaseY, gaussPeakY, minSigma, 'σ=' + fusion.sigmaFused.toFixed(2));

      // 图例
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(10);
      p.fill(COLORS.gaussModel[0], COLORS.gaussModel[1], COLORS.gaussModel[2], 200);
      p.text('━ z₁ 分布', 12, 8);
      p.fill(COLORS.gaussMeasure[0], COLORS.gaussMeasure[1], COLORS.gaussMeasure[2], 200);
      p.text('━ z₂ 分布', 12, 22);
      p.fill(COLORS.gaussFused[0], COLORS.gaussFused[1], COLORS.gaussFused[2], 220);
      p.text('━ ẑ 融合分布', 12, 36);

      // --- 1. 不确定度条带 ---
      const hw1 = 2 * sigma1 * sc;
      p.noStroke();
      p.fill(100, 149, 237, 30);
      p.rect(z1x - hw1, axisY - bandHalfH, 2 * hw1, 2 * bandHalfH);

      const hw2 = 2 * sigma2 * sc;
      p.fill(255, 99, 71, 30);
      p.rect(z2x - hw2, axisY - bandHalfH, 2 * hw2, 2 * bandHalfH);

      // 融合结果 ±2σ 带（更窄！）
      const hwF = 2 * fusion.sigmaFused * sc;
      p.fill(50, 205, 50, 45);
      p.rect(zHatX - hwF, axisY + bandHalfH + 4, 2 * hwF, 24);

      // --- 2. 数轴 ---
      p.stroke(180, 180, 200, 110);
      p.strokeWeight(2);
      p.line(80, axisY, W - 80, axisY);

      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i <= 10; i++) {
        const x = toScreenX(i);
        p.stroke(120, 120, 150, 60);
        p.strokeWeight(1);
        p.line(x, axisY - 5, x, axisY + 5);
        p.noStroke();
        p.fill(150, 150, 180, 120);
        p.text(String(i), x, axisY + 8);
      }

      // --- 3. z₁ 标记 ---
      drawMeasurementMarker(z1x, axisY, COLORS.gaussModel, 'z₁', dragging === 'z1');
      p.fill(COLORS.gaussModel[0], COLORS.gaussModel[1], COLORS.gaussModel[2], 210);
      p.textSize(11);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(z1.toFixed(2), z1x, axisY - POINT_R - 5);

      // --- 4. z₂ 标记 ---
      drawMeasurementMarker(z2x, axisY, COLORS.gaussMeasure, 'z₂', dragging === 'z2');
      p.fill(COLORS.gaussMeasure[0], COLORS.gaussMeasure[1], COLORS.gaussMeasure[2], 210);
      p.textSize(11);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(z2.toFixed(2), z2x, axisY - POINT_R - 5);

      // --- 5. ẑ 融合结果 ---
      drawFusedMarker(zHatX, axisY, fusion);
      p.fill(50, 205, 50, 230);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text(`ẑ=${fusion.zHat.toFixed(2)} σ=${fusion.sigmaFused.toFixed(2)}`, zHatX, axisY + bandHalfH + 34);

      // 融合箭头
      p.stroke(255, 255, 255, 50);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([3, 4]);
      p.line(z1x, axisY - bandHalfH - 2, zHatX, axisY + bandHalfH + 6);
      p.line(z2x, axisY - bandHalfH - 2, zHatX, axisY + bandHalfH + 6);
      p.drawingContext.setLineDash([]);

      // --- 6. 信息卡 ---
      drawInfoCard(fusion);

      // --- 7. 底部公式 ---
      p.fill(200, 200, 240, 110);
      p.textSize(11);
      p.textAlign(p.CENTER, p.TOP);
      p.text(`ẑ = z₁ + K·(z₂−z₁) = ${z1.toFixed(2)} + ${fusion.K.toFixed(3)}×${(z2-z1).toFixed(2)} = ${fusion.zHat.toFixed(2)}`, W / 2, H - 26);
    };

    // === 高斯概率密度曲线 ===
    function drawGaussianCurve(meanX, sigma, color, baseY, peakY, minSigma, label) {
      const stdPx = sigma * (W - 160) / 10;
      const maxH = baseY - peakY;
      // 峰值高度 ∝ 1/σ：最窄的分布最高
      const hScale = Math.min(1.0, minSigma / sigma);

      // 填充区域
      p.noStroke();
      p.fill(color[0], color[1], color[2], 28);
      p.beginShape();
      const xStart = meanX - 4 * stdPx;
      const xEnd = meanX + 4 * stdPx;
      p.vertex(Math.max(80, xStart), baseY);
      for (let x = Math.max(80, xStart); x <= Math.min(W - 80, xEnd); x += 1.5) {
        const z = (x - meanX) / stdPx;
        const y = baseY - maxH * hScale * Math.exp(-0.5 * z * z);
        p.vertex(x, y);
      }
      p.vertex(Math.min(W - 80, xEnd), baseY);
      p.endShape(p.CLOSE);

      // 曲线
      p.noFill();
      p.stroke(color[0], color[1], color[2], 210);
      p.strokeWeight(2.5);
      p.beginShape();
      for (let x = Math.max(80, xStart); x <= Math.min(W - 80, xEnd); x += 1) {
        const z = (x - meanX) / stdPx;
        const y = baseY - maxH * hScale * Math.exp(-0.5 * z * z);
        p.vertex(x, y);
      }
      p.endShape();

      // 峰值标签
      p.noStroke();
      p.fill(color[0], color[1], color[2], 190);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(10);
      p.text(label, meanX, baseY - maxH * hScale - 4);
    }

    function drawMeasurementMarker(x, axisY, color, label, isActive) {
      const r = isActive ? POINT_R + 3 : POINT_R;
      // 竖线
      p.stroke(color[0], color[1], color[2], 180);
      p.strokeWeight(isActive ? 3 : 2);
      p.line(x, axisY - 30, x, axisY + 30);

      // 圆
      p.fill(color[0], color[1], color[2], isActive ? 240 : 190);
      p.noStroke();
      p.circle(x, axisY, r * 2);

      // 标签
      p.fill(255);
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(label, x, axisY);
    }

    function drawFusedMarker(x, axisY, fusion) {
      // 竖线
      p.stroke(50, 205, 50, 220);
      p.strokeWeight(3);
      p.drawingContext.setLineDash([]);
      p.line(x, axisY + 48, x, axisY + 100);

      // 菱形标记
      p.fill(50, 205, 50, 230);
      p.noStroke();
      const r = POINT_R + 2;
      p.quad(x, axisY + 48 - r, x + r, axisY + 48, x, axisY + 48 + r, x - r, axisY + 48);

      // "融合" 标签
      p.fill(50, 205, 50, 230);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('ẑ', x - r - 8, axisY + 48);
    }

    function drawInfoCard(fusion) {
      const cx = W - 240, cy = 15, cw = 225;
      p.fill(30, 30, 50, 200);
      p.stroke(255, 255, 255, 40);
      p.strokeWeight(1);
      p.rect(cx, cy, cw, 185, 10);

      p.textAlign(p.LEFT, p.TOP);
      p.fill(127, 219, 255, 255);
      p.textSize(13);
      p.text('📐 融合公式（实数版）', cx + 10, cy + 10);

      p.textSize(11.5);
      const lx = cx + 10;
      let row = cy + 36;

      // 融合公式
      p.fill(220, 220, 240, 200);
      p.text('ẑ = z₁ + K · (z₂ − z₁)', lx, row);
      row += 22;

      // K 公式
      p.fill(255, 200, 100, 220);
      p.text('K = σ₁² / (σ₁² + σ₂²)', lx, row);
      row += 22;

      // K 数值
      p.fill(255, 180, 60, 200);
      p.text(`  = ${fusion.v1.toFixed(2)} / (${fusion.v1.toFixed(2)}+${fusion.v2.toFixed(2)})`, lx, row);
      row += 20;
      p.text(`K = ${fusion.K.toFixed(4)}`, lx + 10, row);
      row += 28;

      // 融合方差
      p.fill(50, 205, 50, 210);
      p.text(`σ² = σ₁²σ₂²/(σ₁²+σ₂²)`, lx, row);
      row += 20;
      p.text(`    = ${fusion.vFused.toFixed(3)}`, lx, row);
      row += 22;

      // 比较
      p.fill(200, 220, 240, 190);
      const minVar = Math.min(fusion.v1, fusion.v2);
      p.text(`融合 σ² < min(σ₁², σ₂²)`, lx, row);
      row += 18;
      p.fill(150, 150, 180, 150);
      p.text(`${fusion.vFused.toFixed(3)} < ${minVar.toFixed(2)}  ✓`, lx + 8, row);
    }

    p.windowResized = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
