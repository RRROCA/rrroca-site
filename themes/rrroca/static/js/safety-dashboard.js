/**
 * RRROCA Safety Dashboard
 * Renders crime trend chart using Canvas API (no dependencies).
 * Data sourced from Calgary Open Data & CPS.
 */

(function() {
  'use strict';

  // Quarterly crime data for Rocky Ridge + Royal Oak combined
  // Source: mycalgary.com/crime-statistics + Calgary Open Data
  // Updated: Q1 2026
  const crimeData = {
    labels: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'Q1 2026'],
    rockyRidge: [3, 4, 5, 3, 2],
    royalOak:   [4, 3, 4, 3, 3],
    calgaryAvg: [19, 22, 24, 18, 20]
  };

  const seriesConfig = [
    {
      key: 'rockyRidge',
      label: 'Rocky Ridge',
      colorVar: '--color-ridge',
      fallback: '#2c6e8a',
      dashed: false
    },
    {
      key: 'royalOak',
      label: 'Royal Oak',
      colorVar: '--color-meadow',
      fallback: '#4a8c5c',
      dashed: false
    },
    {
      key: 'calgaryAvg',
      label: 'Calgary average',
      colorVar: '--color-alert',
      fallback: '#c0392b',
      dashed: true
    }
  ];

  function readColor(variableName, fallback) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
    return value || fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hideTooltip(canvas, tooltip) {
    if (!tooltip) return;
    tooltip.hidden = true;
    tooltip.textContent = '';
    canvas.removeAttribute('data-active-point');
  }

  function showTooltip(canvas, tooltip, point, containerWidth, containerHeight) {
    if (!tooltip || !point) return;

    tooltip.textContent = `${point.label} — ${point.seriesLabel}: ${point.value} reported incident${point.value === 1 ? '' : 's'}`;
    tooltip.hidden = false;

    const tooltipWidth = tooltip.offsetWidth || 180;
    const tooltipHeight = tooltip.offsetHeight || 44;
    const left = clamp(point.x + 14, 12, Math.max(12, containerWidth - tooltipWidth - 12));
    const top = clamp(point.y - tooltipHeight - 14, 12, Math.max(12, containerHeight - tooltipHeight - 12));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    canvas.dataset.activePoint = `${point.seriesLabel}-${point.label}`;
  }

  function bindInteractions(canvas, tooltip) {
    if (canvas.dataset.interactiveBound === 'true') return;

    function updateTooltip(event) {
      if (!tooltip || !canvas._safetyPoints || !canvas._safetyPoints.length) return;

      const rect = canvas.getBoundingClientRect();
      const pointer = event.touches && event.touches[0] ? event.touches[0] : event;
      if (!pointer) return;

      const x = pointer.clientX - rect.left;
      const y = pointer.clientY - rect.top;

      let nearestPoint = null;
      let nearestDistance = Infinity;

      canvas._safetyPoints.forEach((point) => {
        const distance = Math.hypot(point.x - x, point.y - y);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPoint = point;
        }
      });

      if (!nearestPoint || nearestDistance > 24) {
        hideTooltip(canvas, tooltip);
        return;
      }

      showTooltip(canvas, tooltip, nearestPoint, rect.width, rect.height);
    }

    canvas.addEventListener('mousemove', updateTooltip);
    canvas.addEventListener('touchstart', updateTooltip, { passive: true });
    canvas.addEventListener('touchmove', updateTooltip, { passive: true });
    canvas.addEventListener('mouseleave', () => hideTooltip(canvas, tooltip));
    canvas.addEventListener('touchend', () => hideTooltip(canvas, tooltip));
    canvas.addEventListener('blur', () => hideTooltip(canvas, tooltip));
    canvas.dataset.interactiveBound = 'true';
  }

  function drawChart() {
    const canvas = document.getElementById('safety-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tooltip = document.getElementById('safety-chart-tooltip');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 250;
    const palette = {
      border: readColor('--color-border', '#e8e4df'),
      textMuted: readColor('--color-text-muted', '#718096'),
      surface: readColor('--color-surface', '#ffffff')
    };
    const series = seriesConfig.map((item) => ({
      ...item,
      color: readColor(item.colorVar, item.fallback),
      values: crimeData[item.key]
    }));

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const padding = { top: 18, right: 118, bottom: 40, left: 48 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Max value for scale
    const maxVal = Math.max(10, Math.ceil(Math.max(...series.flatMap((item) => item.values)) / 5) * 5);
    const ySteps = 5;
    const step = chartW / (crimeData.labels.length - 1);
    const interactivePoints = [];

    // Grid lines
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (chartH / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = palette.textMuted;
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / ySteps) * i), padding.left - 8, y + 4);
    }

    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.lineTo(width - padding.right, padding.top + chartH);
    ctx.strokeStyle = palette.textMuted;
    ctx.stroke();

    // X-axis labels
    ctx.fillStyle = palette.textMuted;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    crimeData.labels.forEach((label, i) => {
      const x = padding.left + step * i;
      ctx.fillText(label, x, height - 8);
    });

    // Draw line function
    function drawLine(seriesItem) {
      const data = seriesItem.values;
      ctx.beginPath();
      ctx.strokeStyle = seriesItem.color;
      ctx.lineWidth = seriesItem.dashed ? 1.75 : 2.75;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (seriesItem.dashed) ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);

      data.forEach((val, i) => {
        const x = padding.left + step * i;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Dots
      ctx.setLineDash([]);
      data.forEach((val, i) => {
        const x = padding.left + step * i;
        const y = padding.top + chartH - (val / maxVal) * chartH;
        interactivePoints.push({
          x,
          y,
          value: val,
          label: crimeData.labels[i],
          seriesLabel: seriesItem.label
        });
        ctx.beginPath();
        ctx.arc(x, y, seriesItem.dashed ? 3 : 4, 0, Math.PI * 2);
        ctx.fillStyle = palette.surface;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, seriesItem.dashed ? 2 : 3, 0, Math.PI * 2);
        ctx.fillStyle = seriesItem.color;
        ctx.fill();
      });
    }

    [series[2], series[0], series[1]].forEach(drawLine);

    const labelPositions = series.map((seriesItem) => {
      const lastValue = seriesItem.values[seriesItem.values.length - 1];
      return {
        seriesItem,
        text: `${seriesItem.label} ${lastValue}`,
        x: padding.left + step * (crimeData.labels.length - 1) + 10,
        y: padding.top + chartH - (lastValue / maxVal) * chartH
      };
    });

    labelPositions
      .sort((a, b) => a.y - b.y)
      .forEach((label, index, labels) => {
        if (index > 0 && label.y - labels[index - 1].y < 18) {
          label.y = labels[index - 1].y + 18;
        }
      });

    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    labelPositions.forEach((label) => {
      ctx.fillStyle = label.seriesItem.color;
      ctx.fillText(label.text, label.x, clamp(label.y + 4, padding.top + 8, height - padding.bottom - 6));
    });

    canvas._safetyPoints = interactivePoints;
    bindInteractions(canvas, tooltip);
    hideTooltip(canvas, tooltip);
  }

  // Initial draw
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawChart);
  } else {
    drawChart();
  }

  // Redraw on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawChart, 200);
  });
})();
