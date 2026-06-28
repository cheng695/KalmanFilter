/**
 * 模块 4 — 四个协方差矩阵
 * 清晰对比：测量前 P⁻（大椭圆） vs 测量后 P（小椭圆）
 * 同一点，两个椭圆嵌套，收缩 = 信息增益
 */
import { eigen2x2 } from '../utils/matrix.js';

let sc = 1; // 全局缩放，在 draw 中设置
function drawEllipse(p, P, cx, cy, color, alpha, lw) {
  const { eigenvalues, eigenvectors } = eigen2x2(P);
  const a = Math.sqrt(Math.max(0, eigenvalues[0])) * sc;
  const b = Math.sqrt(Math.max(0, eigenvalues[1])) * sc;
  const angle = Math.atan2(eigenvectors[0][1], eigenvectors[0][0]);
  p.push(); p.translate(cx, cy); p.rotate(angle);
  p.fill(color[0], color[1], color[2], 30);
  p.stroke(color[0], color[1], color[2], alpha); p.strokeWeight(lw);
  p.ellipse(0, 0, 2 * a, 2 * b);
  p.pop();
}

export function createSection4Sketch(container) {
  return function (p) {
    let W, H;
    let Qmag = 0.5, Rmag = 2.0;
    let priorCov, postCov, K;

    function recompute() {
      priorCov = [[4 + Qmag * 10, 0.3], [0.3, 3 + Qmag * 6]];
      const p11 = priorCov[0][0];
      K = p11 / (p11 + Rmag);
      const ok = 1 - K;
      postCov = [[ok * priorCov[0][0], ok * priorCov[0][1]], [ok * priorCov[1][0], ok * priorCov[1][1]]];
    }

    p.setup = function () {
      W = container.offsetWidth; H = container.offsetHeight;
      p.createCanvas(W, H).parent(container);
      recompute();
      setTimeout(() => setupDOM(), 100);
    };

    function setupDOM() { // same as before
      const old = container.querySelector('.viz-overlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.className = 'viz-overlay';
      overlay.style.cssText = 'position:absolute;bottom:6px;left:6px;right:6px;padding:4px;';
      overlay.innerHTML = `<div style="display:flex;gap:10px;flex-wrap:wrap;">
        <div id="s4-q-slider"></div><div id="s4-r-slider"></div></div>`;
      container.appendChild(overlay);
      const qDiv = document.getElementById('s4-q-slider');
      const rDiv = document.getElementById('s4-r-slider');
      if (qDiv) qDiv.innerHTML = `<div class="slider-label-row"><span class="slider-label">过程噪声 Q</span><span class="slider-value" id="s4-q-val">${Qmag.toFixed(2)}</span></div><input type="range" class="param-slider" min="0.05" max="3" step="0.05" value="${Qmag}">`;
      if (rDiv) rDiv.innerHTML = `<div class="slider-label-row"><span class="slider-label">测量噪声 R</span><span class="slider-value" id="s4-r-val">${Rmag.toFixed(1)}</span></div><input type="range" class="param-slider" min="0.2" max="6" step="0.1" value="${Rmag}">`;
      qDiv?.querySelector('input')?.addEventListener('input', e => { Qmag = parseFloat(e.target.value); document.getElementById('s4-q-val').textContent = Qmag.toFixed(2); recompute(); });
      rDiv?.querySelector('input')?.addEventListener('input', e => { Rmag = parseFloat(e.target.value); document.getElementById('s4-r-val').textContent = Rmag.toFixed(1); recompute(); });
    }

    p.draw = function () {
      p.background(10, 10, 26);
      sc = Math.min(W, H) / 22;
      const cx = W * 0.32, cy = H * 0.50;

      // === 左侧：预测步（先验） ===
      p.fill(220, 220, 240, 160); p.textSize(15); p.textAlign(p.CENTER, p.TOP);
      p.text('① Predict 预测步', cx, 12);
      p.fill(180, 180, 200, 110); p.textSize(11);
      p.text('P⁻ = F·P·Fᵀ + Q', cx, 32);

      drawEllipse(p, priorCov, cx, cy, [255, 160, 60], 210, 3);
      p.fill(255, 200, 120, 230); p.textSize(22); p.textAlign(p.CENTER, p.CENTER);
      p.text('P⁻', cx, cy - 2);
      p.fill(220, 220, 240, 150); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
      p.text(`椭圆 = 预测的不确定度`, cx, cy + 55);
      p.fill(255, 180, 100, 150);
      p.text(`Q = ${Qmag.toFixed(2)}`, cx, cy + 72);

      // === 中间：测量 ===
      const mx = W * 0.55, my = cy;
      p.fill(220, 220, 240, 160); p.textSize(15); p.textAlign(p.CENTER, p.TOP);
      p.text('② Measure 测量', mx, 12);
      p.fill(180, 180, 200, 110); p.textSize(11);
      p.text(`z ~ N(x, R)`, mx, 32);

      // 测量噪声圆 — 统一使用 sc 缩放
      const rPx = Math.sqrt(Rmag) * sc;
      p.fill(255, 65, 54, 20); p.stroke(255, 90, 80, 170); p.strokeWeight(2.5);
      p.drawingContext.setLineDash([5, 4]);
      p.ellipse(mx, my, 2 * rPx, 2 * rPx);
      p.drawingContext.setLineDash([]);

      p.fill(255, 90, 80, 230); p.noStroke(); p.circle(mx, my, 8);
      p.fill(220, 220, 240, 150); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
      p.text(`圆 = 传感器噪声`, mx, my + 55);
      p.fill(255, 120, 100, 150);
      p.text(`R = ${Rmag.toFixed(1)}`, mx, my + 72);

      // === 右侧：更新步（后验） ===
      const rx = W * 0.78, ry = cy;
      p.fill(220, 220, 240, 160); p.textSize(15); p.textAlign(p.CENTER, p.TOP);
      p.text('③ Update 更新步', rx, 12);
      p.fill(180, 180, 200, 110); p.textSize(11);
      p.text('P = (I−KH)·P⁻', rx, 32);

      drawEllipse(p, postCov, rx, ry, [80, 240, 200], 250, 3.5);
      p.fill(80, 240, 220, 230); p.textSize(22); p.textAlign(p.CENTER, p.CENTER);
      p.text('P', rx, ry - 2);
      p.fill(220, 220, 240, 150); p.textSize(11); p.textAlign(p.CENTER, p.TOP);
      const pt = priorCov[0][0] + priorCov[1][1], ppt = postCov[0][0] + postCov[1][1];
      p.text(`椭圆 = 修正后的不确定度`, rx, ry + 55);
      p.fill(80, 220, 200, 160);
      p.text(`收缩 ${((1-ppt/pt)*100).toFixed(0)}%`, rx, ry + 72);

      // === 箭头 ===
      p.stroke(255, 255, 255, 45); p.strokeWeight(1.5);
      p.drawingContext.setLineDash([4, 6]);
      p.line(cx + 40, cy, mx - 40, my);
      p.line(mx + 40, my, rx - 40, ry);
      p.drawingContext.setLineDash([]);

      p.fill(255, 220, 100, 210); p.textSize(16); p.textAlign(p.CENTER, p.BOTTOM);
      p.text(`K = ${K.toFixed(3)}`, (mx + rx) / 2, cy - 55);

      // 底部
      p.fill(220, 220, 240, 120); p.textSize(12); p.textAlign(p.CENTER, p.TOP);
      p.text(`tr(P⁻)=${pt.toFixed(1)}  →  tr(P)=${ppt.toFixed(1)}    |    Q↑→P⁻变大    R↑→K变小→收缩少`, W / 2, H - 200);

      // 图例
      p.textAlign(p.LEFT, p.TOP); p.textSize(14); p.fill(220, 220, 240);
      p.noStroke();
      p.fill(255, 160, 60); p.rect(12, 12, 26, 5); p.text('P⁻ 先验协方差', 44, 9);
      p.fill(255, 90, 80); p.rect(12, 34, 26, 5); p.text('R 测量噪声', 44, 31);
      p.fill(80, 240, 200); p.rect(12, 56, 26, 5); p.text('P 后验协方差', 44, 53);
    };

    p.windowResized = function () {
      W = container.offsetWidth; H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
