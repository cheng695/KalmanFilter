/**
 * 卡尔曼滤波教学网站 — 入口文件
 * 初始化所有 p5.js sketch 实例
 * 管理 section 可视状态
 */
import './style.css';
import { createSection0Sketch } from './sketches/section0-statistics.js';
import { createSection1FusionSketch } from './sketches/section1-fusion-formula.js';
import { createSection2ObserverSketch } from './sketches/section2-observer.js';
import { createSection2Sketch } from './sketches/section2-prior-post.js';
import { createSection3Sketch } from './sketches/section3-gain.js';
import { createSection4Sketch } from './sketches/section4-ellipses.js';
import { createSection5Sketch } from './sketches/section5-tracker.js';

// 等待 p5.js 加载
function waitForP5() {
  return new Promise((resolve) => {
    if (window.p5) {
      resolve();
      return;
    }
    const checkInterval = setInterval(() => {
      if (window.p5) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

// p5.js sketch 实例管理
const p5Instances = {};
const initializedSections = new Set();

const sketchFactories = {
  sec0: { factory: createSection0Sketch, container: 'sketch0-container' },
  sec1: { factory: createSection1FusionSketch, container: 'sketch1-container' },
  sec2: { factory: createSection2ObserverSketch, container: 'sketch2-container' },
  sec3: { factory: createSection2Sketch, container: 'sketch3-container' },
  sec4: { factory: createSection3Sketch, container: 'sketch4-container' },
  sec5: { factory: createSection4Sketch, container: 'sketch5-container' },
  sec6: { factory: createSection5Sketch, container: 'sketch6-container' },
};

function initSketch(sectionId) {
  if (initializedSections.has(sectionId)) {
    // 恢复
    const inst = p5Instances[sectionId];
    if (inst && inst.loop) inst.loop();
    return;
  }

  const info = sketchFactories[sectionId];
  if (!info) return;

  const container = document.getElementById(info.container);
  if (!container) return;

  const sketchFn = info.factory(container);
  const p5Instance = new window.p5(sketchFn, container);
  p5Instances[sectionId] = p5Instance;
  initializedSections.add(sectionId);
}

function pauseSketch(sectionId) {
  const inst = p5Instances[sectionId];
  if (inst && inst.noLoop) inst.noLoop();
}

// IntersectionObserver 管理 section 可见性
function setupSectionObserver() {
  const sections = document.querySelectorAll('.kf-section');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          initSketch(id);
          // 更新导航点
          updateNavDots(id);
        } else {
          pauseSketch(id);
        }
      }
    },
    { threshold: 0.3 }
  );

  for (const section of sections) {
    observer.observe(section);
  }

  return observer;
}

// 导航点高亮
function updateNavDots(activeId) {
  const dots = document.querySelectorAll('.nav-dot');
  dots.forEach((dot) => {
    const target = dot.getAttribute('data-target');
    if (target === activeId) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// 导航点击事件
function setupNavClicks() {
  const dots = document.querySelectorAll('.nav-dot');
  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const targetId = dot.getAttribute('data-target');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// 主初始化
async function main() {
  // 加载 p5.js
  await loadP5Script();
  await waitForP5();

  // 设置 section 管理
  setupSectionObserver();
  setupNavClicks();

  // 默认初始化第一个 visible section
  const firstSection = document.getElementById('sec0');
  if (firstSection) {
    initSketch('sec0');
  }

  console.log('✅ 卡尔曼滤波教学网站已就绪');
  console.log('   📐 7 个教学模块已加载（概率基础 + 数据融合 + 状态观测器 + 先验后验 + 增益 + 协方差 + 追踪）');
  console.log('   🎮 滚动页面开始学习，或点击右侧导航点跳转');
}

function loadP5Script() {
  return new Promise((resolve) => {
    if (window.p5) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/p5@1.11.0/lib/p5.min.js';
    script.onload = resolve;
    script.onerror = () => {
      console.warn('p5.js CDN 加载失败，尝试备用地址...');
      script.src = 'https://unpkg.com/p5@1.11.0/lib/p5.min.js';
      script.onerror = () => {
        console.error('p5.js 加载失败，请检查网络连接');
        resolve(); // 不阻塞后续流程
      };
    };
    document.head.appendChild(script);
  });
}

// 启动
main().catch(console.error);
