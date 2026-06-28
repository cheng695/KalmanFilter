/**
 * 模块 5 — 完整预测—更新循环：2D 目标追踪
 * 旗舰级交互演示
 * - 鼠标移动 = 真实目标位置
 * - 加入噪声 = 模拟测量
 * - 卡尔曼滤波器追踪
 * - 显示轨迹、协方差椭圆、修正箭头、数值面板
 */
import { KalmanFilter } from '../kalman/kalman-filter.js';
import { constantVelocityModel } from '../kalman/models.js';
import { gaussianRandom } from '../kalman/noise.js';
import { drawCovarianceEllipse } from '../utils/ellipse.js';
import { COLORS, rgba } from '../utils/colors.js';
import { T } from '../ui/i18n.js';

export function createSection5Sketch(container) {
  return function (p) {
    let W, H;
    let kf;
    let model;

    // 状态
    let truePos = { x: 0, y: 0 };
    let truePrev = { x: 0, y: 0 };
    let isRunning = true;
    let isPaused = false;
    let stepOnce = false;
    let useMouse = true;
    let mouseIdleTime = 0;
    let autoTime = 0;
    let speed = 1.0;

    // 参数
    let Qmag = 0.1;
    let Rmag = 50;
    let dt = 1;

    // 轨迹历史
    const HIST_MAX = 300;
    let trueHist = [];
    let measHist = [];
    let priorHist = [];
    let postHist = [];
    let obsHist = [];   // 观测器轨迹

    // 观测器（固定增益，2×1D：[pos_x, vel_x] 和 [pos_y, vel_y]）
    let obsX = [0, 0], obsY = [0, 0];
    let obsK1 = 0.3, obsK2 = 0.08;

    function initObs() {
      obsX = [W / 2, 0];
      obsY = [H / 2, 0];
    }

    // DOM 元素
    let modeIndicator;

    function initKF() {
      const R = [[Rmag, 0], [0, Rmag]];
      const Q = Qmag;
      model = constantVelocityModel(Q, Rmag);
      kf = new KalmanFilter({
        initialState: [W / 2, H / 2, 0, 0],
        initialCovariance: [[500, 0, 0, 0], [0, 500, 0, 0], [0, 0, 100, 0], [0, 0, 0, 100]],
        model,
      });
    }

    p.setup = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      const canvas = p.createCanvas(W, H);
      canvas.parent(container);

      truePos = { x: W / 2, y: H / 2 };
      truePrev = { x: W / 2, y: H / 2 };
      initKF(); initObs();

      setTimeout(() => setupDOM(), 100);
    };

    function setupDOM() {
      // 控制面板
      let overlay = container.querySelector('.viz-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'viz-overlay';
        overlay.style.cssText = 'position:absolute;bottom:0;left:0;right:0;';
        overlay.innerHTML = `
          <div class="control-panel" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <button class="ctrl-btn" id="s5-play">▶ 播放</button>
            <button class="ctrl-btn" id="s5-step">⏭ 单步</button>
            <button class="ctrl-btn" id="s5-reset">↺ 重置</button>
            <div id="s5-speed-slider"></div>
            <div id="s5-q-slider"></div>
            <div id="s5-r-slider"></div>
            <div id="s5-obsK1-slider"></div>
            <div id="s5-obsK2-slider"></div>
          </div>
        `;
        container.appendChild(overlay);

        // 模式指示器
        modeIndicator = document.createElement('div');
        modeIndicator.className = 'mode-indicator mouse-mode';
        modeIndicator.textContent = T.section5.controls.mouseMode;
        container.appendChild(modeIndicator);

        // 信息面板
        const infoPanel = document.createElement('div');
        infoPanel.className = 'info-panel';
        infoPanel.id = 's5-info';
        infoPanel.innerHTML = `
          <h4>${T.section5.info.gainMatrix}</h4>
          <div id="s5-k-values">--</div>
          <h4 style="margin-top:8px;">${T.section5.info.covMatrix}</h4>
          <div id="s5-p-values">--</div>
          <h4 style="margin-top:8px;">${T.section5.info.innovation}</h4>
          <div id="s5-inn-values">--</div>
        `;
        container.appendChild(infoPanel);

        // 图例
        const legend = document.createElement('div');
        legend.className = 'legend';
        legend.innerHTML = `
          <div class="legend-item"><div class="legend-dot" style="background:#2ecc40;"></div>${T.section5.legend.trueTrail}</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ff4136;"></div>${T.section5.legend.measurements}</div>
          <div class="legend-item"><div class="legend-dot" style="background:#0074d9;"></div>${T.section5.legend.posteriorEstimate}</div>
          <div class="legend-item"><div class="legend-dash" style="border-color:#b478ff;"></div>${T.section5.legend.priorPrediction}</div>
          <div class="legend-item"><div class="legend-dash" style="border-color:#ffdc28;"></div>观测器(固定K)</div>
        `;
        container.appendChild(legend);
      }

      // 绑定事件
      document.getElementById('s5-play')?.addEventListener('click', function () {
        isPaused = !isPaused;
        this.textContent = isPaused ? '▶ 播放' : '⏸ 暂停';
        this.classList.toggle('active', !isPaused);
      });

      document.getElementById('s5-step')?.addEventListener('click', () => {
        stepOnce = true;
      });

      document.getElementById('s5-reset')?.addEventListener('click', () => {
        initKF(); initObs();
        trueHist = []; measHist = []; priorHist = []; postHist = []; obsHist = [];
        autoTime = 0;
      });

      // 速度滑块
      const speedDiv = document.getElementById('s5-speed-slider');
      if (speedDiv) {
        speedDiv.innerHTML = `
          <div class="slider-label-row">
            <span class="slider-label">${T.section5.controls.speed}</span>
            <span class="slider-value" id="s5-speed-val">1.0x</span>
          </div>
          <input type="range" class="param-slider" id="s5-speed-input" min="0.1" max="5" step="0.1" value="1">
        `;
        document.getElementById('s5-speed-input').addEventListener('input', (e) => {
          speed = parseFloat(e.target.value);
          document.getElementById('s5-speed-val').textContent = speed.toFixed(1) + 'x';
        });
      }

      // Q 滑块
      const qDiv = document.getElementById('s5-q-slider');
      if (qDiv) {
        qDiv.innerHTML = `
          <div class="slider-label-row">
            <span class="slider-label">过程噪声 Q</span>
            <span class="slider-value" id="s5-q-val">${Qmag.toFixed(2)}</span>
          </div>
          <input type="range" class="param-slider" id="s5-q-input" min="0.001" max="2" step="0.001" value="${Qmag}">
        `;
        document.getElementById('s5-q-input').addEventListener('input', (e) => {
          Qmag = parseFloat(e.target.value);
          document.getElementById('s5-q-val').textContent = Qmag.toFixed(3);
          model.getQ = function (dt) {
            const q = Qmag;
            const dt2 = dt * dt, dt3 = dt2 * dt;
            return [
              [dt3/3*q, 0, dt2/2*q, 0],
              [0, dt3/3*q, 0, dt2/2*q],
              [dt2/2*q, 0, dt*q, 0],
              [0, dt2/2*q, 0, dt*q],
            ];
          };
        });
      }

      // R 滑块
      const rDiv = document.getElementById('s5-r-slider');
      if (rDiv) {
        rDiv.innerHTML = `
          <div class="slider-label-row">
            <span class="slider-label">测量噪声 R</span>
            <span class="slider-value" id="s5-r-val">${Rmag.toFixed(0)}</span>
          </div>
          <input type="range" class="param-slider" id="s5-r-input" min="5" max="500" step="5" value="${Rmag}">
        `;
        document.getElementById('s5-r-input').addEventListener('input', (e) => {
          Rmag = parseFloat(e.target.value);
          document.getElementById('s5-r-val').textContent = Rmag.toFixed(0);
          model.R = [[Rmag, 0], [0, Rmag]];
        });
      }

      // 观测器 K₁ 滑块
      const obsK1D = document.getElementById('s5-obsK1-slider');
      if (obsK1D) {
        obsK1D.innerHTML = `<div class="slider-label-row"><span class="slider-label">观测器 K₁</span><span class="slider-value" id="s5-obsK1-val">${obsK1.toFixed(2)}</span></div>
          <input type="range" class="param-slider" id="s5-obsK1-input" min="0" max="1" step="0.01" value="${obsK1}">`;
        document.getElementById('s5-obsK1-input').addEventListener('input', (e) => {
          obsK1 = parseFloat(e.target.value);
          document.getElementById('s5-obsK1-val').textContent = obsK1.toFixed(2);
        });
      }
      // 观测器 K₂ 滑块
      const obsK2D = document.getElementById('s5-obsK2-slider');
      if (obsK2D) {
        obsK2D.innerHTML = `<div class="slider-label-row"><span class="slider-label">观测器 K₂</span><span class="slider-value" id="s5-obsK2-val">${obsK2.toFixed(3)}</span></div>
          <input type="range" class="param-slider" id="s5-obsK2-input" min="0" max="0.5" step="0.005" value="${obsK2}">`;
        document.getElementById('s5-obsK2-input').addEventListener('input', (e) => {
          obsK2 = parseFloat(e.target.value);
          document.getElementById('s5-obsK2-val').textContent = obsK2.toFixed(3);
        });
      }

    }

    p.draw = function () {
      p.background(10, 10, 26);

      // 判断是否该执行滤波步骤
      const shouldStep = (isRunning && !isPaused) || stepOnce;
      stepOnce = false;

      // 判断鼠标模式
      const mouseMoved = (p.mouseX !== p.pmouseX || p.mouseY !== p.pmouseY);
      if (mouseMoved) {
        mouseIdleTime = 0;
        useMouse = true;
        if (modeIndicator) {
          modeIndicator.textContent = T.section5.controls.mouseMode;
          modeIndicator.classList.add('mouse-mode');
        }
      } else {
        mouseIdleTime += p.deltaTime;
        if (mouseIdleTime > 1500 && useMouse) {
          useMouse = false;
          if (modeIndicator) {
            modeIndicator.textContent = T.section5.controls.autoMode;
            modeIndicator.classList.remove('mouse-mode');
          }
        }
      }

      if (shouldStep) {
        // 更新真实位置
        truePrev = { ...truePos };

        if (useMouse && p.mouseX > 0 && p.mouseX < W && p.mouseY > 0 && p.mouseY < H - 150) {
          truePos = { x: p.mouseX, y: p.mouseY };
        } else {
          // Lissajous 曲线自动演示
          autoTime += 0.02 * speed;
          truePos = {
            x: W / 2 + W * 0.35 * Math.cos(2 * Math.PI * autoTime / 5 + 0.5),
            y: H / 2 + H * 0.35 * Math.sin(2 * Math.PI * autoTime / 3),
          };
        }

        // 生成含噪声测量
        const measStd = Math.sqrt(Rmag);
        const measurement = [
          truePos.x + gaussianRandom(0, measStd),
          truePos.y + gaussianRandom(0, measStd),
        ];

        // 卡尔曼滤波 step
        const result = kf.step(measurement, dt * speed);

        // 观测器 step（固定增益，与 KF 使用相同测量值）
        const dt2 = dt * speed;
        const F2 = [[1, dt2], [0, 1]];
        // X 方向
        const obsPriorX = F2[0][0] * obsX[0] + F2[0][1] * obsX[1];
        const obsPriorVx = F2[1][0] * obsX[0] + F2[1][1] * obsX[1];
        obsX[0] = obsPriorX + obsK1 * (measurement[0] - obsPriorX);
        obsX[1] = obsPriorVx + obsK2 * (measurement[0] - obsPriorX);
        // Y 方向
        const obsPriorY = F2[0][0] * obsY[0] + F2[0][1] * obsY[1];
        const obsPriorVy = F2[1][0] * obsY[0] + F2[1][1] * obsY[1];
        obsY[0] = obsPriorY + obsK1 * (measurement[1] - obsPriorY);
        obsY[1] = obsPriorVy + obsK2 * (measurement[1] - obsPriorY);

        // 记录历史
        trueHist.push({ ...truePos });
        measHist.push({ x: measurement[0], y: measurement[1] });

        const priorPos = kf.lastPrior;
        const postPos = kf.getPosition();
        priorHist.push({ x: priorPos[0], y: priorPos[1] });
        postHist.push({ x: postPos.x, y: postPos.y });
        obsHist.push({ x: obsX[0], y: obsY[0] });

        // 限制历史长度
        while (trueHist.length > HIST_MAX) {
          trueHist.shift(); measHist.shift(); priorHist.shift(); postHist.shift(); obsHist.shift();
        }

        // 更新信息面板
        updateInfoPanel(result.K, kf.P);
      }

      // --- 渲染 ---

      // 浅色网格
      p.stroke(60, 60, 90, 30);
      p.strokeWeight(0.5);
      for (let i = 0; i < W; i += 40) p.line(i, 0, i, H);
      for (let i = 0; i < H; i += 40) p.line(0, i, W, i);

      // 1. 真实轨迹（绿色）
      drawTrail(trueHist, COLORS.groundTruth, 0.8, 2);

      // 2. 测量值（红色散点）
      for (let i = Math.max(0, measHist.length - 50); i < measHist.length; i++) {
        const m = measHist[i];
        const alpha = p.map(i, Math.max(0, measHist.length - 50), measHist.length - 1, 40, 180);
        p.stroke(COLORS.measurement[0], COLORS.measurement[1], COLORS.measurement[2], alpha);
        p.strokeWeight(1);
        p.line(m.x - 3, m.y - 3, m.x + 3, m.y + 3);
        p.line(m.x + 3, m.y - 3, m.x - 3, m.y + 3);
      }

      // 3. 先验预测轨迹（橙色虚线）
      drawDashedTrail(priorHist, [180, 120, 255], 0.5, 1.8);  // 先验（紫色虚线）

      // 4. 后验估计轨迹（蓝色实线）
      drawTrail(postHist, COLORS.posterior, 0.95, 3.5);        // 卡尔曼（蓝色，粗）
      drawDashedTrail(obsHist, [255, 220, 40], 0.9, 2.8);    // 观测器（黄色虚线）

      // 5. 当前估计位置的协方差椭圆
      if (postHist.length > 0) {
        const lastPost = postHist[postHist.length - 1];
        const postCov2D = kf.getPositionCovariance();
        drawCovarianceEllipse(p, postCov2D, lastPost.x, lastPost.y, COLORS.posterior, 180, 5.991);

        // 先验协方差椭圆
        if (priorHist.length > 0) {
          const lastPrior = priorHist[priorHist.length - 1];
          const priorCov2D = kf.getPriorPositionCovariance();
          drawCovarianceEllipse(p, priorCov2D, lastPrior.x, lastPrior.y, COLORS.prior, 120, 5.991);

          // 修正箭头
          drawCorrectionArrow(lastPrior.x, lastPrior.y, lastPost.x, lastPost.y);
        }

        // 后验估计点（当前）
        p.fill(COLORS.posterior[0], COLORS.posterior[1], COLORS.posterior[2], 230);
        p.noStroke();
        p.circle(lastPost.x, lastPost.y, 12);
      }

      // 6. 当前真实位置
      p.fill(COLORS.groundTruth[0], COLORS.groundTruth[1], COLORS.groundTruth[2], 200);
      p.noStroke();
      p.circle(truePos.x, truePos.y, 8);

      // 更新模式指示器的位置（处理 resize）
      if (modeIndicator) {
        modeIndicator.style.top = '10px';
        modeIndicator.style.left = '50%';
        modeIndicator.style.transform = 'translateX(-50%)';
      }
    };

    function drawTrail(hist, color, alpha, weight) {
      if (hist.length < 2) return;
      p.noFill();
      p.stroke(color[0], color[1], color[2], Math.floor(alpha * 255));
      p.strokeWeight(weight);
      p.beginShape();
      for (const pt of hist) {
        p.vertex(pt.x, pt.y);
      }
      p.endShape();
    }

    function drawDashedTrail(hist, color, alpha, weight) {
      if (hist.length < 2) return;
      p.stroke(color[0], color[1], color[2], Math.floor(alpha * 255));
      p.strokeWeight(weight);
      p.drawingContext.setLineDash([8, 6]);
      p.beginShape();
      for (const pt of hist) {
        p.vertex(pt.x, pt.y);
      }
      p.endShape();
      p.drawingContext.setLineDash([]);
    }

    function drawCorrectionArrow(x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return;

      const headSize = Math.min(10, dist / 3);
      const angle = Math.atan2(dy, dx);

      p.push();
      p.stroke(255, 255, 255, 180);
      p.strokeWeight(2);
      p.fill(255, 255, 255, 200);
      p.line(x1, y1, x2, y2);
      p.translate(x2, y2);
      p.rotate(angle);
      p.triangle(0, 0, -headSize, -headSize / 2, -headSize, headSize / 2);
      p.pop();
    }

    function updateInfoPanel(K, P) {
      const infoEl = document.getElementById('s5-info');
      if (!infoEl) return;

      const kDiv = document.getElementById('s5-k-values');
      const pDiv = document.getElementById('s5-p-values');
      const innDiv = document.getElementById('s5-inn-values');

      if (kDiv && K) {
        kDiv.innerHTML = K
          ? `K = [${K[0][0].toFixed(3)}, ${K[0][1].toFixed(3)}]<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[${K[1][0].toFixed(3)}, ${K[1][1].toFixed(3)}]`
          : '--';
      }
      if (pDiv) {
        pDiv.innerHTML = P
          ? `P₁₁=${P[0][0].toFixed(1)}<br>P₂₂=${P[1][1].toFixed(1)}<br>tr(P)=${(P[0][0]+P[1][1]).toFixed(1)}`
          : '--';
      }
      if (innDiv) {
        const inn = kf.lastInnovation;
        innDiv.innerHTML = inn
          ? `y₁=${inn[0].toFixed(1)}<br>y₂=${inn[1].toFixed(1)}`
          : '--';
      }
    }

    p.windowResized = function () {
      W = container.offsetWidth;
      H = container.offsetHeight;
      p.resizeCanvas(W, H);
    };
  };
}
