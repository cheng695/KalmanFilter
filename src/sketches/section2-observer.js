/**
 * 模块一(B) — 全状态观测器
 * 位移-速度 弹簧质量系统 + Luenberger 观测器
 * 核心方程: ẋ̂ = Aẋ̂ + Bu + L(z − Cẋ̂)
 */
import { COLORS } from '../utils/colors.js';
import { gaussianRandom } from '../kalman/noise.js';

export function createSection2ObserverSketch(container) {
  return function (p) {
    let W, H;

    // === 物理系统参数 ===
    const m = 1.0;   // 质量
    const k = 2.0;   // 弹簧常数
    const c = 0.3;   // 阻尼

    // A = [[0, 1], [-k/m, -c/m]]
    const A = [[0, 1], [-k / m, -c / m]];
    const B = [[0], [1 / m]];
    const C = [1, 0];  // 只测位置

    // 真实状态 [pos, vel]
    let xTrue = [1.5, 0.0];   // 初始位移 1.5，初速 0
    // 估计状态
    let xEst = [0.0, 0.0];    // 初始估计为 0

    // 观测器增益 L = [L1, L2]
    let L1 = 3.0;
    let L2 = 4.0;

    // 测量噪声标准差
    let measNoise = 0.15;

    // 时间步
    const dt = 0.05;
    let simTime = 0;

    // 轨迹历史
    const HIST = 400;
    let truePosHist = [];
    let estPosHist = [];
    let measHist = [];
    let trueVelHist = [];
    let estVelHist = [];

    // 力输入（周期性脉冲）
    let forceActive = false;
    let forceTimer = 0;

    p.setup = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      const canvas = p.createCanvas(W, H);
      canvas.parent(container);
      setTimeout(() => setupDOM(), 100);
    };

    function setupDOM() {
      let overlay = container.querySelector('.viz-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'viz-overlay';
        overlay.style.cssText = 'position:absolute;bottom:10px;left:10px;right:10px;padding:10px;';
        overlay.innerHTML = `
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;">
            <div id="s2-L1-slider"></div>
            <div id="s2-L2-slider"></div>
            <div id="s2-noise-slider"></div>
            <button class="ctrl-btn" id="s2-push">🔨 推一下</button>
            <button class="ctrl-btn" id="s2-reset">↺ 重置</button>
          </div>
        `;
        container.appendChild(overlay);
      }

      function mkSlider(id, label, min, max, val, step, fmt, cb) {
        const div = document.getElementById(id);
        if (!div) return;
        div.innerHTML = `
          <div class="slider-label-row"><span class="slider-label">${label}</span><span class="slider-value" id="${id}-val">${fmt(val)}</span></div>
          <input type="range" class="param-slider" id="${id}-input" min="${min}" max="${max}" step="${step}" value="${val}">
        `;
        document.getElementById(`${id}-input`).addEventListener('input', e => {
          const v = parseFloat(e.target.value);
          document.getElementById(`${id}-val`).textContent = fmt(v);
          cb(v);
        });
      }

      mkSlider('s2-L1-slider', 'L₁ (位置修正增益)', 0.1, 10, L1, 0.1, v => v.toFixed(1), v => { L1 = v; });
      mkSlider('s2-L2-slider', 'L₂ (速度修正增益)', 0.1, 20, L2, 0.1, v => v.toFixed(1), v => { L2 = v; });
      mkSlider('s2-noise-slider', '测量噪声 σ', 0.01, 0.5, measNoise, 0.01, v => v.toFixed(2), v => { measNoise = v; });

      document.getElementById('s2-push')?.addEventListener('click', () => {
        forceActive = true;
        forceTimer = 0.6; // 力持续 0.6 秒
      });
      document.getElementById('s2-reset')?.addEventListener('click', () => {
        xTrue = [1.5, 0.0];
        xEst = [0.0, 0.0];
        simTime = 0;
        truePosHist = []; estPosHist = []; measHist = [];
        trueVelHist = []; estVelHist = [];
        forceActive = false; forceTimer = 0;
      });
    }

    // === 仿真一步 ===
    function simulateStep() {
      // 外力输入
      let u = 0;
      if (forceActive && forceTimer > 0) {
        u = 3.0; // 3N 推力
        forceTimer -= dt;
        if (forceTimer <= 0) forceActive = false;
      }

      // 真实系统: ẋ = Ax + Bu
      const dxTrue0 = A[0][0] * xTrue[0] + A[0][1] * xTrue[1] + B[0][0] * u;
      const dxTrue1 = A[1][0] * xTrue[0] + A[1][1] * xTrue[1] + B[1][0] * u;
      xTrue[0] += dxTrue0 * dt;
      xTrue[1] += dxTrue1 * dt;

      // 测量: z = Cx + noise
      const z = C[0] * xTrue[0] + C[1] * xTrue[1] + gaussianRandom(0, measNoise);

      // 观测器: ẋ̂ = Aẋ̂ + Bu + L(z − Cẋ̂)
      const yEst = C[0] * xEst[0] + C[1] * xEst[1]; // C*ẋ̂
      const innov = z - yEst;

      const dxEst0 = A[0][0] * xEst[0] + A[0][1] * xEst[1] + B[0][0] * u + L1 * innov;
      const dxEst1 = A[1][0] * xEst[0] + A[1][1] * xEst[1] + B[1][0] * u + L2 * innov;
      xEst[0] += dxEst0 * dt;
      xEst[1] += dxEst1 * dt;

      // 记录历史
      truePosHist.push(xTrue[0]);
      estPosHist.push(xEst[0]);
      measHist.push(z);
      trueVelHist.push(xTrue[1]);
      estVelHist.push(xEst[1]);
      while (truePosHist.length > HIST) {
        truePosHist.shift(); estPosHist.shift(); measHist.shift();
        trueVelHist.shift(); estVelHist.shift();
      }
    }

    // === 绘制 ===
    p.draw = function () {
      // 运行几步仿真
      for (let s = 0; s < 3; s++) {
        simulateStep();
        simTime += dt;
      }

      p.background(10, 10, 26);

      // 布局：上半部分画弹簧动画，下半部分画时序图
      const animTop = 0;
      const animH = H * 0.45;
      const plotTop = animH;
      const plotH = H - plotTop;

      // --- 1. 弹簧动画 ---
      drawSpringAnimation(animTop, animH);

      // --- 2. 位置时序 ---
      drawTimePlot(plotTop, plotH / 2, '位置 (Position)',
        truePosHist, estPosHist, measHist, COLORS.groundTruth, COLORS.posterior, COLORS.measurement);

      // --- 3. 速度时序 ---
      drawTimePlot(plotTop + plotH / 2, plotH / 2, '速度 (Velocity)',
        trueVelHist, estVelHist, null, COLORS.groundTruth, COLORS.posterior, null);

      // --- 4. 误差信息 ---
      const posErr = xEst[0] - xTrue[0];
      const velErr = xEst[1] - xTrue[1];

      const cardX = W - 185;
      const cardY = animTop + 10;
      p.fill(30, 30, 50, 190);
      p.stroke(255, 255, 255, 35);
      p.strokeWeight(1);
      p.rect(cardX, cardY, 170, 90, 8);

      p.textAlign(p.LEFT, p.TOP);
      p.fill(127, 219, 255, 240);
      p.textSize(11);
      p.text('估计误差', cardX + 8, cardY + 8);
      p.fill(220, 220, 240, 200);
      p.textSize(10);
      p.text(`e_pos = ${posErr.toFixed(3)}`, cardX + 8, cardY + 28);
      p.text(`e_vel = ${velErr.toFixed(3)}`, cardX + 8, cardY + 46);

      // A-LC 特征值
      const a11 = A[0][0] - L1 * C[0];
      const a12 = A[0][1];
      const a21 = A[1][0] - L2 * C[0];
      const a22 = A[1][1];
      const trace = a11 + a22;
      const det = a11 * a22 - a12 * a21;
      const disc = Math.max(0, trace * trace - 4 * det);
      const re1 = -trace / 2;
      const im1 = Math.sqrt(Math.max(0, -disc)) / 2;

      p.fill(150, 150, 180, 160);
      p.textSize(9.5);
      p.text(`(A−LC) 极点实部: ${re1.toFixed(2)}`, cardX + 8, cardY + 68);
      if (disc < 0) {
        p.text(`(振荡频率: ${im1.toFixed(2)} rad/s)`, cardX + 8, cardY + 82);
      } else {
        p.text('(过阻尼 → 无振荡)', cardX + 8, cardY + 82);
      }
    };

    function drawSpringAnimation(top, h) {
      const cx = W * 0.42;
      const wallX = cx - 100;
      const baseY = top + h * 0.6;

      // 墙壁
      p.fill(140, 140, 160, 180);
      p.noStroke();
      p.rect(wallX - 15, baseY - 50, 15, 100);

      // 地面参考线
      p.stroke(100, 100, 120, 60);
      p.strokeWeight(1);
      p.line(wallX, baseY + 15, cx + 120, baseY + 15);

      // 弹簧（根据位置缩放）
      const posScale = 28; // 每单位位移的像素
      const massCenterX = cx + xTrue[0] * posScale;

      p.stroke(200, 200, 220, 160);
      p.strokeWeight(2.5);
      p.noFill();
      const coils = 10;
      const restLen = massCenterX - wallX;
      p.beginShape();
      for (let i = 0; i <= coils; i++) {
        const t = i / coils;
        const sx = wallX + restLen * t;
        const sy = baseY + Math.sin(t * coils * Math.PI) * 8;
        p.vertex(sx, sy);
      }
      p.endShape();

      // 真实质量块（绿色）
      p.fill(COLORS.groundTruth[0], COLORS.groundTruth[1], COLORS.groundTruth[2], 220);
      p.stroke(255, 255, 255, 80);
      p.strokeWeight(1.5);
      p.rect(massCenterX - 15, baseY - 18, 30, 36, 4);
      p.fill(255);
      p.textSize(9);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('x', massCenterX, baseY);

      // 估计质量块（蓝色虚线）
      const estCenterX = cx + xEst[0] * posScale;
      p.noFill();
      p.stroke(COLORS.posterior[0], COLORS.posterior[1], COLORS.posterior[2], 200);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([5, 4]);
      p.rect(estCenterX - 15, baseY - 25, 30, 36, 4);
      p.drawingContext.setLineDash([]);
      p.fill(COLORS.posterior[0], COLORS.posterior[1], COLORS.posterior[2], 230);
      p.textSize(9);
      p.text('x̂', estCenterX, baseY - 30);

      // 测量标记
      if (measHist.length > 0) {
        const lastMeas = measHist[measHist.length - 1];
        const measX = cx + lastMeas * posScale;
        p.fill(COLORS.measurement[0], COLORS.measurement[1], COLORS.measurement[2], 200);
        p.noStroke();
        p.circle(measX, baseY - 45, 6);
        p.fill(COLORS.measurement[0], COLORS.measurement[1], COLORS.measurement[2], 180);
        p.textSize(8);
        p.text('z', measX, baseY - 52);
      }

      // 力箭头
      if (forceActive) {
        const arrowX = massCenterX + 25;
        p.stroke(255, 200, 100, 220);
        p.strokeWeight(3);
        p.fill(255, 200, 100, 220);
        p.line(arrowX, baseY, arrowX + 35, baseY);
        p.triangle(arrowX + 35, baseY, arrowX + 25, baseY - 6, arrowX + 25, baseY + 6);
        p.fill(255, 200, 100, 220);
        p.textSize(10);
        p.text('u=3N', arrowX + 5, baseY - 12);
      }

      // 图例
      p.textAlign(p.LEFT, p.TOP);
      p.fill(COLORS.groundTruth);
      p.textSize(10);
      p.text('● 真实 x', 15, top + 8);
      p.fill(COLORS.posterior);
      p.text('--- ◌ 估计 x̂', 15, top + 22);
      p.fill(COLORS.measurement);
      p.text('● 测量 z', 15, top + 36);
    }

    function drawTimePlot(plotTop, plotH, title, trueHist, estHist, measHistArr, colorTrue, colorEst, colorMeas) {
      const marginL = 55, marginR = 20, marginT = 22, marginB = 18;
      const px = marginL, py = plotTop + marginT;
      const pw = W - marginL - marginR;
      const ph = plotH - marginT - marginB;

      // 背景
      p.fill(20, 20, 40, 120);
      p.noStroke();
      p.rect(px, py, pw, ph, 4);

      // 标题
      p.fill(180, 180, 200, 180);
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.text(title, px, plotTop + 4);

      // 零线
      const zeroY = py + ph / 2;
      p.stroke(100, 100, 130, 50);
      p.strokeWeight(1);
      p.line(px, zeroY, px + pw, zeroY);

      if (trueHist.length < 2) return;

      // 找范围
      let vMin = Infinity, vMax = -Infinity;
      for (let i = 0; i < trueHist.length; i++) {
        vMin = Math.min(vMin, trueHist[i], estHist[i]);
        vMax = Math.max(vMax, trueHist[i], estHist[i]);
        if (measHistArr) { vMin = Math.min(vMin, measHistArr[i]); vMax = Math.max(vMax, measHistArr[i]); }
      }
      const marginV = Math.max(0.3, (vMax - vMin) * 0.15);
      vMin -= marginV; vMax += marginV;

      function toX(i) { return px + (i / Math.max(1, trueHist.length - 1)) * pw; }
      function toY(v) { return p.map(v, vMin, vMax, py + ph, py); }

      // 测量散点
      if (measHistArr) {
        p.noStroke();
        for (let i = Math.max(0, measHistArr.length - 200); i < measHistArr.length; i++) {
          const alpha = p.map(i, Math.max(0, measHistArr.length - 200), measHistArr.length - 1, 40, 150);
          p.fill(colorMeas[0], colorMeas[1], colorMeas[2], alpha);
          p.circle(toX(i), toY(measHistArr[i]), 2.5);
        }
      }

      // 真实曲线
      p.noFill();
      p.stroke(colorTrue[0], colorTrue[1], colorTrue[2], 200);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < trueHist.length; i++) p.vertex(toX(i), toY(trueHist[i]));
      p.endShape();

      // 估计曲线（虚线）
      p.stroke(colorEst[0], colorEst[1], colorEst[2], 210);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([6, 4]);
      p.beginShape();
      for (let i = 0; i < estHist.length; i++) p.vertex(toX(i), toY(estHist[i]));
      p.endShape();
      p.drawingContext.setLineDash([]);

      // 当前值标注
      if (trueHist.length > 0) {
        const lastTrue = trueHist[trueHist.length - 1];
        const lastEst = estHist[estHist.length - 1];
        const lastX = toX(trueHist.length - 1);
        p.fill(colorTrue);
        p.noStroke();
        p.textSize(9);
        p.textAlign(p.LEFT, p.CENTER);
        p.text(lastTrue.toFixed(2), lastX + 3, toY(lastTrue));
        p.fill(colorEst);
        p.text(lastEst.toFixed(2), lastX + 3, toY(lastEst));
      }
    }

    p.windowResized = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
