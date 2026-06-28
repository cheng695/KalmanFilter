/**
 * 模块 2 — 先验 & 后验：离散时间预测-更新
 * 核心：x̂_{k|k-1} = F x̂_{k-1|k-1} （先验）
 *       x̂_{k|k} = x̂_{k|k-1} + K(z_k - H x̂_{k|k-1})（后验）
 * 互补滤波：x̂_{k|k} = (1-K₁)x̂_{k|k-1} + K₁ z_k
 */
import { COLORS } from '../utils/colors.js';
import { gaussianRandom } from '../kalman/noise.js';

export function createSection2Sketch(container) {
  return function (p) {
    let W, canvasH;

    // 系统参数
    const dt = 1.0;
    const F = [[1, dt], [0, 1]];  // 匀速模型
    const Hmat = [1, 0];           // 只测位置

    // 真实状态 [pos, vel]
    let xTrue = [0, 0];
    // 后验估计
    let xPost = [0, 0];
    // 先验预测（上一步算出的）
    let xPrior = [0, 0];
    // 当前测量
    let zMeas = 0;

    // 增益
    let K1 = 0.4;
    let K2 = 0.15;

    // 测量噪声
    let measNoise = 1.5;

    // 仿真
    let simStep = 0;
    let isRunning = true;

    // 历史
    const HIST = 200;
    let truePosH = [], measH = [], priorPosH = [], postPosH = [];
    let trueVelH = [], postVelH = [];

    // 真实运动：变加速度产生往复振荡轨迹
    function getTrueInput(k) {
      return 0.35 * Math.sin(k * 0.15) * Math.cos(k * 0.08);
    }

    p.setup = function () {
      W = container.offsetWidth;
      canvasH = container.offsetHeight;
      const canvas = p.createCanvas(W, canvasH);
      canvas.parent(container);
      resetSim();
      setTimeout(() => setupDOM(), 50);
    };

    function resetSim() {
      simStep = 0;
      xTrue = [0, 0];
      xPost = [3.0, 1.5];
      xPrior = [0, 0];
      zMeas = 0;
      truePosH = []; measH = []; priorPosH = []; postPosH = [];
      trueVelH = []; postVelH = [];
      isRunning = false;
      const btn = document.getElementById('s2-play');
      if (btn) { btn.textContent = '▶ 播放'; btn.classList.remove('active'); }
      updateInfo();
    }

    function setupDOM() {
      let overlay = container.querySelector('.viz-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'viz-overlay';
        overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;';
        overlay.innerHTML = `<div class="control-panel" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <button class="ctrl-btn active" id="s2-play">⏸ 暂停</button>
          <button class="ctrl-btn" id="s2-step">⏭ 单步</button>
          <button class="ctrl-btn" id="s2-reset">↺ 重置</button>
          <div id="s2-K1-slider"></div><div id="s2-K2-slider"></div><div id="s2-noise-slider"></div>
        </div>`;
        container.appendChild(overlay);

        const infoDiv = document.createElement('div');
        infoDiv.className = 'info-panel'; infoDiv.id = 's2-info';
        infoDiv.style.cssText = 'position:absolute;bottom:50px;right:4px;max-width:175px;font-size:0.68rem;opacity:0.88;pointer-events:none;';
        infoDiv.innerHTML = `<h4>当前时刻 k=${simStep}</h4>
          <div class="info-row"><span class="info-label">真值</span><span class="info-value" id="s2-true">--</span></div>
          <div class="info-row"><span class="info-label">先验 x̂<sub>k|k-1</sub></span><span class="info-value orange" id="s2-prior">--</span></div>
          <div class="info-row"><span class="info-label">测量 z</span><span class="info-value" style="color:#ff4136;" id="s2-meas">--</span></div>
          <div class="info-row"><span class="info-label">后验 x̂<sub>k|k</sub></span><span class="info-value blue" id="s2-post">--</span></div>
          <h4 style="margin-top:6px;">互补滤波权重</h4>
          <div class="info-row"><span class="info-label">模型权重 (1−K₁)</span><span class="info-value orange" id="s2-w1">--</span></div>
          <div class="info-row"><span class="info-label">测量权重 K₁</span><span class="info-value" style="color:#ff4136;" id="s2-w2">--</span></div>
          <h4 style="margin-top:6px;">速度估计</h4>
          <div class="info-row"><span class="info-label">真值 v</span><span class="info-value" id="s2-truev">--</span></div>
          <div class="info-row"><span class="info-label">后验 v̂</span><span class="info-value blue" id="s2-postv">--</span></div>`;
        container.appendChild(infoDiv);

        const leg = document.createElement('div');
        leg.className = 'legend';
        leg.style.cssText = 'position:absolute;top:8px;left:8px;';
        leg.innerHTML = `<div class="legend-item"><div class="legend-dot" style="background:#2ecc40;"></div>真实 x</div>
          <div class="legend-item"><div class="legend-dash" style="border-color:#ff851b;"></div>先验 x̂<sub>k|k-1</sub></div>
          <div class="legend-item"><div class="legend-dot" style="background:#ff4136;"></div>测量 z</div>
          <div class="legend-item"><div class="legend-dot" style="background:#0074d9;"></div>后验 x̂<sub>k|k</sub></div>`;
        container.appendChild(leg);
      }

      document.getElementById('s2-play')?.addEventListener('click', function () {
        isRunning = !isRunning;
        this.textContent = isRunning ? '⏸ 暂停' : '▶ 播放';
        this.classList.toggle('active', isRunning);
      });
      document.getElementById('s2-step')?.addEventListener('click', () => { doStep(); });
      document.getElementById('s2-reset')?.addEventListener('click', resetSim);

      mkSlider('s2-K1-slider', 'K₁ (位置修正)', 0, 1, K1, 0.01, v => v.toFixed(2), v => { K1 = v; });
      mkSlider('s2-K2-slider', 'K₂ (速度修正)', 0, 0.5, K2, 0.005, v => v.toFixed(3), v => { K2 = v; });
      mkSlider('s2-noise-slider', '测量噪声 σ', 0.1, 4, measNoise, 0.05, v => v.toFixed(2), v => { measNoise = v; });
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

    function doStep() {
      simStep++;
      const k = simStep;

      // 真实系统演化（确定加速度 + 随机扰动 = 过程噪声）
      const u = getTrueInput(k) + gaussianRandom(0, 0.25);  // 随机加速度扰动
      xTrue[0] = xTrue[0] + dt * xTrue[1] + 0.5 * dt * dt * u;
      xTrue[1] = xTrue[1] + dt * u;

      // ① 先验预测：x̂_{k|k-1} = F x̂_{k-1|k-1}（匀速模型，不知道加速度）
      xPrior[0] = F[0][0] * xPost[0] + F[0][1] * xPost[1];
      xPrior[1] = F[1][0] * xPost[0] + F[1][1] * xPost[1];

      // ② 测量：z_k = H x_k + noise
      zMeas = Hmat[0] * xTrue[0] + Hmat[1] * xTrue[1] + gaussianRandom(0, measNoise);

      // ③ 后验更新：x̂_{k|k} = x̂_{k|k-1} + K(z_k - H x̂_{k|k-1})
      const innov = zMeas - (Hmat[0] * xPrior[0] + Hmat[1] * xPrior[1]);
      xPost[0] = xPrior[0] + K1 * innov;
      xPost[1] = xPrior[1] + K2 * innov;

      // 记录历史
      truePosH.push(xTrue[0]); measH.push(zMeas);
      priorPosH.push(xPrior[0]); postPosH.push(xPost[0]);
      trueVelH.push(xTrue[1]); postVelH.push(xPost[1]);
      while (truePosH.length > HIST) {
        truePosH.shift(); measH.shift(); priorPosH.shift(); postPosH.shift();
        trueVelH.shift(); postVelH.shift();
      }

      updateInfo();
    }

    function updateInfo() {
      const el = (id) => document.getElementById(id);
      if (el('s2-true')) el('s2-true').textContent = `pos=${xTrue[0].toFixed(2)}, vel=${xTrue[1].toFixed(2)}`;
      if (el('s2-prior')) el('s2-prior').textContent = `pos=${xPrior[0].toFixed(2)}, vel=${xPrior[1].toFixed(2)}`;
      if (el('s2-meas')) el('s2-meas').textContent = `z=${zMeas.toFixed(2)}`;
      if (el('s2-post')) el('s2-post').textContent = `pos=${xPost[0].toFixed(2)}, vel=${xPost[1].toFixed(2)}`;
      if (el('s2-w1')) el('s2-w1').textContent = (1 - K1).toFixed(2);
      if (el('s2-w2')) el('s2-w2').textContent = K1.toFixed(2);
      if (el('s2-truev')) el('s2-truev').textContent = xTrue[1].toFixed(2);
      if (el('s2-postv')) el('s2-postv').textContent = xPost[1].toFixed(2);
      const titleEl = document.querySelector('#s2-info h4');
      if (titleEl) titleEl.textContent = `当前时刻 k=${simStep}`;
    }

    p.draw = function () {
      if (isRunning) {
        for (let s = 0; s < 2; s++) doStep();
      }

      p.background(10, 10, 26);

      const plot1Top = canvasH * 0.06;
      const plot1H = canvasH * 0.44;
      const plot2Top = plot1Top + plot1H + 4;
      const plot2H = canvasH - plot2Top - 50;

      // --- 上半：位置时序 ---
      drawTimePlot(plot1Top, plot1H, '位置 (Position) — 互补滤波：x̂ = (1−K₁)·先验 + K₁·z',
        truePosH, measH, priorPosH, postPosH);

      // --- 下半：速度时序 ---
      drawVelocityPlot(plot2Top, plot2H, '速度 (Velocity) — 不可直接测量，从位置残差推断',
        trueVelH, postVelH);

      // --- 校正箭头示意（右下） ---
      if (postPosH.length > 0 && priorPosH.length > 0) {
        drawComplementaryDiagram();
      }
    };

    function drawTimePlot(top, h, title, trueH, measH, priorH, postH) {
      const ml = 48, mr = 16, mt = 20, mb = 14;
      const px = ml, py = top + mt;
      const pw = W - ml - mr;
      const ph = h - mt - mb;
      if (pw <= 0 || ph <= 0) return;

      // 背景
      p.fill(20, 20, 40, 100);
      p.noStroke();
      p.rect(px, py, pw, ph, 3);

      // 标题
      p.fill(180, 180, 200, 160);
      p.textSize(10.5);
      p.textAlign(p.LEFT, p.TOP);
      p.text(title, px, top + 3);

      if (trueH.length < 2) return;

      // 范围
      let vMin = Infinity, vMax = -Infinity;
      const all = [...trueH, ...measH, ...priorH, ...postH];
      for (const v of all) { vMin = Math.min(vMin, v); vMax = Math.max(vMax, v); }
      const pad = Math.max(0.3, (vMax - vMin) * 0.1);
      vMin -= pad; vMax += pad;

      const toX = (i) => px + (i / Math.max(1, trueH.length - 1)) * pw;
      const toY = (v) => p.map(v, vMin, vMax, py + ph, py);

      // 零线
      const zy = p.constrain(toY(0), py, py + ph);
      p.stroke(100, 100, 130, 40);
      p.strokeWeight(1);
      p.line(px, zy, px + pw, zy);

      // 测量散点
      p.noStroke();
      for (let i = Math.max(0, measH.length - 150); i < measH.length; i++) {
        const a = p.map(i, Math.max(0, measH.length - 150), measH.length - 1, 30, 140);
        p.fill(255, 65, 54, a);
        p.circle(toX(i), toY(measH[i]), 2.5);
      }

      // 先验曲线（橙色虚线）
      p.noFill();
      p.stroke(255, 133, 27, 170);
      p.strokeWeight(2);
      p.drawingContext.setLineDash([6, 4]);
      p.beginShape();
      for (let i = 0; i < priorH.length; i++) p.vertex(toX(i), toY(priorH[i]));
      p.endShape();
      p.drawingContext.setLineDash([]);

      // 真实曲线
      p.stroke(46, 204, 64, 200);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < trueH.length; i++) p.vertex(toX(i), toY(trueH[i]));
      p.endShape();

      // 后验曲线
      p.stroke(0, 116, 217, 230);
      p.strokeWeight(2.5);
      p.beginShape();
      for (let i = 0; i < postH.length; i++) p.vertex(toX(i), toY(postH[i]));
      p.endShape();

      // 当前值标记
      if (trueH.length > 0) {
        const lx = toX(trueH.length - 1);
        const labels = [
          { y: toY(trueH[trueH.length - 1]), color: COLORS.groundTruth, txt: 'x' },
          { y: toY(priorH[priorH.length - 1]), color: COLORS.prior, txt: '⁻' },
          { y: toY(postH[postH.length - 1]), color: COLORS.posterior, txt: '⁺' },
        ];
        for (const lb of labels) {
          p.fill(lb.color[0], lb.color[1], lb.color[2], 220);
          p.noStroke();
          p.textSize(9);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(`x̂${lb.txt}`, lx + 2, lb.y);
        }
      }
    }

    function drawVelocityPlot(top, h, title, trueH, postH) {
      const ml = 48, mr = 16, mt = 20, mb = 14;
      const px = ml, py = top + mt;
      const pw = W - ml - mr;
      const ph = h - mt - mb;
      if (pw <= 0 || ph <= 0) return;

      p.fill(20, 20, 40, 100);
      p.noStroke();
      p.rect(px, py, pw, ph, 3);

      p.fill(180, 180, 200, 160);
      p.textSize(10.5);
      p.textAlign(p.LEFT, p.TOP);
      p.text(title, px, top + 3);

      if (trueH.length < 2) return;

      let vMin = Infinity, vMax = -Infinity;
      for (const v of [...trueH, ...postH]) { vMin = Math.min(vMin, v); vMax = Math.max(vMax, v); }
      const pad = Math.max(0.2, (vMax - vMin) * 0.15);
      vMin -= pad; vMax += pad;

      const toX = (i) => px + (i / Math.max(1, trueH.length - 1)) * pw;
      const toY = (v) => p.map(v, vMin, vMax, py + ph, py);

      const zy = p.constrain(toY(0), py, py + ph);
      p.stroke(100, 100, 130, 40);
      p.strokeWeight(1);
      p.line(px, zy, px + pw, zy);

      // 真实速度
      p.noFill();
      p.stroke(46, 204, 64, 200);
      p.strokeWeight(2);
      p.beginShape();
      for (let i = 0; i < trueH.length; i++) p.vertex(toX(i), toY(trueH[i]));
      p.endShape();

      // 后验速度
      p.stroke(0, 116, 217, 230);
      p.strokeWeight(2.5);
      p.beginShape();
      for (let i = 0; i < postH.length; i++) p.vertex(toX(i), toY(postH[i]));
      p.endShape();

      // 标签：注明速度不可直接测量
      p.fill(255, 65, 54, 130);
      p.textSize(9);
      p.textAlign(p.RIGHT, p.TOP);
      p.text('⚠ 无直接速度测量', px + pw - 4, py + 2);
    }

    function drawComplementaryDiagram() {
      // 右下角小示意图：互补滤波公式
      const bx = 6, by = canvasH - 48;
      p.fill(30, 30, 50, 180);
      p.stroke(255, 255, 255, 30);
      p.strokeWeight(1);
      p.rect(bx, by, 218, 42, 6);

      p.textAlign(p.LEFT, p.CENTER);
      p.fill(0, 116, 217, 220);
      p.textSize(10);
      p.text(`x̂⁺ = `, bx + 6, by + 12);
      p.fill(255, 133, 27, 200);
      p.text(`${(1 - K1).toFixed(2)} · x̂⁻`, bx + 30, by + 12);
      p.fill(200, 200, 240, 180);
      p.text(` + `, bx + 88, by + 12);
      p.fill(255, 65, 54, 200);
      p.text(`${K1.toFixed(2)} · z`, bx + 102, by + 12);

      p.fill(150, 150, 180, 130);
      p.textSize(9);
      p.text(`速度：v̂⁺ = ${(1 - dt * K2).toFixed(3)}·v̂⁻ + ${(dt * K2).toFixed(3)}·(z−x̂⁻)/Δt`, bx + 6, by + 30);
    }

    p.windowResized = function () {
      W = container.offsetWidth;
      canvasH = container.offsetHeight;
      p.resizeCanvas(W, canvasH);
    };
  };
}
