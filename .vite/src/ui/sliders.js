/**
 * 参数滑块工厂
 * 在 DOM 容器中创建带中文标签和实时数值显示的滑块
 */

/**
 * 创建一个参数滑块
 * @param {Object} options
 * @param {HTMLElement} options.container - 挂载的 DOM 元素
 * @param {string} options.label - 中文标签
 * @param {string} options.suffix - 数值后缀（单位等）
 * @param {number} options.min - 最小值
 * @param {number} options.max - 最大值
 * @param {number} options.value - 初始值
 * @param {number} options.step - 步长
 * @param {Function} options.onChange - 值变化回调 (value) => void
 * @param {number} options.decimals - 显示小数位数，默认 1
 * @returns {{ getValue: Function, setValue: Function, getElement: Function }}
 */
export function createSlider({
  container,
  label,
  suffix = '',
  min = 0,
  max = 100,
  value = 50,
  step = 1,
  onChange = null,
  decimals = 1,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'slider-group';

  // 标签行
  const labelRow = document.createElement('div');
  labelRow.className = 'slider-label-row';

  const labelEl = document.createElement('span');
  labelEl.className = 'slider-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'slider-value';
  valueEl.textContent = `${value.toFixed(decimals)}${suffix}`;

  labelRow.appendChild(labelEl);
  labelRow.appendChild(valueEl);

  // 滑块
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'param-slider';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(value);

  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    valueEl.textContent = `${val.toFixed(decimals)}${suffix}`;
    if (onChange) onChange(val);
  });

  wrapper.appendChild(labelRow);
  wrapper.appendChild(slider);
  container.appendChild(wrapper);

  return {
    getValue: () => parseFloat(slider.value),
    setValue: (v) => {
      slider.value = String(v);
      valueEl.textContent = `${v.toFixed(decimals)}${suffix}`;
      if (onChange) onChange(v);
    },
    getElement: () => wrapper,
  };
}

/**
 * 创建一组滑块
 * @param {HTMLElement} container
 * @param {Array<Object>} sliderDefs - 每个滑块的配置
 */
export function createSliderGroup(container, sliderDefs) {
  const sliders = {};
  for (const def of sliderDefs) {
    const name = def.name;
    const { name: _, ...config } = def;
    sliders[name] = createSlider({ ...config, container });
  }
  return sliders;
}
