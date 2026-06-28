/**
 * 卡尔曼滤波状态转移模型
 * 每个模型提供: F (状态转移矩阵), H (观测矩阵), Q(dt) (过程噪声), R (测量噪声)
 */

/**
 * 恒位置模型 (2D)
 * 状态: [px, py] — 只有位置
 * 适用于: 静态目标跟踪、温度估计等 1D/2D 恒值场景
 */
export function constantPositionModel(R) {
  return {
    name: '恒位置模型',
    stateDim: 2,
    F: [[1, 0], [0, 1]],           // x 不变
    H: [[1, 0], [0, 1]],           // 直接观测位置
    getQ: (dt) => [[0, 0], [0, 0]], // 无过程噪声（位置不变）
    R: R || [[100, 0], [0, 100]],
  };
}

/**
 * 恒速度模型 (4D)
 * 状态: [px, py, vx, vy] — 位置 + 速度
 * 适用于: 移动目标追踪（GPS 导航、雷达追踪）
 */
export function constantVelocityModel(Qmag, Rmag) {
  const q = Qmag || 0.1;
  const r = Rmag || 2500;

  return {
    name: '恒速度模型',
    stateDim: 4,

    // F: 状态转移矩阵
    F: [
      [1, 0, 1, 0], // px' = px + vx * dt
      [0, 1, 0, 1], // py' = py + vy * dt
      [0, 0, 1, 0], // vx' = vx
      [0, 0, 0, 1], // vy' = vy
    ],

    // H: 观测矩阵（只观测位置）
    H: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
    ],

    // Q: 过程噪声协方差（dt = 1 时的离散形式）
    // Q = [[dt³/3·q, 0, dt²/2·q, 0],
    //      [0, dt³/3·q, 0, dt²/2·q],
    //      [dt²/2·q, 0, dt·q,     0],
    //      [0, dt²/2·q, 0, dt·q    ]]
    getQ: function (dt) {
      const dt2 = dt * dt;
      const dt3 = dt2 * dt;
      return [
        [dt3 / 3 * q, 0,            dt2 / 2 * q, 0          ],
        [0,            dt3 / 3 * q, 0,            dt2 / 2 * q],
        [dt2 / 2 * q, 0,            dt * q,       0          ],
        [0,            dt2 / 2 * q, 0,            dt * q     ],
      ];
    },

    // R: 测量噪声协方差
    R: [[r, 0], [0, r]],
  };
}
