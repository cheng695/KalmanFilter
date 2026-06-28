/**
 * 模块 0 — 概率论基础：均值/方差/标准差 + 协方差 & 协方差矩阵
 * 全屏切换：1D 统计 ↔ 3D 协方差
 */
import { COLORS } from '../utils/colors.js';

export function createSection0Sketch(container) {
  return function (p) {
    let W, canvasH;

    // 视图模式: '1d' | '3d'
    let viewMode = '1d';

    // === 1D ===
    let points1D = [];
    const POINT_R = 9;
    const default1D = [1.5, 3.0, 4.5, 5.5, 7.0, 8.5].map(x => ({ x }));
    let drag1D = -1, hov1D = -1;

    // === 3D ===
    const DS_DEFS = [
      { name: '正协方差', signs: [1, 1, 1], color: [80, 220, 100] },
      { name: '负协方差', signs: [-1, -1, 1], color: [255, 100, 80] },
      { name: '零协方差', signs: [0, 0, 0], color: [180, 180, 220] },
    ];
    let activeDS = 0;
    let pts3D = [];
    let reg3D = null;
    let drag3D = -1, hov3D = -1;
    let subPlots = [];

    function gen3D(signs, n = 30) {
      const pts = [];
      const cx = p.random(3, 7), cy = p.random(3, 7), cz = p.random(3, 7);
      for (let i = 0; i < n; i++) {
        const u = p.random(-1.8, 1.8);
        const v = signs[0] !== 0 ? signs[0] * u * 0.85 + p.random(-0.6, 0.6) : p.random(-1.8, 1.8);
        const w = signs[1] !== 0 ? signs[1] * u * 0.7 + p.random(-0.8, 0.8) : p.random(-1.8, 1.8);
        pts.push({ x: cx + u, y: cy + v, z: cz + w });
      }
      return pts;
    }

    function calc3D(pts) {
      const n = pts.length;
      if (n < 2) return null;
      let sx = 0, sy = 0, sz = 0;
      for (const pt of pts) { sx += pt.x; sy += pt.y; sz += pt.z; }
      const mx = sx / n, my = sy / n, mz = sz / n;
      let sxx = 0, syy = 0, szz = 0, sxy = 0, sxz = 0, syz = 0;
      for (const pt of pts) {
        const dx = pt.x - mx, dy = pt.y - my, dz = pt.z - mz;
        sxx += dx * dx; syy += dy * dy; szz += dz * dz;
        sxy += dx * dy; sxz += dx * dz; syz += dy * dz;
      }
      const vx = sxx / n, vy = syy / n, vz = szz / n;
      const cxy = sxy / n, cxz = sxz / n, cyz = syz / n;
      const rxy = (vx * vy > 0) ? cxy / Math.sqrt(vx * vy) : 0;
      const rxz = (vx * vz > 0) ? cxz / Math.sqrt(vx * vz) : 0;
      const ryz = (vy * vz > 0) ? cyz / Math.sqrt(vy * vz) : 0;
      return { mx, my, mz, vx, vy, vz, cxy, cxz, cyz, rxy, rxz, ryz, n };
    }

    // === 坐标 ===
    const LO = 1, HI = 9;
    function screen1D(v) { return p.map(v, LO, HI, 60, W - 60); }
    function logic1D(s) { return p.map(s, 60, W - 60, LO, HI); }

    function sX(v, sp) { return p.map(v, LO, HI, sp.left + 3, sp.right - 3); }
    function sY(v, sp) { return p.map(v, LO, HI, sp.bottom - 3, sp.top + 3); }
    function lX(sx, sp) { return p.map(sx, sp.left + 3, sp.right - 3, LO, HI); }
    function lY(sy, sp) { return p.map(sy, sp.bottom - 3, sp.top + 3, LO, HI); }

    p.setup = function () {
      W = container.offsetWidth;
      canvasH = container.offsetHeight;
      p.createCanvas(W, canvasH).parent(container);
      points1D = default1D.map(pt => ({ x: screen1D(pt.x) }));
      pts3D = gen3D(DS_DEFS[0].signs);
      reg3D = calc3D(pts3D);
      buildDOM();
    };

    function buildDOM() {
      const old = container.querySelector('.viz-overlay');
      if (old) old.remove();
      const overlay = document.createElement('div');
      overlay.className = 'viz-overlay';
      overlay.style.cssText = 'position:absolute;bottom:2px;left:6px;right:6px;padding:4px;';
      const bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;';

      function btn(text, id, cls) {
        const b = document.createElement('button');
        b.className = 'ctrl-btn' + (cls ? ' ' + cls : '');
        b.id = id; b.textContent = text; return b;
      }

      // 视图切换
      const b1d = btn('📏 1D 统计', 's0-mode1d', 'active');
      b1d.addEventListener('click', () => { viewMode = '1d'; syncModeBtns(); });
      bar.appendChild(b1d);

      const b3d = btn('📐 3D 协方差', 's0-mode3d');
      b3d.addEventListener('click', () => { viewMode = '3d'; syncModeBtns(); });
      bar.appendChild(b3d);

      const sep = document.createElement('span');
      sep.style.cssText = 'color:var(--text-muted);margin:0 4px;'; sep.textContent = '|';
      bar.appendChild(sep);

      // 协方差数据集按钮（仅 3D 模式有效）
      for (let i = 0; i < 3; i++) {
        const b = btn(DS_DEFS[i].name, 's0-ds' + i, i === activeDS ? 'active' : '');
        const idx = i;
        b.addEventListener('click', () => {
          activeDS = idx;
          pts3D = gen3D(DS_DEFS[idx].signs);
          reg3D = calc3D(pts3D);
          for (let j = 0; j < 3; j++) {
            const bj = document.getElementById('s0-ds' + j);
            if (bj) bj.classList.toggle('active', j === idx);
          }
        });
        b.dataset.group = 'ds';
        bar.appendChild(b);
      }

      const bNew = btn('🔄 换数据', 's0-newds');
      bNew.dataset.group = 'ds';
      bNew.addEventListener('click', () => {
        pts3D = gen3D(DS_DEFS[activeDS].signs);
        reg3D = calc3D(pts3D);
      });
      bar.appendChild(bNew);

      const hint = document.createElement('span');
      hint.style.cssText = 'color:var(--text-muted);font-size:0.72rem;margin-left:4px;';
      hint.id = 's0-hint';
      hint.textContent = '💡 点击数轴添加点 · 拖动移动 · 双击删除';
      bar.appendChild(hint);

      overlay.appendChild(bar);
      container.appendChild(overlay);
    }

    function syncModeBtns() {
      const b1d = document.getElementById('s0-mode1d');
      const b3d = document.getElementById('s0-mode3d');
      if (b1d) b1d.classList.toggle('active', viewMode === '1d');
      if (b3d) b3d.classList.toggle('active', viewMode === '3d');
      // 显示/隐藏数据集按钮
      const dsBtns = document.querySelectorAll('[data-group="ds"]');
      dsBtns.forEach(b => { b.style.display = viewMode === '3d' ? '' : 'none'; });
      const hint = document.getElementById('s0-hint');
      if (hint) hint.textContent = viewMode === '1d'
        ? '💡 点击数轴添加点 · 拖动移动 · 双击删除'
        : '💡 点击子图添加数据点 · 拖动移动 · 双击删除';
    }

    // === 1D 统计 ===
    function stats1D() {
      const n = points1D.length;
      if (n === 0) return { mean: 5, std: 1, var_: 1, n: 0 };
      const lp = points1D.map(pt => logic1D(pt.x));
      const sum = lp.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const ss = lp.reduce((s, x) => s + (x - mean) ** 2, 0);
      const v = ss / n;
      return { mean, std: Math.sqrt(v), var_: v, n };
    }

    // === 事件 ===
    p.mousePressed = function () {
      if (viewMode === '1d') {
        const ay = canvasH * 0.48;
        for (let i = points1D.length - 1; i >= 0; i--) {
          if (p.dist(p.mouseX, p.mouseY, points1D[i].x, ay) < POINT_R + 5) { drag1D = i; return; }
        }
        if (Math.abs(p.mouseY - ay) < 50 && p.mouseX > 60 && p.mouseX < W - 60) {
          points1D.push({ x: p.constrain(p.mouseX, 60, W - 60) });
          drag1D = points1D.length - 1;
        }
        return;
      }
      // 3D
      for (const sp of subPlots) {
        if (p.mouseX > sp.left && p.mouseX < sp.right && p.mouseY > sp.top && p.mouseY < sp.bottom) {
          for (let i = pts3D.length - 1; i >= 0; i--) {
            const pt = pts3D[i];
            const sx = sX(sp.vx === 'x' ? pt.x : sp.vx === 'y' ? pt.y : pt.z, sp);
            const sy = sY(sp.vy === 'x' ? pt.x : sp.vy === 'y' ? pt.y : pt.z, sp);
            if (p.dist(p.mouseX, p.mouseY, sx, sy) < 7) { drag3D = i; return; }
          }
          // 添加点（用 XY 逻辑坐标）
          const nx = lX(p.mouseX, sp);
          const ny = lY(p.mouseY, sp);
          const np = { x: p.random(3, 7), y: p.random(3, 7), z: p.random(3, 7) };
          if (sp.vx === 'x') np.x = nx; else if (sp.vx === 'y') np.y = nx; else np.z = nx;
          if (sp.vy === 'x') np.x = ny; else if (sp.vy === 'y') np.y = ny; else np.z = ny;
          pts3D.push(np);
          drag3D = pts3D.length - 1;
          reg3D = calc3D(pts3D);
          return;
        }
      }
    };
    p.mouseDragged = function () {
      if (drag1D >= 0) points1D[drag1D].x = p.constrain(p.mouseX, 60, W - 60);
      if (drag3D >= 0 && reg3D && subPlots.length > 0) {
        // 在 XY 子图坐标系中拖动
        const sp = subPlots[0];
        pts3D[drag3D].x = p.constrain(lX(p.mouseX, sp), 1, 9);
        pts3D[drag3D].y = p.constrain(lY(p.mouseY, sp), 1, 9);
        reg3D = calc3D(pts3D);
      }
    };
    p.mouseReleased = function () { drag1D = -1; drag3D = -1; };
    p.doubleClicked = function () {
      if (hov1D >= 0) { points1D.splice(hov1D, 1); hov1D = -1; return false; }
      if (hov3D >= 0) { pts3D.splice(hov3D, 1); hov3D = -1; reg3D = calc3D(pts3D); return false; }
      return false;
    };

    p.draw = function () {
      p.background(10, 10, 26);
      if (viewMode === '1d') draw1DView();
      else draw3DView();
    };

    // ============ 1D 全屏 ============
    function draw1DView() {
      const s = stats1D();
      const ay = canvasH * 0.50;
      const mx = s.n > 0 ? screen1D(s.mean) : W / 2;
      const sw = s.n > 0 ? screen1D(s.mean + s.std) - mx : 30;

      // 标题
      p.fill(200, 200, 230, 160); p.textSize(15); p.textAlign(p.CENTER, p.TOP);
      p.text('1D — 均值 · 方差 · 标准差', W / 2, 14);
      p.fill(150, 150, 180, 110); p.textSize(11);
      p.text('μ = 中心位置    σ = 离散程度    σ² = 平均偏差平方', W / 2, 34);

      // σ 带
      if (s.n > 0) {
        p.noStroke();
        p.fill(100, 149, 237, 18); p.rect(mx - 2 * sw, ay - 55, 4 * sw, 110);
        p.fill(100, 149, 237, 32); p.rect(mx - sw, ay - 55, 2 * sw, 110);
        p.fill(100, 149, 237, 22); p.rect(mx - 3 * sw, ay - 55, 6 * sw, 110);
      }
      // 数轴
      p.stroke(160, 160, 190, 120); p.strokeWeight(2.5); p.line(60, ay, W - 60, ay);
      p.textSize(12); p.textAlign(p.CENTER, p.TOP);
      for (let i = 0; i <= 10; i++) {
        const x = screen1D(i);
        p.stroke(120, 120, 150, 70); p.strokeWeight(1.2);
        p.line(x, ay - 7, x, ay + 7);
        p.noStroke(); p.fill(160, 160, 190, 140);
        p.text(String(i), x, ay + 10);
      }
      // 均值线
      if (s.n > 0) {
        p.stroke(127, 219, 255, 220); p.strokeWeight(3);
        p.line(mx, ay - 52, mx, ay + 52);
        p.noStroke(); p.fill(127, 219, 255, 230);
        p.textSize(16); p.textStyle(p.BOLD); p.textAlign(p.CENTER, p.BOTTOM);
        p.text(`μ = ${s.mean.toFixed(2)}`, mx, ay - 58);
        p.textStyle(p.NORMAL);
        // ±σ 标签
        const sl = mx - sw, sr = mx + sw;
        p.stroke(255, 200, 100, 140); p.strokeWeight(1.5);
        p.drawingContext.setLineDash([4, 5]);
        p.line(sl, ay - 16, sl, ay + 16);
        p.line(sr, ay - 16, sr, ay + 16);
        p.drawingContext.setLineDash([]);
        p.fill(255, 200, 100, 180); p.textSize(13);
        p.text(`σ = ${s.std.toFixed(2)}`, mx, ay + 60);
        p.textSize(11); p.fill(200, 200, 240, 130);
        p.text(`方差 σ² = ${s.var_.toFixed(2)}`, mx, ay + 78);
      }
      // 数据点
      hov1D = -1;
      for (let i = points1D.length - 1; i >= 0; i--) {
        if (p.dist(p.mouseX, p.mouseY, points1D[i].x, ay) < POINT_R + 4) { hov1D = i; break; }
      }
      for (let i = 0; i < points1D.length; i++) {
        const h = i === hov1D, d = i === drag1D;
        const col = d ? [255, 220, 100] : h ? [255, 255, 255] : [46, 204, 113];
        p.fill(col[0], col[1], col[2], 210);
        p.stroke(255, 255, 255, h ? 180 : 55); p.strokeWeight(h ? 2.2 : 1.2);
        p.circle(points1D[i].x, ay, POINT_R * 2);
        const lv = logic1D(points1D[i].x);
        if (points1D.length <= 20 || h) {
          p.noStroke(); p.fill(255, 255, 255, h ? 230 : 160);
          p.textSize(h ? 13 : 9); p.textAlign(p.CENTER, p.BOTTOM);
          p.text(lv.toFixed(1), points1D[i].x, ay - POINT_R - 4);
        }
        if (h && s.n > 1) {
          p.stroke(255, 200, 100, 160); p.strokeWeight(1.5);
          p.drawingContext.setLineDash([3, 4]);
          p.line(points1D[i].x, ay, mx, ay);
          p.drawingContext.setLineDash([]);
          const mid = (points1D[i].x + mx) / 2;
          p.noStroke(); p.fill(255, 200, 100, 200);
          p.textSize(11); p.text(`偏差 ${(lv - s.mean).toFixed(2)}`, mid, ay - 26);
        }
      }
      // 统计卡
      if (s.n > 0) {
        const cx = W - 180, cy = 8;
        p.fill(30, 30, 50, 185); p.stroke(255, 255, 255, 30); p.strokeWeight(1);
        p.rect(cx, cy, 168, 68, 6);
        p.textAlign(p.LEFT, p.TOP);
        p.fill(127, 219, 255, 220); p.textSize(12); p.text('统计量', cx + 8, cy + 5);
        p.fill(200, 200, 230, 180); p.textSize(10.5);
        p.text(`n=${s.n}    μ=${s.mean.toFixed(3)}`, cx + 8, cy + 22);
        p.text(`σ²=${s.var_.toFixed(3)}    σ=${s.std.toFixed(3)}`, cx + 8, cy + 38);
        p.text(`Σ(xᵢ−μ)²=${(s.var_ * s.n).toFixed(2)}`, cx + 8, cy + 53);
      }
    }

    // ============ 3D 全屏 ============
    function draw3DView() {
      // 标题
      p.fill(200, 200, 230, 160); p.textSize(15); p.textAlign(p.CENTER, p.TOP);
      p.text('3D 协方差 — 三组变量两两关系', W / 2, 8);
      p.fill(150, 150, 180, 100); p.textSize(10);
      p.text('每个子图 = 散点 + 回归线（黄虚线）+ 均值十字（白虚线）', W / 2, 24);

      const gap = 50;
      const marginLR = 100;
      const top0 = 60;
      const bottom0 = canvasH - 110;
      const availW = W - 2 * marginLR - gap;
      const availH = bottom0 - top0 - gap;
      const cellW = availW / 2;
      const cellH = availH / 2;

      // 三个散点图 + 矩阵占位
      subPlots = [
        { left: marginLR, right: marginLR + cellW, top: top0, bottom: top0 + cellH,
          label: 'X vs Y', vx: 'x', vy: 'y', xLabel: 'X', yLabel: 'Y' },
        { left: marginLR + cellW + gap, right: marginLR + 2 * cellW + gap, top: top0, bottom: top0 + cellH,
          label: 'X vs Z', vx: 'x', vy: 'z', xLabel: 'X', yLabel: 'Z' },
        { left: marginLR, right: marginLR + cellW, top: top0 + cellH + gap, bottom: top0 + 2 * cellH + gap,
          label: 'Y vs Z', vx: 'y', vy: 'z', xLabel: 'Y', yLabel: 'Z' },
      ];
      // 矩阵区域（右下格）
      const matRect = {
        left: marginLR + cellW + gap,
        right: marginLR + 2 * cellW + gap,
        top: top0 + cellH + gap,
        bottom: top0 + 2 * cellH + gap,
      };

      for (const sp of subPlots) {
        // 背景
        p.fill(18, 18, 38, 130); p.noStroke();
        p.rect(sp.left, sp.top, sp.right - sp.left, sp.bottom - sp.top, 5);
        p.stroke(255, 255, 255, 18); p.strokeWeight(1); p.noFill();
        p.rect(sp.left, sp.top, sp.right - sp.left, sp.bottom - sp.top, 5);

        // 子图标题
        p.fill(200, 200, 230, 160); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
        p.text(sp.label, sp.left + 5, sp.top + 4);

        // 网格 + 坐标轴刻度
        p.textSize(10); p.textAlign(p.CENTER, p.TOP);
        for (let v = 2; v <= 8; v += 2) {
          const sx = sX(v, sp);
          p.stroke(80, 80, 110, 35); p.strokeWeight(0.6);
          p.line(sx, sp.top, sx, sp.bottom);
          p.line(sp.left, sY(v, sp), sp.right, sY(v, sp));
          // X 轴刻度
          p.noStroke(); p.fill(190, 190, 220, 170);
          p.text(String(v), sx, sp.bottom + 3);
          // Y 轴刻度
          p.textAlign(p.RIGHT, p.CENTER);
          p.text(String(v), sp.left - 5, sY(v, sp));
          p.textAlign(p.CENTER, p.TOP);
        }

        // 外围边框加亮
        p.stroke(255, 255, 255, 35); p.strokeWeight(1.5); p.noFill();
        p.rect(sp.left, sp.top, sp.right - sp.left, sp.bottom - sp.top, 5);

        // 坐标轴标签
        p.fill(220, 220, 250, 210);
        p.textSize(11); p.textStyle(p.BOLD);
        // X 轴标签（靠紧子图底部）
        p.textAlign(p.CENTER, p.TOP);
        p.text(sp.xLabel, (sp.left + sp.right) / 2, sp.bottom + 14);
        // Y 轴标签（靠紧子图左侧）
        p.push();
        p.translate(sp.left - 16, (sp.top + sp.bottom) / 2);
        p.rotate(-p.HALF_PI);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(sp.yLabel, 0, 0);
        p.pop();
        p.textStyle(p.NORMAL);

        if (!reg3D || reg3D.n < 2) continue;

        // 回归线
        const cov = sp.vx === 'x' && sp.vy === 'y' ? reg3D.cxy :
                    sp.vx === 'x' && sp.vy === 'z' ? reg3D.cxz :
                    sp.vx === 'y' && sp.vy === 'z' ? reg3D.cyz : 0;
        const vxVal = sp.vx === 'x' ? reg3D.vx : sp.vx === 'y' ? reg3D.vy : reg3D.vz;
        const mxVal = sp.vx === 'x' ? reg3D.mx : sp.vx === 'y' ? reg3D.my : reg3D.mz;
        const myVal = sp.vy === 'x' ? reg3D.mx : sp.vy === 'y' ? reg3D.my : reg3D.mz;
        if (vxVal > 0.001) {
          const slope = cov / vxVal;
          const inter = myVal - slope * mxVal;
          p.stroke(255, 220, 100, 180); p.strokeWeight(2);
          p.drawingContext.setLineDash([6, 5]);
          p.line(sX(1, sp), sY(p.constrain(slope * 1 + inter, 1, 9), sp),
                 sX(9, sp), sY(p.constrain(slope * 9 + inter, 1, 9), sp));
          p.drawingContext.setLineDash([]);
        }

        // 均值十字
        const scx = sX(mxVal, sp), scy = sY(myVal, sp);
        p.stroke(255, 255, 255, 80); p.strokeWeight(0.8);
        p.drawingContext.setLineDash([3, 6]);
        p.line(scx, sp.top, scx, sp.bottom);
        p.line(sp.left, scy, sp.right, scy);
        p.drawingContext.setLineDash([]);

        // 数据点
        for (let i = 0; i < pts3D.length; i++) {
          const pt = pts3D[i];
          const vx = sp.vx === 'x' ? pt.x : sp.vx === 'y' ? pt.y : pt.z;
          const vy = sp.vy === 'x' ? pt.x : sp.vy === 'y' ? pt.y : pt.z;
          const sx = sX(vx, sp), sy = sY(vy, sp);
          const inSp = p.mouseX > sp.left && p.mouseX < sp.right && p.mouseY > sp.top && p.mouseY < sp.bottom;
          const h = inSp && i === hov3D;
          if (inSp) hov3D = i;
          const col = DS_DEFS[activeDS].color;
          p.fill(col[0], col[1], col[2], h || i === drag3D ? 240 : 150);
          p.stroke(255, 255, 255, h ? 160 : 30); p.strokeWeight(h ? 1.8 : 0.7);
          p.circle(sx, sy, h || i === drag3D ? 7 : 4.5);
        }

        // 右下角协方差值
        p.fill(220, 220, 240, 160); p.textSize(9); p.textAlign(p.RIGHT, p.BOTTOM);
        p.text(`Cov=${cov.toFixed(2)}`, sp.right - 4, sp.bottom - 4);
      }

      // ===== 右下格：3×3 协方差矩阵 =====
      if (reg3D) {
        const r = reg3D;
        const box = matRect;
        // 背景
        p.fill(18, 18, 38, 140); p.noStroke();
        p.rect(box.left, box.top, box.right - box.left, box.bottom - box.top, 5);
        p.stroke(255, 255, 255, 18); p.strokeWeight(1); p.noFill();
        p.rect(box.left, box.top, box.right - box.left, box.bottom - box.top, 5);

        // 标题
        p.fill(200, 200, 230, 160); p.textSize(11); p.textAlign(p.LEFT, p.TOP);
        p.text('协方差矩阵 P (3×3)', box.left + 5, box.top + 4);

        // 矩阵单元格：填充格子
        const padX = 10, padY = 26;
        const availW2 = (box.right - box.left) - 2 * padX;
        const availH2 = (box.bottom - box.top) - padY - 22;  // 底部留给图例
        const cw = (availW2 - 2 * 3) / 3;  // gapM=3
        const ch = Math.min((availH2 - 2 * 3) / 3, cw * 0.7);
        const gapM = 3;
        const mx0 = box.left + padX;
        const my0 = box.top + padY;

        const vals = [[r.vx, r.cxy, r.cxz], [r.cxy, r.vy, r.cyz], [r.cxz, r.cyz, r.vz]];
        const labs = [['σ²x', 'Cov(X,Y)', 'Cov(X,Z)'],
                      ['Cov(Y,X)', 'σ²y', 'Cov(Y,Z)'],
                      ['Cov(Z,X)', 'Cov(Z,Y)', 'σ²z']];
        const maxV = Math.max(r.vx, r.vy, r.vz, Math.abs(r.cxy), Math.abs(r.cxz), Math.abs(r.cyz));

        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            const x = mx0 + col * (cw + gapM);
            const y = my0 + row * (ch + gapM);
            const diag = row === col;
            const v = vals[row][col];
            const intensity = maxV > 0.001 ? Math.abs(v) / maxV : 0;
            const alpha = diag ? 60 : 18 + intensity * 55;

            p.fill(diag ? 0 : (v > 0 ? 80 : 240),
                   diag ? 116 : (v > 0 ? 210 : 90),
                   diag ? 217 : (v > 0 ? 90 : 80), alpha);
            p.noStroke(); p.rect(x, y, cw, ch, 3);

            p.stroke(diag ? 127 : 255, diag ? 219 : 255, diag ? 255 : 255, diag ? 80 : 18);
            p.strokeWeight(diag ? 1.2 : 0.4); p.noFill();
            p.rect(x, y, cw, ch, 3);

            // 字体进一步放大
            const fs = Math.max(9.5, Math.min(12, cw * 0.15));
            p.fill(240, 240, 255, 210); p.noStroke();
            p.textSize(fs - 0.5); p.textAlign(p.CENTER, p.CENTER);
            p.text(labs[row][col], x + cw / 2, y + ch / 2 - 5);
            p.fill(255, 255, 255, 240);
            p.textSize(fs + 1); p.textStyle(p.BOLD);
            p.text(v.toFixed(2), x + cw / 2, y + ch / 2 + 9);
            p.textStyle(p.NORMAL);
          }
        }

        // 图例
        const ly = my0 + 3 * (ch + gapM) + 4;
        p.textAlign(p.LEFT, p.TOP); p.textSize(15);
        p.fill(127, 219, 255, 190);
        p.text('蓝=方差', box.left + padX, ly);
        p.fill(80, 220, 100, 180);
        p.text('绿=正相关', box.left + padX + 66, ly);
        p.fill(255, 100, 80, 180);
        p.text('红=负相关', box.left + padX + 144, ly);
      }
    }

    p.windowResized = function () {
      W = container.offsetWidth;
      canvasH = container.offsetHeight;
      p.resizeCanvas(W, canvasH);
    };
  };
}
