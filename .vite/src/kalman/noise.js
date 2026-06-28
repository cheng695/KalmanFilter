/**
 * 高斯（正态）随机数生成器
 * 使用 Box-Muller 变换从均匀分布生成正态分布
 */

/**
 * 生成服从 N(mean, stdDev²) 的随机数
 * @param {number} mean - 均值
 * @param {number} stdDev - 标准差
 * @returns {number}
 */
export function gaussianRandom(mean = 0, stdDev = 1) {
  let u1 = 0, u2 = 0;
  // 避免 u1 为零
  while (u1 === 0) u1 = Math.random();
  u2 = Math.random();

  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

/**
 * 生成二维高斯噪声向量
 * N([0,0], [[r², 0], [0, r²]])
 * @param {number} stdDev - 每个维度的标准差
 * @returns {{ x: number, y: number }}
 */
export function gaussian2D(stdDev = 1) {
  return {
    x: gaussianRandom(0, stdDev),
    y: gaussianRandom(0, stdDev),
  };
}

/**
 * 生成带有协方差矩阵的二维噪声
 * 使用 Cholesky 分解: noise = L * standard_normal
 * 对于 2×2 对角协方差矩阵 R = [[rx, 0], [0, ry]]:
 *   L = [[sqrt(rx), 0], [0, sqrt(ry)]]
 * @param {number[][]} covariance - 2×2 协方差矩阵
 * @returns {{ x: number, y: number }}
 */
export function gaussian2DCorrelated(covariance) {
  // 假设对角协方差矩阵
  const sx = Math.sqrt(Math.max(0, covariance[0][0]));
  const sy = Math.sqrt(Math.max(0, covariance[1][1]));
  return {
    x: gaussianRandom(0, sx),
    y: gaussianRandom(0, sy),
  };
}
