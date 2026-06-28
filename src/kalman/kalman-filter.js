/**
 * 卡尔曼滤波器 — 核心实现
 *
 * 纯数学函数，不依赖任何 DOM 或 p5.js。
 * 可直接在浏览器 console 中测试:
 *   const kf = new KalmanFilter(...);
 *   const result = kf.step(measurement, dt);
 *
 * 支持两种模型:
 *   - 2D 恒位置:  state = [px, py]
 *   - 4D 恒速度:  state = [px, py, vx, vy]
 */

/**
 * 通用矩阵操作（内联，避免跨模块依赖）
 */
function matMul(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const C = Array.from({ length: rowsA }, () => new Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      if (A[i][k] !== 0) {
        for (let j = 0; j < colsB; j++) {
          C[i][j] += A[i][k] * B[k][j];
        }
      }
    }
  }
  return C;
}

function matAdd(A, B) {
  const m = A.length, n = A[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      C[i][j] = A[i][j] + B[i][j];
  return C;
}

function matSub(A, B) {
  const m = A.length, n = A[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      C[i][j] = A[i][j] - B[i][j];
  return C;
}

function matTranspose(A) {
  const m = A.length, n = A[0].length;
  const B = Array.from({ length: n }, () => new Array(m).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      B[j][i] = A[i][j];
  return B;
}

function matScale(s, A) {
  const m = A.length, n = A[0].length;
  const B = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      B[i][j] = s * A[i][j];
  return B;
}

function matIdentity(n) {
  const I = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) I[i][i] = 1;
  return I;
}

function matInverse2x2(A) {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [
    [ A[1][1] * inv, -A[0][1] * inv],
    [-A[1][0] * inv,  A[0][0] * inv],
  ];
}

function matVecMul(A, v) {
  const m = A.length, n = A[0].length;
  const r = new Array(m).fill(0);
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      r[i] += A[i][j] * v[j];
  return r;
}

export class KalmanFilter {
  /**
   * @param {Object} options
   * @param {number[]} options.initialState - 初始状态向量
   * @param {number[][]} options.initialCovariance - 初始协方差矩阵
   * @param {Object} options.model - 模型对象 (from models.js)
   */
  constructor({ initialState, initialCovariance, model }) {
    this.x = initialState.slice();          // 状态向量 (列向量)
    this.P = initialCovariance.map(r => r.slice()); // 协方差矩阵
    this.model = model;
    this.stateDim = model.stateDim;

    // 用于返回值中暴露中间量
    this.lastPrior = null;
    this.lastPriorP = null;
    this.lastK = null;
    this.lastInnovation = null;
  }

  /**
   * 预测步骤 (时间更新)
   * x̂⁻ = F · x̂
   * P⁻  = F · P · Fᵀ + Q
   */
  predict(dt) {
    const { F, getQ } = this.model;

    // x⁻ = F · x
    this.x = matVecMul(F, this.x);

    // P⁻ = F · P · Fᵀ + Q
    const FP = matMul(F, this.P);
    const FPFt = matMul(FP, matTranspose(F));
    const Q = getQ ? getQ(dt) : [[0, 0], [0, 0]];
    this.P = matAdd(FPFt, Q);

    // 保存先验估计
    this.lastPrior = this.x.slice();
    this.lastPriorP = this.P.map(r => r.slice());

    return {
      prior: { x: this.x.slice(), P: this.P.map(r => r.slice()) },
    };
  }

  /**
   * 更新步骤 (测量更新)
   * y  = z - H·x̂⁻            （新息 / 残差）
   * S  = H·P⁻·Hᵀ + R        （新息协方差）
   * K  = P⁻·Hᵀ · S⁻¹        （卡尔曼增益）
   * x̂  = x̂⁻ + K·y           （状态更新）
   * P  = (I - K·H)·P⁻        （协方差更新）
   */
  update(measurement) {
    const { H, R } = this.model;

    // y = z - H·x
    const Hx = matVecMul(H, this.x);

    const y = []; // innovation
    for (let i = 0; i < measurement.length; i++) {
      y.push(measurement[i] - Hx[i]);
    }

    // S = H·P·Hᵀ + R
    const HP = matMul(H, this.P);
    const HPHt = matMul(HP, matTranspose(H));
    const S = matAdd(HPHt, R);

    // K = P·Hᵀ · S⁻¹
    const PHt = matMul(this.P, matTranspose(H));
    const SInv = matInverse2x2(S);
    if (!SInv) {
      // 数值问题：不能求逆，跳过更新
      return {
        posterior: { x: this.x.slice(), P: this.P.map(r => r.slice()) },
        K: null,
        innovation: y,
      };
    }
    const K = matMul(PHt, SInv);

    // x = x + K·y
    const Ky = matVecMul(K, y);
    this.x = this.x.map((v, i) => v + Ky[i]);

    // P = (I - K·H)·P
    const KH = matMul(K, H);
    const I_KH = matSub(matIdentity(this.stateDim), KH);
    this.P = matMul(I_KH, this.P);

    // 保存中间量
    this.lastK = K;
    this.lastInnovation = y;

    return {
      posterior: { x: this.x.slice(), P: this.P.map(r => r.slice()) },
      K: K,
      innovation: y,
    };
  }

  /**
   * 执行一步完整的 predict + update
   */
  step(measurement, dt = 1) {
    const predResult = this.predict(dt);
    const updResult = this.update(measurement);

    return {
      prior: predResult.prior,
      posterior: updResult.posterior,
      K: updResult.K,
      innovation: updResult.innovation,
    };
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      x: this.x.slice(),
      P: this.P.map(r => r.slice()),
    };
  }

  /**
   * 获取 2D 位置（兼容恒位置和恒速度模型）
   */
  getPosition() {
    return { x: this.x[0], y: this.x[1] };
  }

  /**
   * 获取后验协方差的前 2×2 块（用于椭圆绘制）
   */
  getPositionCovariance() {
    return [[this.P[0][0], this.P[0][1]], [this.P[1][0], this.P[1][1]]];
  }

  /**
   * 获取先验协方差的前 2×2 块
   */
  getPriorPositionCovariance() {
    if (!this.lastPriorP) return this.getPositionCovariance();
    return [[this.lastPriorP[0][0], this.lastPriorP[0][1]],
            [this.lastPriorP[1][0], this.lastPriorP[1][1]]];
  }

  /**
   * 重置滤波器
   */
  reset(initialState, initialCovariance) {
    this.x = initialState.slice();
    this.P = initialCovariance.map(r => r.slice());
    this.lastPrior = null;
    this.lastPriorP = null;
    this.lastK = null;
    this.lastInnovation = null;
  }
}
