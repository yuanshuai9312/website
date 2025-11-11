// Mobile menu only (no theme toggles anywhere)
const btn = document.getElementById('menuBtn');
const nav = document.getElementById('siteNav');
btn?.addEventListener('click', ()=>{
  const open = nav.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});

// Charts
(function(){
  const svgNS = 'http://www.w3.org/2000/svg';
  const chartDefinitions = {
    'tool2-qdr': {
      title: 'Tool2 QDR 清洗状态分布',
      unit: 'ppm',
      decimals: 1,
      dataset: [
        { label: '超标', value: 12.4, color: '#ef4444' },
        { label: '接近', value: 8.7, color: '#f59e0b' },
        { label: '达标', value: 6.2, color: '#22c55e' }
      ]
    }
  };

  const charts = document.querySelectorAll('svg.bar-chart[data-chart]');
  if (!charts.length) return;

  function createSvgElement(name){
    return document.createElementNS(svgNS, name);
  }

  function formatValue(value, decimals, unit){
    const precision = Number.isInteger(decimals) ? decimals : (Number.isInteger(value) ? 0 : 1);
    const formatted = value.toFixed(precision);
    return unit ? `${formatted} ${unit}` : formatted;
  }

  function computeScale(values, tickCount){
    const maxValue = Math.max(...values, 0);
    if (maxValue <= 0){
      return { max: 1, step: 1 / Math.max(tickCount, 1) };
    }
    const padded = maxValue * 1.1;
    const exponent = Math.floor(Math.log10(padded));
    const magnitude = Math.pow(10, exponent);
    const normalized = padded / magnitude;
    let niceNormalized;
    if (normalized <= 1){
      niceNormalized = 1;
    } else if (normalized <= 2){
      niceNormalized = 2;
    } else if (normalized <= 5){
      niceNormalized = 5;
    } else {
      niceNormalized = 10;
    }
    const niceMax = niceNormalized * magnitude;
    const step = niceMax / Math.max(tickCount, 1);
    return { max: niceMax, step };
  }

  charts.forEach((svg)=>{
    const key = svg.dataset.chart;
    const config = chartDefinitions[key];
    if (!config || !Array.isArray(config.dataset) || !config.dataset.length){
      return;
    }

    const width = 520;
    const height = 320;
    const margin = { top: 24, right: 24, bottom: 72, left: 60 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const tickCount = 5;

    const values = config.dataset.map((item)=>item.value);
    const { max: axisMax, step: tickStep } = computeScale(values, tickCount);

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    while (svg.firstChild){
      svg.removeChild(svg.firstChild);
    }

    // Update accessible description
    const summaryText = config.dataset
      .map((item)=>`${item.label}${formatValue(item.value, config.decimals, config.unit)}`)
      .join('，');
    const descEl = svg.querySelector('[data-chart-desc]');
    if (descEl){
      descEl.textContent = `${config.title}：${summaryText}`;
    }
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${config.title}：${summaryText}`);

    // Background rectangle for plotting area
    const background = createSvgElement('rect');
    background.setAttribute('x', margin.left);
    background.setAttribute('y', margin.top);
    background.setAttribute('width', plotWidth);
    background.setAttribute('height', plotHeight);
    background.setAttribute('fill', '#f8fafc');
    background.setAttribute('stroke', '#e2e8f0');
    background.setAttribute('stroke-width', '1');
    svg.appendChild(background);

    // Gridlines and y-axis labels
    for (let i = 0; i <= tickCount; i += 1){
      const value = tickStep * i;
      const ratio = value / axisMax;
      const y = margin.top + plotHeight - (plotHeight * ratio);

      const gridline = createSvgElement('line');
      gridline.setAttribute('x1', margin.left);
      gridline.setAttribute('x2', margin.left + plotWidth);
      gridline.setAttribute('y1', y);
      gridline.setAttribute('y2', y);
      gridline.setAttribute('stroke', i === 0 ? '#94a3b8' : '#cbd5f5');
      gridline.setAttribute('stroke-width', i === 0 ? '1.2' : '0.8');
      gridline.setAttribute('stroke-dasharray', i === 0 ? '0' : '4 4');
      svg.appendChild(gridline);

      const label = createSvgElement('text');
      label.setAttribute('x', margin.left - 8);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#475569');
      label.textContent = formatValue(value, config.decimals, config.unit);
      svg.appendChild(label);
    }

    // Bars
    const gap = 24;
    const totalGap = gap * (config.dataset.length + 1);
    const barWidth = (plotWidth - totalGap) / config.dataset.length;

    config.dataset.forEach((item, index)=>{
      const valueRatio = item.value / axisMax;
      const barHeight = Math.max(valueRatio * plotHeight, 0);
      const x = margin.left + gap + index * (barWidth + gap);
      const y = margin.top + plotHeight - barHeight;

      const rect = createSvgElement('rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', item.color || '#1e3a8a');
      rect.setAttribute('rx', '6');
      rect.setAttribute('ry', '6');
      svg.appendChild(rect);

      const valueLabel = createSvgElement('text');
      valueLabel.setAttribute('x', x + barWidth / 2);
      valueLabel.setAttribute('y', Math.min(y - 8, margin.top + plotHeight - 8));
      valueLabel.setAttribute('text-anchor', 'middle');
      valueLabel.setAttribute('font-size', '12');
      valueLabel.setAttribute('fill', '#0f172a');
      valueLabel.setAttribute('font-weight', '600');
      valueLabel.textContent = formatValue(item.value, config.decimals, config.unit);
      svg.appendChild(valueLabel);

      const axisLabel = createSvgElement('text');
      axisLabel.setAttribute('x', x + barWidth / 2);
      axisLabel.setAttribute('y', margin.top + plotHeight + 28);
      axisLabel.setAttribute('text-anchor', 'middle');
      axisLabel.setAttribute('font-size', '13');
      axisLabel.setAttribute('fill', '#475569');
      axisLabel.textContent = item.label;
      svg.appendChild(axisLabel);
    });

    // X-axis line
    const axisLine = createSvgElement('line');
    axisLine.setAttribute('x1', margin.left);
    axisLine.setAttribute('x2', margin.left + plotWidth);
    axisLine.setAttribute('y1', margin.top + plotHeight);
    axisLine.setAttribute('y2', margin.top + plotHeight);
    axisLine.setAttribute('stroke', '#94a3b8');
    axisLine.setAttribute('stroke-width', '1.2');
    svg.appendChild(axisLine);
  });
})();
