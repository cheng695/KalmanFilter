/**
 * 2×2 矩阵运算工具
 * 用于卡尔曼滤波的协方差矩阵操作
 * 所有运算都是纯函数（不修改输入）
 */

// 创建 2×2 矩阵
export function create(a, b, c, d) {
  return [[a, b], [c, d]];
}

// 单位矩阵
export function identity() {
  return [[1, 0], [0, 1]];
}

// 零矩阵
export function zeros() {
  return [[0, 0], [0, 0]];
}

// 矩阵加法: A + B
export function add(A, B) {
  return [
    [A[0][0] + B[0][0], A[0][1] + B[0][1]],
    [A[1][0] + B[1][0], A[1][1] + B[1][1]],
  ];
}

// 矩阵减法: A - B
export function sub(A, B) {
  return [
    [A[0][0] - B[0][0], A[0][1] - B[0][1]],
    [A[1][0] - B[1][0], A[1][1] - B[1][1]],
  ];
}

// 矩阵乘法: A * B
export function mul(A, B) {
  return [
    [
      A[0][0] * B[0][0] + A[0][1] * B[1][0],
      A[0][0] * B[0][1] + A[0][1] * B[1][1],
    ],
    [
      A[1][0] * B[0][0] + A[1][1] * B[1][0],
      A[1][0] * B[0][1] + A[1][1] * B[1][1],
    ],
  ];
}

// 矩阵乘标量: s * A
export function scale(s, A) {
  return [
    [s * A[0][0], s * A[0][1]],
    [s * A[1][0], s * A[1][1]],
  ];
}

// 转置
export function transpose(A) {
  return [
    [A[0][0], A[1][0]],
    [A[0][1], A[1][1]],
  ];
}

// 2×2 行列式
export function det(A) {
  return A[0][0] * A[1][1] - A[0][1] * A[1][0];
}

// 2×2 逆矩阵（闭式解）
export function inv2x2(A) {
  const d = det(A);
  if (Math.abs(d) < 1e-12) return null;
  const invDet = 1 / d;
  return [
    [ A[1][1] * invDet, -A[0][1] * invDet],
    [-A[1][0] * invDet,  A[0][0] * invDet],
  ];
}

/**
 * 2×2 实对称矩阵的特征值分解（闭式解）
 * 返回 { eigenvalues: [λ1, λ2], eigenvectors: [[v1x, v1y], [v2x, v2y]] }
 * λ1 ≥ λ2
 */
export function eigen2x2(M) {
  // 对于实对称矩阵 [[a, b], [b, d]]
  const a = M[0][0];
  const b = M[0][1]; // 假设对称: M[0][1] == M[1][0]
  const d = M[1][1];

  // 特征值: λ = (a+d)/2 ± √(((a-d)/2)² + b²)
  const trace = a + d;
  const det = a * d - b * b;
  const delta = Math.sqrt(Math.max(0, (a - d) * (a - d) / 4 + b * b));

  const lambda1 = trace / 2 + delta;
  const lambda2 = trace / 2 - delta;

  // 特征向量
  let v1x, v1y, v2x, v2y;

  // λ1 的特征向量
  if (Math.abs(b) > 1e-12) {
    v1x = lambda1 - d;
    v1y = b;
  } else if (Math.abs(a - lambda1) > 1e-12) {
    v1x = b;
    v1y = lambda1 - a;
  } else {
    v1x = 1;
    v1y = 0;
  }

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  if (len1 > 1e-12) {
    v1x /= len1;
    v1y /= len1;
  }

  // λ2 的特征向量（正交于 v1）
  v2x = -v1y;
  v2y = v1x;

  return {
    eigenvalues: [lambda1, lambda2],
    eigenvectors: [[v1x, v1y], [v2x, v2y]],
  };
}
