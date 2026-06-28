/**
 * 所有中文界面文案集中管理
 * 便于审校、修改和翻译
 */

export const T = {
  // 导航栏
  nav: {
    title: '卡尔曼滤波 — 从直觉到理解',
    sections: [
      '概率基础',
      '数据融合',
      '状态观测器',
      '先验 & 后验',
      '卡尔曼增益',
      '协方差矩阵',
      '完整滤波',
    ],
  },

  // 模块 0：概率论基础
  section0: {
    title: '模块零：概率论基础 — 均值、方差、标准差',
    subtitle: '在理解卡尔曼滤波之前，先回顾描述"不确定"的三个基本量',
    intro: `
      <p>卡尔曼滤波的核心是用<strong>概率分布</strong>来描述不确定性。需要三个基本量：</p>
      <ul>
        <li><strong>均值 μ</strong>：数据的"中心"——最可能的估计值</li>
        <li><strong>方差 σ²</strong>：数据的"离散程度"——平均偏差的平方</li>
        <li><strong>标准差 σ</strong>：方差的平方根——和原数据同单位，更直观</li>
      </ul>
    `,
    formulas: {
      mean: '\\[ \\mu = \\frac{1}{n} \\sum_{i=1}^{n} x_i \\]',
      variance: '\\[ \\sigma^2 = \\frac{1}{n} \\sum_{i=1}^{n} (x_i - \\mu)^2 \\]',
      std: '\\[ \\sigma = \\sqrt{\\sigma^2} \\]',
    },
    callout: '💡 在下方数轴上点击添加数据点，拖动移动，观察 μ 和 σ 如何变化。双击或右键点可删除。',
    statsCard: {
      samples: '样本数 n',
      mean: '均值 μ',
      variance: '方差 σ²',
      std: '标准差 σ',
    },
  },

  // 模块 1(A)：数据融合公式
  section1: {
    title: '模块一(A)：数据融合 — 两个不准确的测量，如何融合？',
    subtitle: '加权平均的直觉 → 最优卡尔曼增益 K 的诞生',
    intro: `
      <p>假设你有<strong>两个传感器</strong>同时测量同一个量，但它们的精度不同。</p>
      <p>融合公式：<em>ẑ = z₁ + K·(z₂ − z₁)</em></p>
      <p>最优 K：<em>K = σ₁² / (σ₁² + σ₂²)</em></p>
      <p>融合后方差 <strong>永远小于</strong>任何一个单独测量的方差。</p>
    `,
    formulas: {
      fusion: '\\[ \\hat{z} = z_1 + K(z_2 - z_1) \\]',
      optimalK: '\\[ K = \\frac{\\sigma_1^2}{\\sigma_1^2 + \\sigma_2^2} \\]',
      fusedVar: '\\[ \\sigma^2 = \\frac{\\sigma_1^2 \\sigma_2^2}{\\sigma_1^2 + \\sigma_2^2} < \\min(\\sigma_1^2, \\sigma_2^2) \\]',
    },
    legend: {
      z1: '测量 1（蓝色）',
      z2: '测量 2（红色）',
      zHat: '融合结果（绿色）',
      sigmaBand: '±2σ 不确定范围',
    },
  },

  // 模块 1(B)：全状态观测器
  section1: {
    title: '模块一：为什么需要卡尔曼滤波？',
    subtitle: '两个都不准的来源，合成一个最可信的答案',
    intro: `
      <p>想象你有一台<span class="highlight"> GPS 定位仪</span>，它有 ±10 米的误差。</p>
      <p>同时，你知道自己上一秒的位置，并根据<span class="highlight">速度估计</span>推算出现在的位置——但这个推算也有误差。</p>
      <p>两个信息源都<strong>不完美</strong>，但卡尔曼滤波能告诉你：<strong>如何将它们融合，得到一个比任何一个都更精确的估计</strong>。</p>
      <p>秘密在于：<span class="highlight-blue">两个高斯分布相乘，结果是一个更窄（更确定）的高斯分布</span>。</p>
    `,
    legend: {
      modelPrediction: '模型预测（先验）',
      measurement: '传感器测量',
      fused: '融合结果（后验）',
    },
    callout: '下方两个滑块分别控制模型和传感器的"不确定程度"。拖动它们，观察融合结果如何变化。',
  },

  // 模块 2：先验后验
  section2: {
    title: '模块二：先验估计 vs 后验估计',
    subtitle: '从"我猜"到"我知道" — 类比例控制器',
    intro: `
      <p>卡尔曼滤波每时每刻在做两件事：</p>
      <ol>
        <li><strong>预测（先验）</strong>：根据系统模型，"猜"一个状态 → <em>x̂⁻</em></li>
        <li><strong>更新（后验）</strong>：用测量值修正猜测 → <em>x̂ = x̂⁻ + K · (z - x̂⁻)</em></li>
      </ol>
      <p>注意这个公式的结构 —— <span class="highlight-orange">它和一个<strong>比例控制器</strong>完全一样</span>：</p>
      <p class="formula-center"><em>u = −K · e</em>　→　<em>Δx̂ = K · (z − x̂⁻)</em></p>
      <p>控制器中 K 决定"纠偏力度"，卡尔曼中 K 决定"更信测量还是更信模型"。</p>
    `,
    priorLabel: '先验估计 x̂⁻（猜想）',
    posteriorLabel: '后验估计 x̂（知道）',
    measurementLabel: '测量值 z',
    arrowLabel: '修正量 K·(z−x̂⁻)',
  },

  // 模块 3：卡尔曼增益
  section3: {
    title: '模块三：卡尔曼增益 — 该信谁？',
    subtitle: 'K 值决定了融合的"天平"往哪边倾斜',
    intro: `
      <p>卡尔曼增益 <em>K</em> 是<strong>自适应</strong>的权重因子，它在 0 到 1 之间自动调节：</p>
      <ul>
        <li><strong>K ≈ 0</strong>：几乎不信测量，后验 ≈ 先验（"我更信自己的模型"）</li>
        <li><strong>K ≈ 1</strong>：几乎不信模型，后验 ≈ 测量（"我更信传感器"）</li>
        <li><strong>0 < K < 1</strong>：最优加权平均</li>
      </ul>
      <p>什么决定了 K？——<span class="highlight-orange">两个"噪声"的相对大小</span>：</p>
      <p class="formula-center">过程噪声 Q ↑ → 模型不可靠 → P⁻ ↑ → K ↑ → 更信测量</p>
      <p class="formula-center">测量噪声 R ↑ → 传感器不可靠 → K ↓ → 更信模型</p>
    `,
    sliders: {
      R: '测量噪声 R（传感器方差）',
      Q: '过程噪声 Q（模型不确定性）',
    },
  },

  // 模块 4：协方差矩阵
  section4: {
    title: '模块四：协方差矩阵 — 不确定性长什么样？',
    subtitle: '每个椭圆代表"我对状态有多不确定"',
    intro: `
      <p>在前面，我们用<strong>一个数字</strong>（方差）表示不确定性。</p>
      <p>在二维追踪中，不确定性是一个<strong>椭圆</strong>——它告诉我们：</p>
      <ul>
        <li><strong>椭圆越大</strong> → 越不确定</li>
        <li><strong>椭圆越扁</strong> → 某个方向比另一个方向更不确定</li>
      </ul>
      <p>关键公式（不看推导，看效果）：</p>
      <p class="formula-center"><em>P = (I − KH) · P⁻</em></p>
      <p>因为 (I−KH) 的"缩放"作用，<span class="highlight">后验椭圆 <strong>永远</strong> 比先验椭圆小</span>——这就是"信息增益"的几何含义。</p>
    `,
    legend: {
      priorEllipse: 'P⁻ 先验协方差椭圆',
      posteriorEllipse: 'P 后验协方差椭圆',
      measurementNoise: 'R 测量噪声圆',
    },
  },

  // 模块 5：完整追踪
  section5: {
    title: '模块五：完整预测—更新循环',
    subtitle: '所有概念融合在一起 — 实时 2D 目标追踪',
    intro: `
      <p>这是卡尔曼滤波的<strong>完整演示</strong>。</p>
      <p><span class="highlight">移动鼠标</span>来控制"真实目标"的位置。滤波器只看到带噪声的测量值（红叉），但你却能看到它精确追踪真实轨迹（蓝圈）。</p>
      <p>如果鼠标不动，演示会自动切换到预设轨迹模式。</p>
    `,
    controls: {
      play: '播放',
      pause: '暂停',
      step: '单步',
      reset: '重置',
      speed: '速度',
      autoMode: '鼠标静止 — 演示模式',
      mouseMode: '鼠标追踪模式',
    },
    legend: {
      trueTrail: '真实轨迹',
      measurements: '测量值（带噪声）',
      posteriorEstimate: '后验估计（滤波结果）',
      priorPrediction: '先验预测',
    },
    info: {
      gainMatrix: '卡尔曼增益矩阵 K',
      covMatrix: '后验协方差 P',
      innovation: '新息（残差）',
    },
  },

  // 通用
  common: {
    prior: '先验',
    posterior: '后验',
    measurement: '测量',
    predict: '预测',
    update: '更新',
    truth: '真实值',
    noise: '噪声',
  },
};
