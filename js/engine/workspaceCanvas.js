/**
 * LASER SCIENCE & TECHNOLOGY - WORKSPACE CANVAS CONTROLLER
 * High-performance 2D CAD optical breadboard with pan, zoom, component dragging,
 * rotation gizmos, scaling handles, snapping, alignment guides, and live ray rendering.
 * University of Technology - Iraq | College of Laser Science and Technology
 */

(function (window) {
  'use strict';

  const {
    degToRad,
    radToDeg,
    globalToLocal,
    vec,
    getPrismVertices,
  } = window.OpticalGeometry;

  class WorkspaceCanvas {
    constructor(canvasElement, options = {}) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');

      // State
      this.components = [];
      this.rays = [];
      this.selectedComponent = null;

      // Settings
      this.settings = Object.assign({
        showGrid: true,
        snapToGrid: false,
        gridSpacing: 25,
        maxRayDepth: 8,
        showFocalPoints: true,
        showNormalLines: false,
        showAngles: false,
        laserRayDensity: 4,
        isDarkMode: true,
      }, options.settings || {});

      // Pan & Zoom
      this.pan = { x: 120, y: 80 };
      this.zoom = 0.95;

      // Interaction
      this.dragMode = 'none'; // 'none', 'drag-body', 'rotate', 'resize', 'pan'
      this.dragStartMouse = { x: 0, y: 0 };
      this.dragOffset = { x: 0, y: 0 };
      this.snapThreshold = 20;

      // Callbacks
      this.onSelectComponent = options.onSelectComponent || (() => {});
      this.onUpdateComponent = options.onUpdateComponent || (() => {});
      this.onUndoSave = options.onUndoSave || (() => {});
      this.onPointerCoords = options.onPointerCoords || (() => {});

      // Pulse animation frame
      this.pulseTick = 0;
      this.initEvents();
      this.startAnimationLoop();
    }

    setComponents(comps) {
      this.components = comps;
      this.recalculateRays();
      this.render();
    }

    fitToView(padding = 80) {
      if (!this.components || this.components.length === 0) {
        this.pan = { x: 100, y: 80 };
        this.zoom = 0.95;
        this.render();
        return;
      }
      const rect = this.canvas.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      this.components.forEach(comp => {
        if (!comp.position) return;
        const r = this.getGizmoRadius(comp) || 50;
        minX = Math.min(minX, comp.position.x - r);
        maxX = Math.max(maxX, comp.position.x + r);
        minY = Math.min(minY, comp.position.y - r);
        maxY = Math.max(maxY, comp.position.y + r);
      });

      if (this.rays && this.rays.length > 0) {
        this.rays.forEach(r => {
          if (r.p1 && r.p2) {
            minX = Math.min(minX, r.p1.x, r.p2.x);
            maxX = Math.max(maxX, r.p1.x, r.p2.x);
            minY = Math.min(minY, r.p1.y, r.p2.y);
            maxY = Math.max(maxY, r.p1.y, r.p2.y);
          }
        });
      }

      minX = Math.max(-500, minX);
      maxX = Math.min(2500, maxX);
      minY = Math.max(-500, minY);
      maxY = Math.min(2000, maxY);

      const contentW = Math.max(150, maxX - minX);
      const contentH = Math.max(150, maxY - minY);
      const availW = Math.max(200, rect.width - padding * 2);
      const availH = Math.max(200, rect.height - padding * 2);

      let targetZoom = Math.min(availW / contentW, availH / contentH);
      targetZoom = Math.max(0.55, Math.min(1.2, targetZoom));

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      this.zoom = targetZoom;
      this.pan = {
        x: rect.width / 2 - centerX * this.zoom,
        y: rect.height / 2 - centerY * this.zoom,
      };
      this.render();
    }

    setSettings(newSettings) {
      this.settings = Object.assign(this.settings, newSettings);
      this.recalculateRays();
      this.render();
    }

    setSelectedComponent(comp) {
      this.selectedComponent = comp;
      this.render();
    }

    recalculateRays() {
      if (window.OpticalRayTracer) {
        this.rays = window.OpticalRayTracer.traceRays(this.components, this.settings);
      }
    }

    screenToWorld(screenX, screenY) {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: (screenX - rect.left - this.pan.x) / this.zoom,
        y: (screenY - rect.top - this.pan.y) / this.zoom,
      };
    }

    snapValue(val, spacing) {
      return Math.round(val / spacing) * spacing;
    }

    getGizmoRadius(comp) {
      let R = 45;
      if (comp.type === 'mirror') R = (comp.width || 120) / 2 + 15;
      else if (comp.type === 'lens') R = (comp.diameter || 80) / 2 + 15;
      else if (comp.type === 'grating') R = (comp.width || 120) / 2 + 15;
      else if (comp.type === 'medium') R = Math.max(comp.width || 150, comp.height || 100) / 2 + 15;
      else if (comp.type === 'prism') R = (comp.size || 100) / 2 + 20;
      else if (comp.type === 'ruler') R = 35;
      else if (comp.type === 'protractor') R = (comp.radius || 100) + 15;
      else if (comp.type === 'single_slit' || comp.type === 'double_slit' || comp.type === 'aperture') R = (comp.width || 120) / 2 + 15;
      else if (comp.type === 'detector' || comp.type === 'screen') R = (comp.width || 80) / 2 + 15;
      else if (comp.type === 'fiber') R = (comp.length || 240) / 2 + 15;
      return R;
    }

    render() {
      const { canvas, ctx, settings, pan, zoom, components, rays, selectedComponent, dragMode } = this;
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Colors matching Blender Dark Theme
      const isDark = settings.isDarkMode;
      const bgApp = isDark ? '#181818' : '#f8fafc';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
      const textColor = isDark ? '#8c8c8c' : '#475569';
      const selectionColor = isDark ? '#5680a6' : '#2563eb';
      const accentColor = '#f08833';

      // Background
      ctx.fillStyle = bgApp;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Grid
      if (settings.showGrid) {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1 / zoom;

        const spacing = settings.gridSpacing || 25;
        const left = -pan.x / zoom;
        const top = -pan.y / zoom;
        const right = (rect.width - pan.x) / zoom;
        const bottom = (rect.height - pan.y) / zoom;

        const startX = Math.floor(left / spacing) * spacing;
        for (let x = startX; x < right; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, bottom);
          ctx.stroke();
        }

        const startY = Math.floor(top / spacing) * spacing;
        for (let y = startY; y < bottom; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        }
      }

      // 2. Alignment Guides when dragging
      if (dragMode === 'drag-body' && selectedComponent) {
        ctx.strokeStyle = 'rgba(240, 136, 51, 0.3)';
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(-10000, selectedComponent.position.y);
        ctx.lineTo(10000, selectedComponent.position.y);
        ctx.moveTo(selectedComponent.position.x, -10000);
        ctx.lineTo(selectedComponent.position.x, 10000);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Components
      components.forEach((comp) => {
        ctx.save();
        ctx.translate(comp.position.x, comp.position.y);
        ctx.rotate(degToRad(comp.rotation || 0));

        const isSelected = selectedComponent && selectedComponent.id === comp.id;

        // Laser
        if (comp.type === 'laser') {
          const w = comp.beamWidth || 16;
          ctx.fillStyle = isDark ? '#262626' : '#e2e8f0';
          ctx.strokeStyle = isSelected
            ? selectionColor
            : comp.isOn
            ? '#ef4444'
            : isDark ? '#525252' : '#94a3b8';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-22, -w / 2 - 6, 44, w + 12, 4);
          } else {
            ctx.rect(-22, -w / 2 - 6, 44, w + 12);
          }
          ctx.fill();
          ctx.stroke();

          // Front aperture
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(22, 0, w / 2 + 2, -Math.PI / 2, Math.PI / 2);
          ctx.fill();

          // Indicator LED
          ctx.fillStyle = comp.isOn ? '#ef4444' : '#64748b';
          ctx.beginPath();
          ctx.arc(-10, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // White Light
        else if (comp.type === 'white_light') {
          const w = comp.beamWidth || 20;
          ctx.fillStyle = isDark ? '#333333' : '#cbd5e1';
          ctx.strokeStyle = isSelected
            ? selectionColor
            : comp.isOn
            ? '#eab308'
            : isDark ? '#525252' : '#94a3b8';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.moveTo(-22, -10);
          ctx.lineTo(10, -10);
          ctx.lineTo(22, -w / 2 - 4);
          ctx.lineTo(22, w / 2 + 4);
          ctx.lineTo(10, 10);
          ctx.lineTo(-22, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = comp.isOn ? '#fef08a' : '#64748b';
          ctx.beginPath();
          ctx.arc(22, 0, w / 2 + 2, -Math.PI / 2, Math.PI / 2);
          ctx.fill();

          ctx.fillStyle = comp.isOn ? '#eab308' : '#475569';
          ctx.beginPath();
          ctx.arc(-12, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Mirrors
        else if (comp.type === 'mirror') {
          const W = comp.width || 120;
          ctx.strokeStyle = isDark ? '#f1f5f9' : '#1e293b';
          ctx.lineWidth = isSelected ? 3 : 2;

          if (comp.mirrorType === 'plane' || comp.mirrorType === 'partial') {
            ctx.beginPath();
            ctx.moveTo(-W / 2, 0);
            ctx.lineTo(W / 2, 0);
            ctx.stroke();

            // Hash lines on backside
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            const step = 8;
            for (let x = -W / 2; x <= W / 2; x += step) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x - 3, 5);
              ctx.stroke();
            }

            if (comp.mirrorType === 'partial') {
              ctx.fillStyle = textColor;
              ctx.font = '10px monospace';
              const R_perc = Math.round((comp.reflectivity !== undefined ? comp.reflectivity : 0.5) * 100);
              ctx.fillText(`BS ${R_perc}%`, -18, -10);
            }
          } else if (comp.mirrorType === 'concave') {
            const R = Math.max(10, Math.abs(comp.focalLength || 120) * 2);
            const thetaSpan = Math.asin(Math.min(0.99, W / (2 * R)));

            ctx.beginPath();
            ctx.arc(0, R, R, Math.PI * 1.5 - thetaSpan, Math.PI * 1.5 + thetaSpan);
            ctx.stroke();

            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            const count = 12;
            for (let i = 0; i <= count; i++) {
              const a = Math.PI * 1.5 - thetaSpan + (thetaSpan * 2 * i) / count;
              const px = R * Math.cos(a);
              const py = R * Math.sin(a) + R;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + 4 * Math.cos(a), py + 4 * Math.sin(a));
              ctx.stroke();
            }
          } else if (comp.mirrorType === 'convex') {
            const R = Math.max(10, Math.abs(comp.focalLength || 120) * 2);
            const thetaSpan = Math.asin(Math.min(0.99, W / (2 * R)));

            ctx.beginPath();
            ctx.arc(0, -R, R, Math.PI * 0.5 - thetaSpan, Math.PI * 0.5 + thetaSpan);
            ctx.stroke();

            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            const count = 12;
            for (let i = 0; i <= count; i++) {
              const a = Math.PI * 0.5 - thetaSpan + (thetaSpan * 2 * i) / count;
              const px = R * Math.cos(a);
              const py = R * Math.sin(a) - R;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px - 4 * Math.cos(a), py - 4 * Math.sin(a));
              ctx.stroke();
            }
          }
        }
        // Lenses
        else if (comp.type === 'lens') {
          const D = comp.diameter || 80;
          const T = comp.thickness || 16;
          const f = comp.focalLength || 150;
          const n = comp.refractiveIndex || 1.52;

          ctx.fillStyle = isDark ? 'rgba(86, 128, 166, 0.15)' : 'rgba(37, 99, 235, 0.1)';
          ctx.strokeStyle = isSelected ? selectionColor : isDark ? '#fbbf24' : '#d97706';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          const R = Math.max(D / 2 + 5, 2 * (n - 1) * Math.abs(f));
          const thetaSpan = Math.asin(Math.min(0.99, D / (2 * R)));

          ctx.beginPath();
          if (comp.lensType === 'convex' || comp.lensType === 'cylindrical') {
            const C_L = { x: R - T / 2, y: 0 };
            const C_R = { x: -R + T / 2, y: 0 };
            ctx.arc(C_L.x, C_L.y, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            ctx.arc(C_R.x, C_R.y, R, -thetaSpan, thetaSpan);
          } else if (comp.lensType === 'concave') {
            const C_L = { x: -R - T / 2, y: 0 };
            const C_R = { x: R + T / 2, y: 0 };
            ctx.arc(C_L.x, C_L.y, R, -thetaSpan, thetaSpan);
            ctx.lineTo(T / 2, D / 2);
            ctx.arc(C_R.x, C_R.y, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            ctx.lineTo(-T / 2, -D / 2);
          } else if (comp.lensType === 'plano-convex') {
            const C_R = { x: T / 2 - R, y: 0 };
            ctx.moveTo(-T / 2, -D / 2);
            ctx.lineTo(-T / 2, D / 2);
            ctx.arc(C_R.x, C_R.y, R, -thetaSpan, thetaSpan);
          } else if (comp.lensType === 'plano-concave') {
            const C_R = { x: T / 2 + R, y: 0 };
            ctx.moveTo(-T / 2, -D / 2);
            ctx.lineTo(-T / 2, D / 2);
            ctx.lineTo(T / 2, D / 2);
            ctx.arc(C_R.x, C_R.y, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            ctx.lineTo(-T / 2, -D / 2);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          if (comp.lensType === 'cylindrical') {
            ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-T / 2 + 2, -D / 3);
            ctx.lineTo(-T / 2 + 2, D / 3);
            ctx.moveTo(T / 2 - 2, -D / 3);
            ctx.lineTo(T / 2 - 2, D / 3);
            ctx.stroke();
          }
        }
        // Diffraction Grating
        else if (comp.type === 'grating') {
          const W = comp.width || 120;
          ctx.strokeStyle = isSelected ? selectionColor : isDark ? '#ec4899' : '#db2777';
          ctx.lineWidth = isSelected ? 3.5 : 2.5;

          ctx.beginPath();
          ctx.moveTo(-W / 2, 0);
          ctx.lineTo(W / 2, 0);
          ctx.stroke();

          ctx.lineWidth = 1;
          ctx.strokeStyle = isDark ? 'rgba(236, 72, 153, 0.4)' : 'rgba(219, 39, 119, 0.4)';
          const density = 12;
          for (let x = -W / 2; x <= W / 2; x += W / density) {
            ctx.beginPath();
            ctx.moveTo(x, -5);
            ctx.lineTo(x, 5);
            ctx.stroke();
          }

          ctx.fillStyle = textColor;
          ctx.font = '9px monospace';
          ctx.fillText(`${comp.gratingDensity || 600} L/mm`, -20, -8);
        }
        // Medium
        else if (comp.type === 'medium') {
          const W = comp.width || 150;
          const H = comp.height || 100;

          ctx.fillStyle = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.06)';
          ctx.strokeStyle = isSelected ? selectionColor : isDark ? '#10b981' : '#059669';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.rect(-W / 2, -H / 2, W, H);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.font = '10px monospace';
          ctx.fillText(`n = ${(comp.refractiveIndex || 1.5).toFixed(2)}`, -W / 2 + 8, -H / 2 + 15);
          if (comp.absorptionCoefficient > 0) {
            ctx.fillText(`α = ${comp.absorptionCoefficient.toFixed(3)}`, -W / 2 + 8, -H / 2 + 28);
          }
        }
        // Prism
        else if (comp.type === 'prism') {
          const vertices = getPrismVertices(comp.prismType || 'triangular', comp.size || 100);

          ctx.fillStyle = isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)';
          ctx.strokeStyle = isSelected ? selectionColor : isDark ? '#a855f7' : '#7c3aed';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.font = '10px monospace';
          ctx.fillText(`n=${(comp.refractiveIndex || 1.62).toFixed(2)}`, -14, 6);
        }
        // Ruler
        else if (comp.type === 'ruler') {
          const L = comp.length || 200;
          ctx.fillStyle = isDark ? 'rgba(251, 113, 133, 0.12)' : 'rgba(244, 63, 94, 0.08)';
          ctx.strokeStyle = isSelected ? selectionColor : '#fb7185';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.rect(0, -10, L, 20);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#fb7185';
          ctx.fillStyle = textColor;
          ctx.font = '9px monospace';
          ctx.lineWidth = 1;

          const scalePx = 40;
          for (let px = 0; px <= L; px += 10) {
            const isCm = px % scalePx === 0;
            const isHalf = px % (scalePx / 2) === 0;
            const tickH = isCm ? 8 : isHalf ? 6 : 4;

            ctx.beginPath();
            ctx.moveTo(px, -10);
            ctx.lineTo(px, -10 + tickH);
            ctx.stroke();

            if (isCm) {
              ctx.fillText(`${px / scalePx}cm`, px - 4, 8);
            }
          }
        }
        // Protractor
        else if (comp.type === 'protractor') {
          const R = comp.radius || 100;
          ctx.fillStyle = isDark ? 'rgba(251, 113, 133, 0.06)' : 'rgba(244, 63, 94, 0.04)';
          ctx.strokeStyle = isSelected ? selectionColor : '#f43f5e';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.arc(0, 0, R, Math.PI, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.3)';
          ctx.lineWidth = 1;
          ctx.fillStyle = textColor;
          ctx.font = '8px monospace';

          for (let deg = 0; deg <= 180; deg += 5) {
            const rad = degToRad(180 - deg);
            const is10 = deg % 10 === 0;
            const lenTick = is10 ? 10 : 5;

            const x1 = R * Math.cos(rad);
            const y1 = -R * Math.sin(rad);
            const x2 = (R - lenTick) * Math.cos(rad);
            const y2 = -(R - lenTick) * Math.sin(rad);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            if (is10) {
              const tx = (R - 16) * Math.cos(rad);
              const ty = -(R - 16) * Math.sin(rad);
              ctx.save();
              ctx.translate(tx, ty);
              ctx.rotate(rad - Math.PI / 2);
              ctx.fillText(`${deg}°`, -6, 3);
              ctx.restore();
            }
          }

          // Center cross mark
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-6, 0);
          ctx.lineTo(6, 0);
          ctx.moveTo(0, -6);
          ctx.lineTo(0, 2);
          ctx.stroke();

          if (comp.attachedLaserId) {
            const attachedLaser = components.find((c) => c.id === comp.attachedLaserId);
            if (attachedLaser) {
              const relativeAngle = (attachedLaser.rotation - comp.rotation + 360) % 360;
              ctx.fillStyle = accentColor;
              ctx.font = 'bold 11px monospace';
              ctx.fillText(`θ: ${relativeAngle.toFixed(1)}°`, -25, -20);
            }
          }
        }
        // Single Slit
        else if (comp.type === 'single_slit') {
          const W = comp.width || 120;
          const a = comp.slitWidth || 10;

          ctx.strokeStyle = isSelected ? selectionColor : '#ef4444';
          ctx.lineWidth = isSelected ? 3.5 : 2.5;

          ctx.beginPath();
          ctx.moveTo(-W / 2, 0);
          ctx.lineTo(-a / 2, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(a / 2, 0);
          ctx.lineTo(W / 2, 0);
          ctx.stroke();
        }
        // Double Slit
        else if (comp.type === 'double_slit') {
          const W = comp.width || 120;
          const a = comp.slitWidth || 6;
          const s = comp.slitSpacing || 24;

          ctx.strokeStyle = isSelected ? selectionColor : '#a855f7';
          ctx.lineWidth = isSelected ? 3.5 : 2.5;

          ctx.beginPath();
          ctx.moveTo(-W / 2, 0);
          ctx.lineTo(-s / 2 - a / 2, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-s / 2 + a / 2, 0);
          ctx.lineTo(s / 2 - a / 2, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(s / 2 + a / 2, 0);
          ctx.lineTo(W / 2, 0);
          ctx.stroke();
        }
        // Aperture
        else if (comp.type === 'aperture') {
          const W = comp.width || 120;
          const a = comp.slitWidth || 10;

          ctx.strokeStyle = isSelected ? selectionColor : '#06b6d4';
          ctx.lineWidth = isSelected ? 3.5 : 2.5;

          ctx.beginPath();
          ctx.moveTo(-W / 2, 0);
          ctx.lineTo(-a / 2, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(a / 2, 0);
          ctx.lineTo(W / 2, 0);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.beginPath();
          ctx.ellipse(0, 0, a / 2, a / 4, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        // Detector (Silicon Photodiode)
        else if (comp.type === 'detector') {
          const W = comp.width || 80;
          ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
          ctx.strokeStyle = isSelected ? selectionColor : '#38bdf8';
          ctx.lineWidth = isSelected ? 3 : 2;

          ctx.beginPath();
          ctx.rect(-W / 2, -10, W, 20);
          ctx.fill();
          ctx.stroke();

          // Sensor active window
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(-W / 2 + 4, -4, W - 8, 8);

          // Digital Power Readout
          const power = comp.detectedPower ? comp.detectedPower.toFixed(2) : '0.00';
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`${power} mW`, -W / 2 + 6, -14);
        }
        // Screen
        else if (comp.type === 'screen') {
          const W = comp.width || 150;
          ctx.fillStyle = isDark ? '#1f2937' : '#f1f5f9';
          ctx.strokeStyle = isSelected ? selectionColor : '#94a3b8';
          ctx.lineWidth = isSelected ? 3 : 2;

          ctx.beginPath();
          ctx.rect(-W / 2, -6, W, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = textColor;
          ctx.font = '9px monospace';
          ctx.fillText('SCREEN', -18, -10);

          // Draw hit spots if illuminated
          if (comp.hitPositions && comp.hitPositions.length > 0) {
            comp.hitPositions.forEach((h) => {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(h.pos, 0, 3, 0, Math.PI * 2);
              ctx.fill();
            });
          }
        }
        // Optical Fiber (الكيبل الضوئي)
        else if (comp.type === 'fiber') {
          const L = comp.length || 240;
          const dCore = comp.coreDiameter || 20;
          const dClad = comp.claddingDiameter || 40;
          const isGuiding = comp.isGuiding;

          // 1. Outer Protective Jacket (amber/orange fiber cable)
          ctx.fillStyle = isDark ? '#261b0c' : '#fef3c7';
          ctx.strokeStyle = isSelected ? selectionColor : '#f59e0b';
          ctx.lineWidth = isSelected ? 3 : 2;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-L / 2, -dClad / 2, L, dClad, 6);
          } else {
            ctx.rect(-L / 2, -dClad / 2, L, dClad);
          }
          ctx.fill();
          ctx.stroke();

          // 2. Silica Cladding layer
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(-L / 2 + 15, -dClad / 2 + 5, L - 30, dClad - 10);
          ctx.setLineDash([]);

          // 3. Inner Core Light-Pipe
          ctx.fillStyle = isGuiding ? '#22c55e' : isDark ? '#1e293b' : '#e2e8f0';
          ctx.strokeStyle = isGuiding ? '#4ade80' : 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-L / 2, -dCore / 2, L, dCore);
          ctx.strokeRect(-L / 2, -dCore / 2, L, dCore);

          // 4. Input & Output Metallic Ferrules (FC/PC connectors)
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-L / 2 - 12, -dClad / 2 - 2, 12, dClad + 4);
          ctx.strokeRect(-L / 2 - 12, -dClad / 2 - 2, 12, dClad + 4);
          ctx.fillRect(L / 2, -dClad / 2 - 2, 12, dClad + 4);
          ctx.strokeRect(L / 2, -dClad / 2 - 2, 12, dClad + 4);

          // Aperture indicator dot on input
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(-L / 2 - 12, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          // Label
          const n1 = comp.coreIndex || 1.50;
          const n2 = comp.claddingIndex || 1.45;
          const NA = Math.sqrt(Math.max(0, n1 * n1 - n2 * n2)).toFixed(2);
          ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`FIBER NA:${NA}`, -L / 2 + 25, -dClad / 2 - 8);
          if (isGuiding) {
            ctx.fillStyle = '#22c55e';
            ctx.font = 'bold 9px monospace';
            ctx.fillText('GUIDED TIR', L / 2 - 70, -dClad / 2 - 8);
          }
        }

        ctx.restore();
      });

      // 4. Focal Points (if enabled)
      if (settings.showFocalPoints) {
        components.forEach((comp) => {
          if (comp.type === 'lens') {
            const f = comp.focalLength || 150;
            const dir = { x: Math.cos(degToRad(comp.rotation || 0)), y: Math.sin(degToRad(comp.rotation || 0)) };
            const f1 = vec.add(comp.position, vec.scale(dir, f));
            const f2 = vec.sub(comp.position, vec.scale(dir, f));

            ctx.fillStyle = '#f59e0b';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1;
            ctx.font = 'bold 9px monospace';

            ctx.beginPath();
            ctx.moveTo(f1.x - 4, f1.y); ctx.lineTo(f1.x + 4, f1.y);
            ctx.moveTo(f1.x, f1.y - 4); ctx.lineTo(f1.x, f1.y + 4);
            ctx.stroke();
            ctx.fillText('F', f1.x + 5, f1.y + 3);

            ctx.beginPath();
            ctx.moveTo(f2.x - 4, f2.y); ctx.lineTo(f2.x + 4, f2.y);
            ctx.moveTo(f2.x, f2.y - 4); ctx.lineTo(f2.x, f2.y + 4);
            ctx.stroke();
            ctx.fillText('F', f2.x + 5, f2.y + 3);
          }
        });
      }

      // 5. Draw Rays
      rays.forEach((ray) => {
        if (!ray.path || ray.path.length < 2) return;

        ctx.strokeStyle = ray.color;
        ctx.lineWidth = Math.max(1.2, 2.5 * (ray.intensity || 1));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(ray.path[0].x, ray.path[0].y);
        for (let i = 1; i < ray.path.length; i++) {
          ctx.lineTo(ray.path[i].x, ray.path[i].y);
        }
        ctx.stroke();

        if (settings.showAngles && ray.path.length > 2) {
          ctx.fillStyle = textColor;
          ctx.font = '9px monospace';
          for (let i = 1; i < ray.path.length - 1; i++) {
            const pt = ray.path[i];
            ctx.fillText(`${Math.round(ray.wavelength)}nm`, pt.x + 4, pt.y - 4);
          }
        }
      });

      // 6. Selection Gizmo & Handles
      if (selectedComponent) {
        const comp = selectedComponent;
        const R_giz = this.getGizmoRadius(comp);
        const rotRad = degToRad(comp.rotation || 0);

        ctx.save();
        ctx.translate(comp.position.x, comp.position.y);

        // Dashed circle
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1 / zoom;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(0, 0, R_giz, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Rotation Handle (orange node)
        const rotNodeX = R_giz * Math.cos(rotRad);
        const rotNodeY = R_giz * Math.sin(rotRad);

        ctx.fillStyle = accentColor;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rotNodeX, rotNodeY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Connecting arm
        ctx.strokeStyle = 'rgba(240, 136, 51, 0.4)';
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(rotNodeX, rotNodeY);
        ctx.stroke();

        // Scaling Handle (blue square node at +90 deg)
        const scaleNodeX = R_giz * Math.cos(rotRad + Math.PI / 2);
        const scaleNodeY = R_giz * Math.sin(rotRad + Math.PI / 2);

        ctx.fillStyle = selectionColor;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(scaleNodeX - 4, scaleNodeY - 4, 8, 8);
        ctx.fill();
        ctx.stroke();

        // Degree label
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${Math.round(comp.rotation || 0)}°`, rotNodeX + 8, rotNodeY + 3);

        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    }

    startAnimationLoop() {
      const loop = () => {
        this.pulseTick++;
        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    initEvents() {
      const canvas = this.canvas;

      canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      window.addEventListener('mouseup', () => this.handleMouseUp());
      canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

      // Drag over / drop
      canvas.addEventListener('dragover', (e) => e.preventDefault());
      canvas.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleMouseDown(e) {
      const mouseWorld = this.screenToWorld(e.clientX, e.clientY);
      const isMiddleOrShift = e.button === 1 || (e.button === 0 && e.shiftKey) || e.button === 2;

      if (isMiddleOrShift) {
        this.dragMode = 'pan';
        this.dragStartMouse = { x: e.clientX, y: e.clientY };
        this.dragOffset = { ...this.pan };
        return;
      }

      if (this.selectedComponent) {
        const comp = this.selectedComponent;
        const R_giz = this.getGizmoRadius(comp);
        const rotRad = degToRad(comp.rotation || 0);

        const rotNodeWorld = {
          x: comp.position.x + R_giz * Math.cos(rotRad),
          y: comp.position.y + R_giz * Math.sin(rotRad),
        };

        if (vec.dist(mouseWorld, rotNodeWorld) < 12) {
          this.dragMode = 'rotate';
          this.dragStartMouse = mouseWorld;
          return;
        }

        const scaleNodeWorld = {
          x: comp.position.x + R_giz * Math.cos(rotRad + Math.PI / 2),
          y: comp.position.y + R_giz * Math.sin(rotRad + Math.PI / 2),
        };

        if (vec.dist(mouseWorld, scaleNodeWorld) < 12) {
          this.dragMode = 'resize';
          this.dragStartMouse = mouseWorld;
          return;
        }
      }

      // Check hit on components
      let clickedComp = null;
      for (let i = this.components.length - 1; i >= 0; i--) {
        const comp = this.components[i];
        const localMouse = globalToLocal(mouseWorld, comp.position, comp.rotation || 0);

        let hit = false;
        if (comp.type === 'laser' || comp.type === 'white_light') {
          const w = comp.beamWidth || 20;
          hit = localMouse.x >= -25 && localMouse.x <= 25 && localMouse.y >= -w / 2 - 8 && localMouse.y <= w / 2 + 8;
        } else if (comp.type === 'mirror' || comp.type === 'grating' || comp.type === 'single_slit' || comp.type === 'double_slit' || comp.type === 'aperture') {
          const W = comp.width || 120;
          hit = Math.abs(localMouse.y) <= 10 && localMouse.x >= -W / 2 && localMouse.x <= W / 2;
        } else if (comp.type === 'lens') {
          const D = comp.diameter || 80;
          const T = comp.thickness || 16;
          hit = Math.abs(localMouse.x) <= T / 2 + 6 && localMouse.y >= -D / 2 && localMouse.y <= D / 2;
        } else if (comp.type === 'medium') {
          const W = comp.width || 150;
          const H = comp.height || 100;
          hit = localMouse.x >= -W / 2 && localMouse.x <= W / 2 && localMouse.y >= -H / 2 && localMouse.y <= H / 2;
        } else if (comp.type === 'prism') {
          const S = comp.size || 100;
          hit = Math.abs(localMouse.x) <= S / 2 && Math.abs(localMouse.y) <= S / 2;
        } else if (comp.type === 'ruler') {
          const L = comp.length || 200;
          hit = localMouse.x >= 0 && localMouse.x <= L && Math.abs(localMouse.y) <= 14;
        } else if (comp.type === 'protractor') {
          const R = comp.radius || 100;
          hit = vec.len(localMouse) <= R && localMouse.y <= 2;
        } else if (comp.type === 'detector' || comp.type === 'screen') {
          const W = comp.width || 80;
          hit = Math.abs(localMouse.x) <= W / 2 && Math.abs(localMouse.y) <= 14;
        } else if (comp.type === 'fiber') {
          const L = comp.length || 240;
          const D = comp.claddingDiameter || 40;
          hit = Math.abs(localMouse.x) <= L / 2 + 14 && Math.abs(localMouse.y) <= D / 2 + 5;
        }

        if (hit) {
          clickedComp = comp;
          break;
        }
      }

      if (clickedComp) {
        this.selectedComponent = clickedComp;
        this.onSelectComponent(clickedComp);
        this.dragMode = 'drag-body';
        this.dragStartMouse = mouseWorld;
        this.dragOffset = vec.sub(clickedComp.position, mouseWorld);
      } else {
        this.selectedComponent = null;
        this.onSelectComponent(null);
      }
      this.render();
    }

    handleMouseMove(e) {
      const mouseWorld = this.screenToWorld(e.clientX, e.clientY);
      this.onPointerCoords(mouseWorld);

      if (this.dragMode === 'pan') {
        const dx = e.clientX - this.dragStartMouse.x;
        const dy = e.clientY - this.dragStartMouse.y;
        this.pan = {
          x: this.dragOffset.x + dx,
          y: this.dragOffset.y + dy,
        };
        this.render();
        return;
      }

      if (!this.selectedComponent) return;

      if (this.dragMode === 'drag-body') {
        let nextPos = vec.add(mouseWorld, this.dragOffset);

        if (this.settings.snapToGrid) {
          nextPos = {
            x: this.snapValue(nextPos.x, this.settings.gridSpacing || 25),
            y: this.snapValue(nextPos.y, this.settings.gridSpacing || 25),
          };
        }

        // Snapping laser to protractor
        if (this.selectedComponent.type === 'laser') {
          this.components.forEach((c) => {
            if (c.type === 'protractor') {
              if (vec.dist(nextPos, c.position) < this.snapThreshold) {
                nextPos = { ...c.position };
                c.attachedLaserId = this.selectedComponent.id;
              } else if (c.attachedLaserId === this.selectedComponent.id) {
                c.attachedLaserId = null;
              }
            }
          });
        }

        if (this.selectedComponent.type === 'protractor' && this.selectedComponent.attachedLaserId) {
          const laser = this.components.find((c) => c.id === this.selectedComponent.attachedLaserId);
          if (laser) {
            const deltaPos = vec.sub(nextPos, this.selectedComponent.position);
            laser.position = vec.add(laser.position, deltaPos);
          }
        }

        this.selectedComponent.position = nextPos;
        this.onUpdateComponent(this.selectedComponent);
        this.recalculateRays();
        this.render();
      } else if (this.dragMode === 'rotate') {
        const dx = mouseWorld.x - this.selectedComponent.position.x;
        const dy = mouseWorld.y - this.selectedComponent.position.y;
        let angleDeg = Math.round(radToDeg(Math.atan2(dy, dx)));
        if (angleDeg < 0) angleDeg += 360;

        if (e.shiftKey) {
          angleDeg = this.snapValue(angleDeg, 15);
        }

        this.selectedComponent.rotation = angleDeg;
        this.onUpdateComponent(this.selectedComponent);
        this.recalculateRays();
        this.render();
      } else if (this.dragMode === 'resize') {
        const dist = vec.dist(mouseWorld, this.selectedComponent.position);
        const deltaDim = Math.round(dist * 2);

        if (this.selectedComponent.type === 'mirror' || this.selectedComponent.type === 'grating' ||
            this.selectedComponent.type === 'single_slit' || this.selectedComponent.type === 'double_slit' ||
            this.selectedComponent.type === 'aperture' || this.selectedComponent.type === 'detector' ||
            this.selectedComponent.type === 'screen') {
          this.selectedComponent.width = Math.max(30, Math.min(450, deltaDim));
        } else if (this.selectedComponent.type === 'lens') {
          this.selectedComponent.diameter = Math.max(25, Math.min(400, deltaDim));
        } else if (this.selectedComponent.type === 'medium') {
          this.selectedComponent.width = Math.max(30, Math.min(500, deltaDim));
        } else if (this.selectedComponent.type === 'prism') {
          this.selectedComponent.size = Math.max(30, Math.min(400, deltaDim));
        } else if (this.selectedComponent.type === 'protractor') {
          this.selectedComponent.radius = Math.max(40, Math.min(300, Math.round(dist)));
        }

        this.onUpdateComponent(this.selectedComponent);
        this.recalculateRays();
        this.render();
      }
    }

    handleMouseUp() {
      if (this.dragMode !== 'none') {
        this.onUndoSave();
      }
      this.dragMode = 'none';
    }

    handleWheel(e) {
      e.preventDefault();
      const zoomFactor = 1.08;
      const nextZoom = e.deltaY < 0 ? this.zoom * zoomFactor : this.zoom / zoomFactor;
      const clampedZoom = Math.max(0.2, Math.min(4.0, nextZoom));

      const rect = this.canvas.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const dx = cursorX - this.pan.x;
      const dy = cursorY - this.pan.y;

      this.pan = {
        x: cursorX - dx * (clampedZoom / this.zoom),
        y: cursorY - dy * (clampedZoom / this.zoom),
      };
      this.zoom = clampedZoom;
      this.render();
    }

    handleDrop(e) {
      e.preventDefault();
      const type = e.dataTransfer.getData('optical-type');
      const subType = e.dataTransfer.getData('optical-subtype') || '';
      if (!type) return;

      const mouseWorld = this.screenToWorld(e.clientX, e.clientY);
      const newComp = this.createComponent(type, subType, mouseWorld);
      this.components.push(newComp);
      this.selectedComponent = newComp;
      this.onSelectComponent(newComp);
      this.onUndoSave();
      this.recalculateRays();
      this.render();
    }

    createComponent(type, subType, position) {
      const id = `comp_${Math.random().toString(36).substring(2, 9)}`;
      const typeLabel = type.replace('_', ' ');
      const name = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} ${this.components.length + 1}`;

      switch (type) {
        case 'laser':
          return {
            id,
            type: 'laser',
            name,
            position,
            rotation: 0,
            wavelength: subType === 'violet' ? 405 : subType === 'red' ? 650 : subType === 'white' ? 0 : 532,
            power: 5,
            beamWidth: 16,
            beamDivergence: 0,
            polarization: 'none',
            operatingMode: 'cw',
            isOn: true,
          };
        case 'white_light':
          return {
            id,
            type: 'white_light',
            name,
            position,
            rotation: 0,
            wavelength: 0,
            power: 5,
            beamWidth: 20,
            beamDivergence: 15,
            isOn: true,
          };
        case 'mirror':
          return {
            id,
            type: 'mirror',
            name,
            position,
            rotation: 0,
            mirrorType: subType || 'plane',
            reflectivity: subType === 'partial' ? 0.5 : 1.0,
            focalLength: subType === 'concave' ? 120 : subType === 'convex' ? -120 : 0,
            width: 120,
          };
        case 'lens':
          return {
            id,
            type: 'lens',
            name,
            position,
            rotation: 0,
            lensType: subType || 'convex',
            focalLength: subType === 'concave' ? -150 : 150,
            refractiveIndex: 1.52,
            diameter: 80,
            thickness: 16,
          };
        case 'grating':
          return {
            id,
            type: 'grating',
            name,
            position,
            rotation: 0,
            gratingDensity: 600,
            width: 120,
          };
        case 'medium':
          return {
            id,
            type: 'medium',
            name,
            position,
            rotation: 0,
            mediumType: 'transparent',
            refractiveIndex: 1.5,
            absorptionCoefficient: subType === 'absorbing' ? 0.015 : 0.001,
            width: 150,
            height: 100,
          };
        case 'prism':
          return {
            id,
            type: 'prism',
            name,
            position,
            rotation: 0,
            prismType: subType || 'triangular',
            refractiveIndex: 1.62,
            size: 100,
          };
        case 'ruler':
          return {
            id,
            type: 'ruler',
            name,
            position,
            rotation: 0,
            length: 200,
            scale: 1.0,
          };
        case 'protractor':
          return {
            id,
            type: 'protractor',
            name,
            position,
            rotation: 0,
            radius: 100,
            attachedLaserId: null,
          };
        case 'single_slit':
          return {
            id,
            type: 'single_slit',
            name,
            position,
            rotation: 0,
            width: 120,
            slitWidth: 10,
          };
        case 'double_slit':
          return {
            id,
            type: 'double_slit',
            name,
            position,
            rotation: 0,
            width: 120,
            slitWidth: 6,
            slitSpacing: 24,
          };
        case 'aperture':
          return {
            id,
            type: 'aperture',
            name,
            position,
            rotation: 0,
            width: 120,
            slitWidth: 10,
          };
        case 'detector':
          return {
            id,
            type: 'detector',
            name,
            position,
            rotation: 0,
            width: 80,
            detectedPower: 0,
          };
        case 'screen':
          return {
            id,
            type: 'screen',
            name,
            position,
            rotation: 0,
            width: 150,
          };
        case 'fiber':
          return {
            id,
            type: 'fiber',
            name: name || (window.OpticalI18n && window.OpticalI18n.getLang() === 'ar' ? 'الكيبل الضوئي' : 'Optical Fiber Cable'),
            position,
            rotation: 0,
            length: 240,
            coreDiameter: 20,
            claddingDiameter: 40,
            coreIndex: 1.50,
            claddingIndex: 1.45,
            attenuation: 0.2,
          };
        default:
          return {
            id,
            type: 'mirror',
            name,
            position,
            rotation: 0,
            mirrorType: 'plane',
            width: 120,
            reflectivity: 1.0,
          };
      }
    }
  }

  window.WorkspaceCanvas = WorkspaceCanvas;

})(typeof window !== 'undefined' ? window : this);
