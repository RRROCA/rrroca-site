/**
 * RRROCA Safety Dashboard
 * Renders crime trend chart using Canvas API (no dependencies).
 * Data sourced from Calgary Open Data & CPS.
 */

(function() {
  'use strict';

  // Quarterly crime data for Rocky Ridge + Royal Oak combined
  // Source: mycalgary.com/crime-statistics + Calgary Open Data
  const crimeData = {
    labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    rockyRidge: [4, 5, 6, 4, 3, 4, 5, 3],
    royalOak:   [5, 4, 6, 5, 3, 3, 5, 4],
    calgaryAvg: [18, 22, 25, 20, 17, 21, 24, 19]
  };

  function drawChart() {
    const canvas = document.getElementById('safety-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 250;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 20, bottom: 40, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Max value for scale
    const maxVal = 30;

    // Grid lines
    ctx.strokeStyle = '#e8e4df';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = '#718096';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 5) * i), padding.left - 8, y + 4);
    }

    // X-axis labels
    ctx.fillStyle = '#718096';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const step = chartW / (crimeData.labels.length - 1);
    crimeData.labels.forEach((label, i) => {
      const x = padding.left + step * i;
      ctx.fillText(label, x, height - 8);
    });

    // Draw line function
    function drawLine(data, color, dashed) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 2.5;
      if (dashed) ctx.setLineDash([5, 5]);
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
        ctx.beginPath();
        ctx.arc(x, y, dashed ? 2.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      });
    }

    // Draw Calgary average (dashed, muted)
    drawLine(crimeData.calgaryAvg, '#c0392b88', true);

    // Draw Rocky Ridge (teal)
    drawLine(crimeData.rockyRidge, '#2c6e8a', false);

    // Draw Royal Oak (meadow green)
    drawLine(crimeData.royalOak, '#4a8c5c', false);

    // Legend
    const legendY = 12;
    const legendItems = [
      { label: 'Rocky Ridge', color: '#2c6e8a', dashed: false },
      { label: 'Royal Oak', color: '#4a8c5c', dashed: false },
      { label: 'Calgary Avg', color: '#c0392b88', dashed: true }
    ];
    ctx.font = '12px Inter, sans-serif';
    let legendX = padding.left;
    legendItems.forEach(item => {
      // Line sample
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      if (item.dashed) ctx.setLineDash([4, 4]);
      else ctx.setLineDash([]);
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 20, legendY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#4a5568';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legendX + 25, legendY + 4);
      legendX += ctx.measureText(item.label).width + 45;
    });
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
