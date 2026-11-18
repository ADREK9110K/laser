/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Interactive Optical Breadboard Simulation Canvas & Multi-Path Ray Tracer
 */

class InteractiveOpticalBench {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.is3D = options.is3D || false;
    this.gridSpacing = 25; // 25 mm M6 standard grid
    this.showRulers = true;
    this.activeComponent = null;
    this.isDragging = false;
    this.isRotating = false;
    this.dragOffset = { x: 0, y: 0 };
    this.components = []; // Array of placed optical components
    this.rays = []; // Calculated ray paths for visualization
    this.laserOn = true;

    this.onSelectComponent = options.onSelectComponent || null;
    this.onUpdateSimulation = options.onUpdateSimulation || null;

    this.initEvents();
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 800;
      this.canvas.height = parent.clientHeight || 450;
      this.render();
    }
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
    window.addEventListener('resize', () => this.resize());
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handleMouseDown(e) {
    const pos = this.getCanvasCoords(e);
    // Check if clicked rotation handle of selected component
    if (this.activeComponent) {
      const handlePos = this.getRotationHandlePos(this.activeComponent);
      const dist = Math.hypot(pos.x - handlePos.x, pos.y - handlePos.y);
      if (dist <= 10) {
        this.isRotating = true;
        return;
      }
    }

    // Check hit test for components (in reverse order for top-most)
    let hit = null;
    for (let i = this.components.length - 1; i >= 0; i--) {
      const comp = this.components[i];
      const dist = Math.hypot(pos.x - comp.x, pos.y - comp.y);
      if (dist <= (comp.radius || 24)) {
        hit = comp;
        break;
      }
    }

    if (hit) {
      this.activeComponent = hit;
      this.isDragging = true;
      this.dragOffset = { x: pos.x - hit.x, y: pos.y - hit.y };
      if (this.onSelectComponent) this.onSelectComponent(hit);
    } else {
      this.activeComponent = null;
      if (this.onSelectComponent) this.onSelectComponent(null);
    }
    this.render();
  }

  handleMouseMove(e) {
    if (!this.isDragging && !this.isRotating) return;
    const pos = this.getCanvasCoords(e);

    if (this.isDragging && this.activeComponent) {
      // Snap to grid if near
      let nx = pos.x - this.dragOffset.x;
      let ny = pos.y - this.dragOffset.y;
      const snapGrid = 5;
      nx = Math.round(nx / snapGrid) * snapGrid;
      ny = Math.round(ny / snapGrid) * snapGrid;

      // Keep within bounds
      this.activeComponent.x = Math.max(30, Math.min(this.canvas.width - 30, nx));
      this.activeComponent.y = Math.max(30, Math.min(this.canvas.height - 30, ny));

      this.traceRays();
      this.render();
      if (this.onUpdateSimulation) this.onUpdateSimulation();
    } else if (this.isRotating && this.activeComponent) {
      const dx = pos.x - this.activeComponent.x;
      const dy = pos.y - this.activeComponent.y;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      this.activeComponent.angle = Math.round(angle);

      this.traceRays();
      this.render();
      if (this.onUpdateSimulation) this.onUpdateSimulation();
    }
  }

  handleMouseUp() {
    this.isDragging = false;
    this.isRotating = false;
  }

  handleWheel(e) {
    if (!this.activeComponent) return;
    e.preventDefault();
    const delta = Math.sign(e.deltaY) * 2;
    this.activeComponent.angle = (this.activeComponent.angle + delta + 360) % 360;
    this.traceRays();
    this.render();
    if (this.onUpdateSimulation) this.onUpdateSimulation();
  }

  getRotationHandlePos(comp) {
    const dist = (comp.radius || 24) + 18;
    const rad = (comp.angle * Math.PI) / 180;
    return {
      x: comp.x + dist * Math.cos(rad),
      y: comp.y + dist * Math.sin(rad)
    };
  }

  clear() {
    this.components = [];
    this.activeComponent = null;
    this.rays = [];
    this.render();
  }

  addComponent(component) {
    this.components.push(component);
    this.activeComponent = component;
    this.traceRays();
    this.render();
    return component;
  }

  removeActiveComponent() {
    if (!this.activeComponent) return;
    this.components = this.components.filter(c => c !== this.activeComponent);
    this.activeComponent = null;
    this.traceRays();
    this.render();
  }

  // Set up default optical experiment layouts
  setupPreset(presetName, params = {}) {
    this.components = [];
    const w = this.canvas.width;
    const h = this.canvas.height;
    const midY = h / 2;

    if (presetName === 'reflection') {
      const theta = params.incidentAngle !== undefined ? params.incidentAngle : 45;
      // Laser Source
      this.components.push({
        id: "src_1", type: "laser", name: "He-Ne Laser (632.8nm)",
        x: 100, y: midY, angle: 0, wavelength: 632.8, power: 5.0, color: "#ff1a40"
      });
      // Plane Mirror at center
      this.components.push({
        id: "mir_1", type: "mirror", name: "Kinematic Plane Mirror",
        x: 400, y: midY, angle: 90 + theta / 2, reflectivity: 0.99
      });
      // Detector
      this.components.push({
        id: "det_1", type: "detector", name: "Silicon Photodiode",
        x: 400 + 250 * Math.cos((theta * Math.PI) / 180),
        y: midY + 250 * Math.sin((theta * Math.PI) / 180),
        angle: 180 - theta, measuredPower: 0
      });
    } else if (presetName === 'refraction' || presetName === 'tir') {
      const theta = params.incidentAngle !== undefined ? params.incidentAngle : 35;
      this.components.push({
        id: "src_1", type: "laser", name: "Green Laser (532nm)",
        x: 120, y: midY, angle: theta, wavelength: 532, power: 10.0, color: "#00ff77"
      });
      this.components.push({
        id: "prism_1", type: "prism", name: "Refractive Boundary",
        x: 400, y: midY, angle: 90, n1: params.n1 || 1.0, n2: params.n2 || 1.5168
      });
      this.components.push({
        id: "det_1", type: "detector", name: "Detector",
        x: 680, y: midY, angle: 180, measuredPower: 0
      });
    } else if (presetName === 'thin_lens') {
      this.components.push({
        id: "src_1", type: "laser", name: "Collimated Laser",
        x: 100, y: midY - 20, angle: 0, wavelength: 632.8, power: 5.0, color: "#ff1a40"
      });
      this.components.push({
        id: "src_2", type: "laser", name: "Parallel Beam Ray 2",
        x: 100, y: midY + 20, angle: 0, wavelength: 632.8, power: 5.0, color: "#ff1a40"
      });
      this.components.push({
        id: "lens_1", type: "lens", name: "Plano-Convex Lens (f=120mm)",
        x: 350, y: midY, angle: 90, focalLength: params.focalLength || 120
      });
      this.components.push({
        id: "det_1", type: "target", name: "Focal Plane Screen",
        x: 350 + (params.focalLength || 120), y: midY, angle: 90
      });
    } else if (presetName === 'michelson') {
      // Michelson Interferometer Setup
      this.components.push({
        id: "src_1", type: "laser", name: "He-Ne Laser (632.8nm)",
        x: 120, y: midY, angle: 0, wavelength: 632.8, power: 5.0, color: "#ff1a40"
      });
      this.components.push({
        id: "bs_1", type: "beamsplitter", name: "50:50 Beam Splitter Cube",
        x: 380, y: midY, angle: 45, splitRatio: 0.5
      });
      // Reference mirror (Top arm)
      this.components.push({
        id: "mir_ref", type: "mirror", name: "Fixed Reference Mirror",
        x: 380, y: midY - 180, angle: 0, reflectivity: 0.99
      });
      // Moving sample mirror (Right arm)
      this.components.push({
        id: "mir_sample", type: "mirror", name: "Piezo Moving Mirror",
        x: 560, y: midY, angle: 90, reflectivity: 0.99
      });
      // Detector (Bottom arm)
      this.components.push({
        id: "det_1", type: "detector", name: "Interference Fringe Sensor",
        x: 380, y: midY + 180, angle: 270, measuredPower: 0
      });
    } else if (presetName === 'builder') {
      // Default blank workspace with sample laser and detector
      this.components.push({
        id: "src_1", type: "laser", name: "He-Ne Laser (632.8nm)",
        x: 120, y: midY, angle: 0, wavelength: 632.8, power: 5.0, color: "#ff1a40"
      });
      this.components.push({
        id: "det_1", type: "detector", name: "Optical Power Meter",
        x: 650, y: midY, angle: 180, measuredPower: 0
      });
    }

    this.traceRays();
    this.render();
  }

  // Core Multi-Path Ray Tracing Algorithm
  traceRays() {
    this.rays = [];
    if (!this.laserOn) return;

    // Reset detector power readings
    for (const comp of this.components) {
      if (comp.type === 'detector') comp.measuredPower = 0;
    }

    // Queue of rays to trace: { startX, startY, angleRad, power, wavelength, color, depth }
    const rayQueue = [];

    // Find all laser sources
    for (const comp of this.components) {
      if (comp.type === 'laser') {
        const rad = (comp.angle * Math.PI) / 180;
        rayQueue.push({
          x: comp.x + 20 * Math.cos(rad),
          y: comp.y + 20 * Math.sin(rad),
          angleRad: rad,
          power: comp.power || 5.0,
          wavelength: comp.wavelength || 632.8,
          color: comp.color || "#ff1a40",
          depth: 0
        });
      }
    }

    const maxBounces = 20;
    const maxDist = Math.max(this.canvas.width, this.canvas.height) * 2;

    while (rayQueue.length > 0) {
      const current = rayQueue.shift();
      if (current.depth > maxBounces || current.power < 0.05) continue;

      let closestHit = null;
      let minDistance = maxDist;

      // Find closest intersecting component
      for (const comp of this.components) {
        if (comp.type === 'laser') continue; // Don't hit emitter directly

        const hit = this.intersectRayComponent(current, comp);
        if (hit && hit.dist > 1.0 && hit.dist < minDistance) {
          minDistance = hit.dist;
          closestHit = { ...hit, component: comp };
        }
      }

      if (closestHit) {
        // Record path segment
        this.rays.push({
          x1: current.x,
          y1: current.y,
          x2: closestHit.point.x,
          y2: closestHit.point.y,
          color: current.color,
          power: current.power,
          wavelength: current.wavelength
        });

        const comp = closestHit.component;

        // Interaction behavior based on component type
        if (comp.type === 'mirror') {
          // Specular reflection: r = v - 2(v·n)n
          const normalRad = (comp.angle * Math.PI) / 180;
          const normal = { x: Math.cos(normalRad), y: Math.sin(normalRad) };
          const rayDir = { x: Math.cos(current.angleRad), y: Math.sin(current.angleRad) };
          const dot = rayDir.x * normal.x + rayDir.y * normal.y;
          const refX = rayDir.x - 2 * dot * normal.x;
          const refY = rayDir.y - 2 * dot * normal.y;
          const refAngleRad = Math.atan2(refY, refX);

          rayQueue.push({
            x: closestHit.point.x + 1e-2 * refX,
            y: closestHit.point.y + 1e-2 * refY,
            angleRad: refAngleRad,
            power: current.power * (comp.reflectivity || 0.99),
            wavelength: current.wavelength,
            color: current.color,
            depth: current.depth + 1
          });
        } else if (comp.type === 'beamsplitter') {
          // Splits into 50% reflected and 50% transmitted
          const normalRad = (comp.angle * Math.PI) / 180;
          const normal = { x: Math.cos(normalRad), y: Math.sin(normalRad) };
          const rayDir = { x: Math.cos(current.angleRad), y: Math.sin(current.angleRad) };
          const dot = rayDir.x * normal.x + rayDir.y * normal.y;
          const refX = rayDir.x - 2 * dot * normal.x;
          const refY = rayDir.y - 2 * dot * normal.y;
          const refAngleRad = Math.atan2(refY, refX);

          // Reflected branch
          rayQueue.push({
            x: closestHit.point.x + 1e-2 * refX,
            y: closestHit.point.y + 1e-2 * refY,
            angleRad: refAngleRad,
            power: current.power * 0.5,
            wavelength: current.wavelength,
            color: current.color,
            depth: current.depth + 1
          });

          // Transmitted branch (straight through)
          rayQueue.push({
            x: closestHit.point.x + 1e-2 * rayDir.x,
            y: closestHit.point.y + 1e-2 * rayDir.y,
            angleRad: current.angleRad,
            power: current.power * 0.5,
            wavelength: current.wavelength,
            color: current.color,
            depth: current.depth + 1
          });
        } else if (comp.type === 'lens') {
          // Thin lens paraxial deflection towards/away from focus
          const f = comp.focalLength || 120;
          const lensRad = (comp.angle * Math.PI) / 180;
          const normal = { x: Math.cos(lensRad), y: Math.sin(lensRad) };
          
          // Deflect ray towards focal point
          const dy = closestHit.point.y - comp.y;
          const deflectionAngle = -Math.atan2(dy, f);
          const newAngleRad = current.angleRad + deflectionAngle;

          rayQueue.push({
            x: closestHit.point.x + 0.1 * Math.cos(newAngleRad),
            y: closestHit.point.y + 0.1 * Math.sin(newAngleRad),
            angleRad: newAngleRad,
            power: current.power * 0.98,
            wavelength: current.wavelength,
            color: current.color,
            depth: current.depth + 1
          });
        } else if (comp.type === 'detector') {
          // Detector registers the optical power
          comp.measuredPower = (comp.measuredPower || 0) + current.power;
        }
      } else {
        // Ray reaches edge of table
        const endX = current.x + maxDist * Math.cos(current.angleRad);
        const endY = current.y + maxDist * Math.sin(current.angleRad);
        this.rays.push({
          x1: current.x,
          y1: current.y,
          x2: endX,
          y2: endY,
          color: current.color,
          power: current.power,
          wavelength: current.wavelength
        });
      }
    }
  }

  // Intersection between ray and component plane/boundary
  intersectRayComponent(ray, comp) {
    const r = comp.radius || 24;
    // Approximating component as line segment of length 2r oriented perpendicular to normal
    const planeAngleRad = ((comp.angle + 90) * Math.PI) / 180;
    const p1 = {
      x: comp.x - r * Math.cos(planeAngleRad),
      y: comp.y - r * Math.sin(planeAngleRad)
    };
    const p2 = {
      x: comp.x + r * Math.cos(planeAngleRad),
      y: comp.y + r * Math.sin(planeAngleRad)
    };

    // Ray line segment: start to far point
    const rDirX = Math.cos(ray.angleRad);
    const rDirY = Math.sin(ray.angleRad);

    // Line-line intersection formula
    const x1 = ray.x, y1 = ray.y;
    const x2 = ray.x + 1000 * rDirX, y2 = ray.y + 1000 * rDirY;
    const x3 = p1.x, y3 = p1.y;
    const x4 = p2.x, y4 = p2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-6) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t > 0 && u >= 0 && u <= 1) {
      const hitX = x1 + t * (x2 - x1);
      const hitY = y1 + t * (y2 - y1);
      const dist = Math.hypot(hitX - ray.x, hitY - ray.y);
      return {
        point: { x: hitX, y: hitY },
        dist: dist
      };
    }
    return null;
  }

  // Main Canvas Rendering Loop
  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Optical breadboard background (dark brushed anodized aluminum)
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    // Draw M6 tapped holes grid
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    const spacing = this.gridSpacing;
    for (let x = spacing; x < w; x += spacing) {
      for (let y = spacing; y < h; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw coordinate millimeter rulers if enabled
    if (this.showRulers) {
      ctx.fillStyle = "rgba(0, 212, 255, 0.25)";
      ctx.font = "9px 'JetBrains Mono', monospace";
      for (let x = 0; x < w; x += 100) {
        ctx.fillText(`${x}mm`, x + 4, 12);
        ctx.fillRect(x, 0, 1, 6);
      }
      for (let y = 0; y < h; y += 100) {
        ctx.fillText(`${y}mm`, 4, y + 10);
        ctx.fillRect(0, y, 6, 1);
      }
    }

    // Draw Laser Rays with Glowing Light Shader
    ctx.save();
    for (const ray of this.rays) {
      // 1. Outer Diffuse Glow
      ctx.strokeStyle = ray.color;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(ray.x1, ray.y1);
      ctx.lineTo(ray.x2, ray.y2);
      ctx.stroke();

      // 2. Middle Coherent Glow
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 5;
      ctx.stroke();

      // 3. Ultra-Bright Laser Core
      ctx.strokeStyle = "#ffffff";
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }
    ctx.restore();

    // Draw Components
    for (const comp of this.components) {
      this.drawComponent(ctx, comp);
    }

    // Highlight selected component with rotation handle
    if (this.activeComponent) {
      const comp = this.activeComponent;
      ctx.save();
      ctx.strokeStyle = "#00d4ff";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(comp.x, comp.y, (comp.radius || 24) + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotation Handle
      const hPos = this.getRotationHandlePos(comp);
      ctx.beginPath();
      ctx.arc(hPos.x, hPos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#00d4ff";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Connecting line to handle
      ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
      ctx.beginPath();
      ctx.moveTo(comp.x, comp.y);
      ctx.lineTo(hPos.x, hPos.y);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Draw Individual Component Icon on Breadboard
  drawComponent(ctx, comp) {
    ctx.save();
    ctx.translate(comp.x, comp.y);
    ctx.rotate((comp.angle * Math.PI) / 180);

    const r = comp.radius || 24;

    // Kinematic post holder base
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (comp.type === 'laser') {
      // Laser Tube Head
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = comp.color || "#ff1a40";
      ctx.lineWidth = 2;
      ctx.fillRect(-18, -10, 36, 20);
      ctx.strokeRect(-18, -10, 36, 20);

      // Laser Aperture Bezel
      ctx.fillStyle = comp.color || "#ff1a40";
      ctx.beginPath();
      ctx.arc(18, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Warning Danger Symbol
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText("▲", -4, 3);
    } else if (comp.type === 'mirror') {
      // High-Reflectivity Mirror Front Surface
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-4, -r, 8, r * 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(2, -r, 3, r * 2); // Silver coating
    } else if (comp.type === 'beamsplitter') {
      // 50:50 Cube Splitter
      ctx.fillStyle = "rgba(56, 189, 248, 0.25)";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeRect(-14, -14, 28, 28);

      // Diagonal dielectric coating
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-14, -14);
      ctx.lineTo(14, 14);
      ctx.stroke();
    } else if (comp.type === 'lens') {
      // Biconvex Lens Glass
      ctx.fillStyle = "rgba(147, 197, 253, 0.35)";
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (comp.type === 'prism') {
      // Dispersive Prism
      ctx.fillStyle = "rgba(192, 132, 252, 0.35)";
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(-r * 0.5, -r * 0.86);
      ctx.lineTo(-r * 0.5, r * 0.86);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (comp.type === 'detector') {
      // Photodiode Aperture
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sensor active area
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(-6, -6, 12, 12);
    } else {
      // Generic component
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Label & Power Readout
    ctx.save();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "10px 'Cairo', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(comp.name || comp.type, comp.x, comp.y + r + 14);

    if (comp.type === 'detector') {
      // Digital LED Display above detector
      const pwr = (comp.measuredPower || 0).toFixed(2);
      ctx.fillStyle = "rgba(6, 78, 59, 0.9)";
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      ctx.fillRect(comp.x - 30, comp.y - r - 22, 60, 16);
      ctx.strokeRect(comp.x - 30, comp.y - r - 22, 60, 16);

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.fillText(`${pwr} mW`, comp.x, comp.y - r - 10);
    }
    ctx.restore();
  }
}

window.InteractiveOpticalBench = InteractiveOpticalBench;
