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
      type: 'bar',
      title: 'Tool2 QDR 清洗状态分布',
      unit: 'ppm',
      decimals: 2,
      dataset: [
        { label: '超标', value: 12.43, color: '#ef4444' },
        { label: '接近', value: 8.66, color: '#f59e0b' },
        { label: '达标', value: 6.18, color: '#22c55e' }
      ]
    },
    'tool2-fr-qdr': {
      type: 'dual-line',
      title: 'Tool2 FR / QDR 趋势对比',
      description: '比较 FR 与 QDR 在半年内的趋势',
      xLabels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      leftAxis: {
        label: 'FR (%)',
        unit: '%',
        decimals: 2
      },
      rightAxis: {
        label: 'QDR (ppm)',
        unit: 'ppm',
        decimals: 1
      },
      series: [
        {
          name: 'FR',
          axis: 'left',
          color: '#2563eb',
          values: [0.58, 0.62, 0.55, 0.6, 0.57, 0.64]
        },
        {
          name: 'QDR',
          axis: 'right',
          color: '#7c3aed',
          values: [320.4, 295.8, 310.2, 275.6, 268.9, 250.5]
        }
      ]
    }
  };

  const charts = document.querySelectorAll('svg[data-chart]');
  if (!charts.length) return;

  function createSvgElement(name){
    return document.createElementNS(svgNS, name);
  }

  function formatValue(value, decimals, unit){
    if (!Number.isFinite(value)) return '--';
    const precision = Number.isInteger(decimals) ? decimals : (Number.isInteger(value) ? 0 : 1);
    const formatted = value.toFixed(precision);
    return unit ? `${formatted} ${unit}`.trim() : formatted;
  }

  function computeScale(values, tickCount){
    const safeValues = values.filter((val)=>Number.isFinite(val));
    const maxValue = safeValues.length ? Math.max(...safeValues, 0) : 0;
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

  function prepareStructure(svg, config, summaryText){
    const titleEl = svg.querySelector('title') || createSvgElement('title');
    const descEl = svg.querySelector('desc[data-chart-desc]') || svg.querySelector('desc') || createSvgElement('desc');
    const descId = descEl.id || undefined;

    while (svg.firstChild){
      svg.removeChild(svg.firstChild);
    }

    titleEl.textContent = config.title;
    svg.appendChild(titleEl);

    if (descId) descEl.id = descId;
    if (descEl.hasAttribute('data-chart-desc') || summaryText){
      descEl.setAttribute('data-chart-desc', '');
      descEl.textContent = summaryText ? `${config.title}：${summaryText}` : config.title;
    }
    svg.appendChild(descEl);

    svg.setAttribute('role', 'img');
    if (summaryText){
      svg.setAttribute('aria-label', `${config.title}：${summaryText}`);
    } else {
      svg.removeAttribute('aria-label');
    }
  }

  function renderBarChart(svg, config){
    const width = config.width || 520;
    const height = config.height || 320;
    const margin = Object.assign({ top: 32, right: 32, bottom: 72, left: 68 }, config.margin);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const tickCount = config.tickCount || 5;

    const values = config.dataset.map((item)=>item.value);
    const { max: axisMax, step: tickStep } = computeScale(values, tickCount);

    const summaryText = config.dataset
      .map((item)=>`${item.label}${formatValue(item.value, config.decimals, config.unit)}`)
      .join('，');

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    prepareStructure(svg, config, summaryText);

    const background = createSvgElement('rect');
    background.setAttribute('x', margin.left);
    background.setAttribute('y', margin.top);
    background.setAttribute('width', plotWidth);
    background.setAttribute('height', plotHeight);
    background.setAttribute('fill', '#f8fafc');
    background.setAttribute('stroke', '#e2e8f0');
    background.setAttribute('stroke-width', '1');
    svg.appendChild(background);

    for (let i = 0; i <= tickCount; i += 1){
      const value = tickStep * i;
      const ratio = axisMax === 0 ? 0 : value / axisMax;
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
      label.setAttribute('x', margin.left - 10);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '12');
      label.setAttribute('fill', '#475569');
      label.textContent = formatValue(value, config.decimals, config.unit);
      svg.appendChild(label);
    }

    const gap = config.barGap || 24;
    const totalGap = gap * (config.dataset.length + 1);
    const barWidth = (plotWidth - totalGap) / config.dataset.length;

    config.dataset.forEach((item, index)=>{
      const valueRatio = axisMax === 0 ? 0 : item.value / axisMax;
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
      valueLabel.setAttribute('y', y - 10);
      valueLabel.setAttribute('text-anchor', 'middle');
      valueLabel.setAttribute('font-size', '12');
      valueLabel.setAttribute('fill', '#0f172a');
      valueLabel.setAttribute('font-weight', '600');
      valueLabel.textContent = formatValue(item.value, config.decimals, config.unit);
      svg.appendChild(valueLabel);

      const axisLabel = createSvgElement('text');
      axisLabel.setAttribute('x', x + barWidth / 2);
      axisLabel.setAttribute('y', margin.top + plotHeight + 30);
      axisLabel.setAttribute('text-anchor', 'middle');
      axisLabel.setAttribute('font-size', '13');
      axisLabel.setAttribute('fill', '#475569');
      axisLabel.textContent = item.label;
      svg.appendChild(axisLabel);
    });

    const axisLine = createSvgElement('line');
    axisLine.setAttribute('x1', margin.left);
    axisLine.setAttribute('x2', margin.left + plotWidth);
    axisLine.setAttribute('y1', margin.top + plotHeight);
    axisLine.setAttribute('y2', margin.top + plotHeight);
    axisLine.setAttribute('stroke', '#94a3b8');
    axisLine.setAttribute('stroke-width', '1.2');
    svg.appendChild(axisLine);
  }

  function renderDualLineChart(svg, config){
    const width = config.width || 600;
    const height = config.height || 360;
    const margin = Object.assign({ top: 40, right: 88, bottom: 72, left: 84 }, config.margin);
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const tickCount = config.tickCount || 5;
    const xLabels = Array.isArray(config.xLabels) && config.xLabels.length ? config.xLabels : [];
    const leftSeries = config.series.filter((serie)=>(serie.axis || 'left') !== 'right');
    const rightSeries = config.series.filter((serie)=>(serie.axis || 'left') === 'right');

    const leftValues = leftSeries.flatMap((serie)=>serie.values || []);
    const rightValues = rightSeries.flatMap((serie)=>serie.values || []);
    const leftScale = computeScale(leftValues, tickCount);
    const rightScale = computeScale(rightValues, tickCount);

    const summaryText = xLabels.length
      ? xLabels.map((label, idx)=>{
          const pieces = config.series.map((serie)=>{
            const axisConfig = (serie.axis || 'left') === 'right' ? config.rightAxis : config.leftAxis;
            const value = Array.isArray(serie.values) ? serie.values[idx] : undefined;
            return `${serie.name}${formatValue(value, axisConfig?.decimals, axisConfig?.unit)}`;
          });
          return `${label}：${pieces.join('，')}`;
        }).join('；')
      : config.series
          .map((serie)=>{
            const axisConfig = (serie.axis || 'left') === 'right' ? config.rightAxis : config.leftAxis;
            const values = Array.isArray(serie.values) ? serie.values : [];
            return `${serie.name}${values.map((value)=>formatValue(value, axisConfig?.decimals, axisConfig?.unit)).join('，')}`;
          })
          .join('；');

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    prepareStructure(svg, config, summaryText);

    const background = createSvgElement('rect');
    background.setAttribute('x', margin.left);
    background.setAttribute('y', margin.top);
    background.setAttribute('width', plotWidth);
    background.setAttribute('height', plotHeight);
    background.setAttribute('fill', '#f8fafc');
    background.setAttribute('stroke', '#e2e8f0');
    background.setAttribute('stroke-width', '1');
    svg.appendChild(background);

    for (let i = 0; i <= tickCount; i += 1){
      const value = leftScale.step * i;
      const ratio = leftScale.max === 0 ? 0 : value / leftScale.max;
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

      const leftLabel = createSvgElement('text');
      leftLabel.setAttribute('x', margin.left - 12);
      leftLabel.setAttribute('y', y + 4);
      leftLabel.setAttribute('text-anchor', 'end');
      leftLabel.setAttribute('font-size', '12');
      leftLabel.setAttribute('fill', '#475569');
      leftLabel.textContent = formatValue(value, config.leftAxis?.decimals, config.leftAxis?.unit);
      svg.appendChild(leftLabel);

      const rightValue = rightScale.step * i;
      const rightLabel = createSvgElement('text');
      rightLabel.setAttribute('x', margin.left + plotWidth + 12);
      rightLabel.setAttribute('y', y + 4);
      rightLabel.setAttribute('text-anchor', 'start');
      rightLabel.setAttribute('font-size', '12');
      rightLabel.setAttribute('fill', '#475569');
      rightLabel.textContent = formatValue(rightValue, config.rightAxis?.decimals, config.rightAxis?.unit);
      svg.appendChild(rightLabel);
    }

    if (config.leftAxis?.label){
      const leftAxisLabel = createSvgElement('text');
      leftAxisLabel.setAttribute('x', margin.left - 48);
      leftAxisLabel.setAttribute('y', margin.top - 12);
      leftAxisLabel.setAttribute('text-anchor', 'start');
      leftAxisLabel.setAttribute('font-size', '12');
      leftAxisLabel.setAttribute('fill', '#64748b');
      leftAxisLabel.setAttribute('font-weight', '600');
      leftAxisLabel.textContent = config.leftAxis.label;
      svg.appendChild(leftAxisLabel);
    }

    if (config.rightAxis?.label){
      const rightAxisLabel = createSvgElement('text');
      rightAxisLabel.setAttribute('x', margin.left + plotWidth + 8);
      rightAxisLabel.setAttribute('y', margin.top - 12);
      rightAxisLabel.setAttribute('text-anchor', 'end');
      rightAxisLabel.setAttribute('font-size', '12');
      rightAxisLabel.setAttribute('fill', '#64748b');
      rightAxisLabel.setAttribute('font-weight', '600');
      rightAxisLabel.textContent = config.rightAxis.label;
      svg.appendChild(rightAxisLabel);
    }

    const xCount = xLabels.length;
    const xStep = xCount > 1 ? plotWidth / (xCount - 1) : 0;

    const xAxisLine = createSvgElement('line');
    xAxisLine.setAttribute('x1', margin.left);
    xAxisLine.setAttribute('x2', margin.left + plotWidth);
    xAxisLine.setAttribute('y1', margin.top + plotHeight);
    xAxisLine.setAttribute('y2', margin.top + plotHeight);
    xAxisLine.setAttribute('stroke', '#94a3b8');
    xAxisLine.setAttribute('stroke-width', '1.2');
    svg.appendChild(xAxisLine);

    xLabels.forEach((label, index)=>{
      const x = margin.left + xStep * index;
      const tick = createSvgElement('line');
      tick.setAttribute('x1', x);
      tick.setAttribute('x2', x);
      tick.setAttribute('y1', margin.top + plotHeight);
      tick.setAttribute('y2', margin.top + plotHeight + 6);
      tick.setAttribute('stroke', '#94a3b8');
      tick.setAttribute('stroke-width', '1');
      svg.appendChild(tick);

      const labelEl = createSvgElement('text');
      labelEl.setAttribute('x', x);
      labelEl.setAttribute('y', margin.top + plotHeight + 24);
      labelEl.setAttribute('text-anchor', 'middle');
      labelEl.setAttribute('font-size', '12');
      labelEl.setAttribute('fill', '#475569');
      labelEl.textContent = label;
      svg.appendChild(labelEl);
    });

    config.series.forEach((serie)=>{
      const axisSide = (serie.axis || 'left') === 'right' ? 'right' : 'left';
      const axisConfig = axisSide === 'right' ? config.rightAxis : config.leftAxis;
      const scale = axisSide === 'right' ? rightScale : leftScale;
      const values = Array.isArray(serie.values) ? serie.values : [];
      const linePath = values
        .map((value, index)=>{
          const x = margin.left + xStep * index;
          const ratio = scale.max === 0 ? 0 : value / scale.max;
          const y = margin.top + plotHeight - (plotHeight * ratio);
          return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');

      if (linePath){
        const path = createSvgElement('path');
        path.setAttribute('d', linePath);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', serie.color || '#0f172a');
        path.setAttribute('stroke-width', '2.4');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
      }

      values.forEach((value, index)=>{
        const x = margin.left + xStep * index;
        const ratio = scale.max === 0 ? 0 : value / scale.max;
        const y = margin.top + plotHeight - (plotHeight * ratio);

        const marker = createSvgElement('circle');
        marker.setAttribute('cx', x);
        marker.setAttribute('cy', y);
        marker.setAttribute('r', '4.5');
        marker.setAttribute('fill', '#fff');
        marker.setAttribute('stroke', serie.color || '#0f172a');
        marker.setAttribute('stroke-width', '2');
        svg.appendChild(marker);

        const valueLabel = createSvgElement('text');
        valueLabel.setAttribute('x', x);
        valueLabel.setAttribute('y', y - 12);
        valueLabel.setAttribute('text-anchor', 'middle');
        valueLabel.setAttribute('font-size', '11');
        valueLabel.setAttribute('fill', '#1f2937');
        valueLabel.setAttribute('font-weight', '600');
        valueLabel.textContent = formatValue(value, axisConfig?.decimals, axisConfig?.unit);
        svg.appendChild(valueLabel);
      });
    });
  }

  charts.forEach((svg)=>{
    const key = svg.dataset.chart;
    const config = chartDefinitions[key];
    if (!config){
      return;
    }

    if (config.type === 'dual-line'){
      renderDualLineChart(svg, config);
    } else {
      renderBarChart(svg, config);
    }
  });
})();
