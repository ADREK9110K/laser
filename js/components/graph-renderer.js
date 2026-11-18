/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * High-Precision Scientific Graph Engine (Canvas-based)
 */

class ScientificGraph {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.title = options.title || "Experimental Measurement";
    this.xLabel = options.xLabel || "X Axis";
    this.yLabel = options.yLabel || "Y Axis";
    this.xUnit = options.xUnit || "";
    this.yUnit = options.yUnit || "";
    
    this.datasets = []; // Array of { name, color, data: [{x, y}], strokeWidth, isDashed }
    this.padding = { top: 35, right: 25, bottom: 45, left: 55 };
    
    this.hoverPos = null;
    this.initEvents();
    this.resize();
  }

  initEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hoverPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPos = null;
      this.render();
    });

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const w = parent.clientWidth || 480;
      const h = parent.clientHeight || 260;
      this.canvas.width = Math.max(300, w);
      this.canvas.height = Math.max(200, h);
      this.render();
    }
  }

  setLabels(title, xLabel, yLabel, xUnit = "", yUnit = "") {
    this.title = title;
    this.xLabel = xLabel;
    this.yLabel = yLabel;
    this.xUnit = xUnit;
    this.yUnit = yUnit;
    this.render();
  }

  setData(datasets) {
    this.datasets = datasets;
    this.render();
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const p = this.padding;

    // Clear background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, w, h);

    const plotW = w - p.left - p.right;
    const plotH = h - p.top - p.bottom;

    if (plotW <= 0 || plotH <= 0) return;

    // Determine data ranges
    let xMin = Infinity, xMax = -Infinity;
    let yMin = Infinity, yMax = -Infinity;

    for (const ds of this.datasets) {
      for (const pt of ds.data) {
        if (pt.x < xMin) xMin = pt.x;
        if (pt.x > xMax) xMax = pt.x;
        if (pt.y < yMin) yMin = pt.y;
        if (pt.y > yMax) yMax = pt.y;
      }
    }

    if (xMin === Infinity) {
      xMin = 0; xMax = 10;
      yMin = 0; yMax = 1;
    }

    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    if (yMin === yMax) { yMin = Math.min(0, yMin - 1); yMax += 1; }
    if (yMin > 0) yMin = 0; // Default zero baseline for intensity

    // Margin buffer for Y axis
    const yRange = yMax - yMin;
    yMax += yRange * 0.08;

    // Coordinate mapping functions
    const mapX = (x) => p.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const mapY = (y) => p.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
    const unmapX = (px) => xMin + ((px - p.left) / plotW) * (xMax - xMin);
    const unmapY = (py) => yMin + ((p.top + plotH - py) / plotH) * (yMax - yMin);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;

    // X Grid
    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const val = xMin + (i / xTicks) * (xMax - xMin);
      const px = mapX(val);
      ctx.beginPath();
      ctx.moveTo(px, p.top);
      ctx.lineTo(px, p.top + plotH);
      ctx.stroke();

      // Tick label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(val.toFixed(Math.abs(xMax - xMin) < 5 ? 2 : 1), px, p.top + plotH + 16);
    }

    // Y Grid
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = yMin + (i / yTicks) * (yMax - yMin);
      const py = mapY(val);
      ctx.beginPath();
      ctx.moveTo(p.left, py);
      ctx.lineTo(p.left + plotW, py);
      ctx.stroke();

      // Tick label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(Math.abs(yMax - yMin) < 2 ? 2 : 1), p.left - 8, py + 4);
    }

    // Draw Axes
    ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.left, p.top);
    ctx.lineTo(p.left, p.top + plotH);
    ctx.lineTo(p.left + plotW, p.top + plotH);
    ctx.stroke();

    // Title
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 13px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(this.title, p.left + plotW / 2, 20);

    // Axis Labels
    ctx.fillStyle = "#38bdf8";
    ctx.font = "11px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${this.xLabel} ${this.xUnit ? '(' + this.xUnit + ')' : ''}`, p.left + plotW / 2, h - 8);

    ctx.save();
    ctx.translate(16, p.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${this.yLabel} ${this.yUnit ? '(' + this.yUnit + ')' : ''}`, 0, 0);
    ctx.restore();

    // Plot Datasets
    for (const ds of this.datasets) {
      if (!ds.data || ds.data.length === 0) continue;

      ctx.save();
      ctx.beginPath();
      ctx.rect(p.left, p.top, plotW, plotH);
      ctx.clip(); // Keep lines inside plot area

      ctx.strokeStyle = ds.color || "#00d4ff";
      ctx.lineWidth = ds.strokeWidth || 2;
      if (ds.isDashed) {
        ctx.setLineDash([5, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      for (let i = 0; i < ds.data.length; i++) {
        const px = mapX(ds.data[i].x);
        const py = mapY(ds.data[i].y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Soft glow fill for first dataset
      if (!ds.isDashed && ds.data.length > 2) {
        ctx.lineTo(mapX(ds.data[ds.data.length - 1].x), p.top + plotH);
        ctx.lineTo(mapX(ds.data[0].x), p.top + plotH);
        ctx.closePath();
        ctx.fillStyle = ds.color ? ds.color + "15" : "rgba(0, 212, 255, 0.08)";
        ctx.fill();
      }

      ctx.restore();
    }

    // Legend
    let legX = p.left + 15;
    const legY = p.top + 18;
    for (const ds of this.datasets) {
      ctx.fillStyle = ds.color || "#00d4ff";
      ctx.fillRect(legX, legY - 8, 12, 3);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px 'Cairo', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(ds.name, legX + 16, legY - 5);
      legX += ctx.measureText(ds.name).width + 30;
    }

    // Hover Cursor Inspection
    if (this.hoverPos) {
      const hx = this.hoverPos.x;
      const hy = this.hoverPos.y;

      if (hx >= p.left && hx <= p.left + plotW && hy >= p.top && hy <= p.top + plotH) {
        const valX = unmapX(hx);
        const valY = unmapY(hy);

        // Crosshairs
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(hx, p.top);
        ctx.lineTo(hx, p.top + plotH);
        ctx.moveTo(p.left, hy);
        ctx.lineTo(p.left + plotW, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Tooltip box
        const tooltipText = `X: ${valX.toFixed(2)} ${this.xUnit} | Y: ${valY.toFixed(3)} ${this.yUnit}`;
        ctx.font = "11px 'JetBrains Mono', monospace";
        const tw = ctx.measureText(tooltipText).width + 16;
        const tx = Math.min(w - tw - 10, Math.max(10, hx + 10));
        const ty = Math.max(p.top + 10, hy - 25);

        ctx.fillStyle = "rgba(11, 22, 44, 0.95)";
        ctx.strokeStyle = "rgba(0, 212, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.fillRect(tx, ty, tw, 22);
        ctx.strokeRect(tx, ty, tw, 22);

        ctx.fillStyle = "#38bdf8";
        ctx.textAlign = "left";
        ctx.fillText(tooltipText, tx + 8, ty + 15);
      }
    }
  }

  // Export current plot as CSV string
  exportCSV() {
    if (this.datasets.length === 0) return "";
    let csv = `${this.xLabel} (${this.xUnit})`;
    for (const ds of this.datasets) {
      csv += `,${ds.name} (${this.yUnit})`;
    }
    csv += "\n";

    const baseData = this.datasets[0].data;
    for (let i = 0; i < baseData.length; i++) {
      const rowX = baseData[i].x;
      let row = `${rowX}`;
      for (const ds of this.datasets) {
        const pt = ds.data[i];
        row += `,${pt ? pt.y.toFixed(5) : 0}`;
      }
      csv += row + "\n";
    }
    return csv;
  }
}

window.ScientificGraph = ScientificGraph;
