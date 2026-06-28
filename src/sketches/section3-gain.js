/**
 * 模块 3 — 卡尔曼增益 K = P⁻/(P⁻+R)
 * 上部：高斯曲线融合 · 下部：K 值仪表
 */
import { COLORS } from '../utils/colors.js';

export function createSection3Sketch(container) {
  return function (p) {
    let W, H;
    let Pprior = 4.0, Rval = 2.0;
    let priorMean = 0, measMean = 3;

    p.setup = function () {
      W = container.offsetWidth; H = container.offsetHeight;
      p.createCanvas(W, H).parent(container);
      setTimeout(() => setupDOM(), 100);
    };

    function setupDOM() {
      const old = container.querySelector('.viz-overlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.className = 'viz-overlay';
      overlay.style.cssText = 'position:absolute;bottom:50px;left:6px;right:6px;padding:4px;';
      overlay.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <div id="s3-prior-slider"></div>
          <div id="s3-r-slider"></div>
          <div id="s3-meas-slider"></div>
        </div>`;
      container.appendChild(overlay);

      const pDiv = document.getElementById('s3-prior-slider');
      const rDiv = document.getElementById('s3-r-slider');
      const mDiv = document.getElementById('s3-meas-slider');

      if (pDiv) pDiv.innerHTML = `
        <div class="slider-label-row"><span class="slider-label">先验方差 P⁻</span><span class="slider-value" id="s3-p-val">${Pprior.toFixed(1)}</span></div>
        <input type="range" class="param-slider" min="0.2" max="10" step="0.1" value="${Pprior}">`;
      if (rDiv) rDiv.innerHTML = `
        <div class="slider-label-row"><span class="slider-label">测量噪声 R</span><span class="slider-value" id="s3-r-val">${Rval.toFixed(1)}</span></div>
        <input type="range" class="param-slider" min="0.2" max="10" step="0.1" value="${Rval}">`;
      if (mDiv) mDiv.innerHTML = `
        <div class="slider-label-row"><span class="slider-label">测量值 z</span><span class="slider-value" id="s3-m-val">${measMean.toFixed(1)}</span></div>
        <input type="range" class="param-slider" min="-3" max="6" step="0.1" value="${measMean}">`;

      pDiv?.querySelector('input')?.addEventListener('input', e => {
        Pprior = parseFloat(e.target.value);
        document.getElementById('s3-p-val').textContent = Pprior.toFixed(1);
      });
      rDiv?.querySelector('input')?.addEventListener('input', e => {
        Rval = parseFloat(e.target.value);
        document.getElementById('s3-r-val').textContent = Rval.toFixed(1);
      });
      mDiv?.querySelector('input')?.addEventListener('input', e => {
        measMean = parseFloat(e.target.value);
        document.getElementById('s3-m-val').textContent = measMean.toFixed(1);
      });
    }

    p.draw = function () {
      p.background(10, 10, 26);
      const K = Pprior / (Pprior + Rval);
      const postMean = priorMean + K * (measMean - priorMean);
      const postVar = (1 - K) * Pprior;

      // 高斯曲线——全宽
      const baseY = H * 0.55;
      const maxH = baseY - H * 0.06;
      const sc = W / 10;

      function gauss(mean, variance, color, alpha) {
        const std = Math.sqrt(Math.max(0.01, variance));
        const spx = std * sc, mx = W / 2 + mean * sc;
        const refS = Math.sqrt(Math.min(Pprior, Rval, postVar) || 1);
        const hs = refS / std;

        p.noStroke(); p.fill(color[0], color[1], color[2], Math.floor(alpha * 0.25));
        p.beginShape();
        const xs = mx - 4 * spx, xe = mx + 4 * spx;
        p.vertex(Math.max(10, xs), baseY);
        for (let x = Math.max(10, xs); x <= Math.min(W - 10, xe); x += 2) {
          p.vertex(x, baseY - maxH * hs * Math.exp(-0.5 * (x - mx) * (x - mx) / (spx * spx)));
        }
        p.vertex(Math.min(W - 10, xe), baseY);
        p.endShape(p.CLOSE);

        p.noFill(); p.stroke(color[0], color[1], color[2], alpha); p.strokeWeight(2.5);
        p.beginShape();
        for (let x = Math.max(10, xs); x <= Math.min(W - 10, xe); x += 1) {
          p.vertex(x, baseY - maxH * hs * Math.exp(-0.5 * (x - mx) * (x - mx) / (spx * spx)));
        }
        p.endShape();
        return mx;
      }

      p.stroke(150, 150, 180, 70); p.strokeWeight(1.5); p.line(10, baseY, W - 10, baseY);

      const px = gauss(priorMean, Pprior, [255, 160, 60], 190);
      const mx = gauss(measMean, Rval, [255, 100, 80], 190);
      gauss(postMean, postVar, [80, 220, 140], 230);

      // 左上图例
      p.textAlign(p.LEFT, p.TOP); p.textSize(14); p.fill(220, 220, 240);
      p.noStroke();
      p.fill(255, 160, 60); p.rect(12, 12, 28, 5);
      p.text(`先验 P⁻=${Pprior.toFixed(2)}`, 46, 9);
      p.fill(255, 100, 80); p.rect(12, 34, 28, 5);
      p.text(`测量 R=${Rval.toFixed(2)}`, 46, 31);
      p.fill(80, 220, 140); p.rect(12, 56, 28, 5);
      p.text(`后验 P=${postVar.toFixed(2)}`, 46, 53);

      // === K 面板（右下角） ===
      const kw = 270, kh = 220;
      const kx = W - kw - 24, ky2 = H - kh - 52;
      p.fill(30, 30, 45, 185); p.noStroke(); p.rect(kx, ky2, kw, kh, 8);

      p.fill(255, 255, 255); p.textSize(56); p.textAlign(p.CENTER, p.TOP);
      p.text(K.toFixed(3), kx + kw / 2, ky2 + 10);

      p.fill(220, 220, 230); p.textSize(17);
      p.text('卡尔曼增益 K', kx + kw / 2, ky2 + 72);

      const bx2 = kx + 22, by2 = ky2 + 98, bw2 = kw - 44, bh2 = 14;
      p.fill(60, 60, 90); p.rect(bx2, by2, bw2, bh2, 6);
      p.fill(240, 240, 250); p.rect(bx2, by2, bw2 * K, bh2, 6);
      p.fill(200, 200, 220); p.textSize(10); p.textAlign(p.CENTER, p.TOP);
      p.text('0', bx2, by2 + bh2 + 2); p.text('1', bx2 + bw2, by2 + bh2 + 2);

      p.fill(220, 220, 240); p.textSize(14); p.textAlign(p.CENTER, p.TOP);
      p.text(`K = P⁻/(P⁻+R)`, kx + kw / 2, by2 + 24);
      p.text(`= ${Pprior.toFixed(1)}/(${Pprior.toFixed(1)}+${Rval.toFixed(1)})`, kx + kw / 2, by2 + 44);

      const ratio = Pprior / Rval;
      p.textSize(13);
      p.text(`P⁻/R = ${ratio.toFixed(2)}  →  ${ratio > 1 ? '多信测量' : '多信模型'}`, kx + kw / 2, by2 + 68);
      const shrink = postVar < Pprior ? ((1 - postVar / Pprior) * 100).toFixed(0) : 0;
      p.text(`后验收缩 ${shrink}%`, kx + kw / 2, by2 + 88);

      p.fill(180, 180, 200); p.textSize(9); p.textAlign(p.CENTER, p.TOP);
      p.text('P⁻↑ 或 R↓ → K↑    |    P⁻↓ 或 R↑ → K↓', W / 2, H - 18);
    };

    p.windowResized = function () {
      W = container.offsetWidth; H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
