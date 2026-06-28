/**
 * Section 管理器
 * 使用 IntersectionObserver 检测当前可视的 section，
 * 对可见 section 初始化/恢复其 p5 sketch，对离开的 section 暂停
 */

/**
 * @param {Object} options
 * @param {string} options.sectionSelector - section 的 CSS 选择器
 * @param {Object<string, {init: Function, pause: Function, resume: Function}>} options.sketches
 *        - 以 section id 为 key 的 sketch 控制器映射
 * @param {Function} [options.onActiveChange] - 当前活跃 section 变化时的回调
 */
export function createSectionManager({
  sectionSelector = 'section.kf-section',
  sketches = {},
  onActiveChange = null,
  threshold = 0.5, // 50% 可见即视为活跃
}) {
  const sections = document.querySelectorAll(sectionSelector);
  const activeSections = new Set();
  const initialized = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id;

        if (entry.isIntersecting) {
          // 进入视图
          if (!initialized.has(id) && sketches[id]) {
            sketches[id].init();
            initialized.add(id);
          } else if (sketches[id] && sketches[id].resume) {
            sketches[id].resume();
          }
          activeSections.add(id);
        } else {
          // 离开视图
          activeSections.delete(id);
          if (sketches[id] && sketches[id].pause) {
            sketches[id].pause();
          }
        }
      }

      // 通知活跃 section 变化
      if (onActiveChange) {
        onActiveChange([...activeSections]);
      }
    },
    { threshold }
  );

  // 开始观察所有 section
  for (const section of sections) {
    observer.observe(section);
  }

  /**
   * 手动滚动到指定 section
   */
  function scrollTo(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return {
    observer,
    scrollTo,
    getActiveSections: () => [...activeSections],
    destroy: () => observer.disconnect(),
  };
}
