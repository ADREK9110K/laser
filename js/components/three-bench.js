/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq | College of Laser Science and Technology
 * 3D Interactive Optical Laboratory Bench (Three.js WebGL Engine)
 */

class ThreeOpticalBench {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.tableMesh = null;
    this.componentMeshes = new Map(); // component.id -> THREE.Group
    this.rayMeshes = [];
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    this.tableWidth = 1400; // mm
    this.tableHeight = 900;  // mm
    this.scaleFactor = 0.1;  // scale mm to Three.js units (1 Three unit = 10 mm)

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1117);
    this.scene.fog = new THREE.FogExp2(0x0e1117, 0.002);

    // Camera (Perspective)
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2500);
    this.camera.position.set(0, 85, 125);

    // WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous children
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't clip below table
      this.controls.target.set(0, 4.5, 0);
    }

    // Lights
    this.setupLighting();

    // Optical Table Surface
    this.setupOpticalTable();

    // Start 3D animation loop
    this.animate();
  }

  setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    this.scene.add(ambientLight);

    // Key Directional Light with Shadows
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(40, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -70;
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Subtle blue rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    rimLight.position.set(-50, 40, -50);
    this.scene.add(rimLight);
  }

  setupOpticalTable() {
    const w = this.tableWidth * this.scaleFactor;
    const d = this.tableHeight * this.scaleFactor;
    const h = 4.0;

    // Table Solid Block
    const tableGeo = new THREE.BoxGeometry(w, h, d);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.85,
      roughness: 0.35,
    });
    this.tableMesh = new THREE.Mesh(tableGeo, tableMat);
    this.tableMesh.position.y = -h / 2;
    this.tableMesh.receiveShadow = true;
    this.scene.add(this.tableMesh);

    // Table Mounting Grid (1 inch = 25mm grid)
    const gridHelper = new THREE.GridHelper(w, 28, 0xf08833, 0x334155);
    gridHelper.position.y = 0.02;
    this.scene.add(gridHelper);

    // Table Edge Chamfer Trim
    const trimGeo = new THREE.BoxGeometry(w + 1.2, 0.8, d + 1.2);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.2,
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.y = -0.4;
    this.scene.add(trimMesh);
  }

  // Convert 2D canvas coords (px) to 3D table units
  canvasTo3DCoords(x2d, y2d) {
    const tableW = this.tableWidth * this.scaleFactor; // 140
    const tableD = this.tableHeight * this.scaleFactor; // 90

    // Center around the typical optical bench coordinates (x: 420, y: 280)
    const normX = (x2d - 420) / 600;
    const normZ = (y2d - 280) / 400;

    return {
      x: normX * tableW * 0.72,
      z: normZ * tableD * 0.72,
      y: 4.5, // Standard optical beam height
    };
  }

  // Synchronize 3D Scene with 2D Components & Live Rays
  syncFrom2D(components, rays) {
    if (!this.scene) return;

    // 1. Remove existing component meshes
    for (const [id, group] of this.componentMeshes) {
      this.scene.remove(group);
    }
    this.componentMeshes.clear();

    // 2. Build 3D models for each component
    if (components && Array.isArray(components)) {
      for (const comp of components) {
        const posX = comp.position ? comp.position.x : (comp.x || 0);
        const posY = comp.position ? comp.position.y : (comp.y || 0);
        const rot = comp.rotation !== undefined ? comp.rotation : (comp.angle || 0);

        const pos3D = this.canvasTo3DCoords(posX, posY);
        const group = this.createComponentMesh(comp);
        group.position.set(pos3D.x, 0, pos3D.z);
        group.rotation.y = -(rot * Math.PI) / 180;

        this.scene.add(group);
        this.componentMeshes.set(comp.id, group);
      }
    }

    // 3. Rebuild 3D Volumetric Laser Beams
    this.rebuild3DRays(rays);
  }

  createComponentMesh(comp) {
    const group = new THREE.Group();

    // Kinematic Post Holder & Base Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.5, 1.8, 1.2, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.25 });
    const baseMesh = new THREE.Mesh(baseGeo, postMat);
    baseMesh.position.y = 0.6;
    baseMesh.castShadow = true;
    group.add(baseMesh);

    // Stainless Steel Optical Mounting Post
    const postGeo = new THREE.CylinderGeometry(0.6, 0.6, 4.0, 16);
    const postMesh = new THREE.Mesh(postGeo, postMat);
    postMesh.position.y = 2.6;
    postMesh.castShadow = true;
    group.add(postMesh);

    const opticalHeight = 4.5;

    // ── Laser Source ──
    if (comp.type === 'laser' || comp.type === 'white_light') {
      const tubeGeo = new THREE.CylinderGeometry(1.3, 1.3, 6.5, 24);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.rotation.z = Math.PI / 2;
      tubeMesh.position.y = opticalHeight;
      tubeMesh.castShadow = true;
      group.add(tubeMesh);

      // Emitter Front Bezel
      let emitColor = 0xef4444; // default red
      if (comp.wavelength) {
        if (comp.wavelength < 440) emitColor = 0xa855f7;
        else if (comp.wavelength < 500) emitColor = 0x0284c7;
        else if (comp.wavelength < 570) emitColor = 0x22c55e;
        else if (comp.wavelength < 600) emitColor = 0xeab308;
      }
      if (comp.type === 'white_light') emitColor = 0xffffff;

      const bezelGeo = new THREE.CylinderGeometry(0.8, 1.3, 0.8, 24);
      const bezelMat = new THREE.MeshBasicMaterial({ color: emitColor });
      const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
      bezelMesh.rotation.z = -Math.PI / 2;
      bezelMesh.position.set(3.4, opticalHeight, 0);
      group.add(bezelMesh);

      // Shutter switch LED
      const ledGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const ledMat = new THREE.MeshBasicMaterial({ color: comp.isOn ? emitColor : 0x475569 });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(-1.5, opticalHeight + 1.4, 0);
      group.add(ledMesh);
    }

    // ── Mirrors & Splitters ──
    else if (comp.type === 'mirror') {
      const mountGeo = new THREE.BoxGeometry(0.6, 4.2, 4.2);
      const mountMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.35 });
      const mountMesh = new THREE.Mesh(mountGeo, mountMat);
      mountMesh.position.y = opticalHeight;
      mountMesh.castShadow = true;
      group.add(mountMesh);

      const mirrorGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
      const isBS = comp.mirrorType === 'partial';
      const mirrorMat = new THREE.MeshStandardMaterial({
        color: isBS ? 0x93c5fd : 0xf8fafc,
        metalness: isBS ? 0.6 : 0.98,
        roughness: 0.05,
        transparent: isBS,
        opacity: isBS ? 0.65 : 1.0,
      });
      const mirrorMesh = new THREE.Mesh(mirrorGeo, mirrorMat);
      mirrorMesh.rotation.z = Math.PI / 2;
      mirrorMesh.position.set(0.35, opticalHeight, 0);
      group.add(mirrorMesh);
    }

    // ── Lenses ──
    else if (comp.type === 'lens') {
      // Circular Lens Mount Ring
      const ringGeo = new THREE.TorusGeometry(2.2, 0.35, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.y = Math.PI / 2;
      ringMesh.position.y = opticalHeight;
      ringMesh.castShadow = true;
      group.add(ringMesh);

      // Glass Lens
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        transmission: 0.92,
        opacity: 1,
        transparent: true,
        roughness: 0.05,
        ior: comp.refractiveIndex || 1.52,
      });

      const lensGeo = new THREE.SphereGeometry(2.1, 32, 16);
      lensGeo.scale(0.3, 1, 1);
      const lensMesh = new THREE.Mesh(lensGeo, glassMat);
      lensMesh.position.y = opticalHeight;
      group.add(lensMesh);
    }

    // ── Optical Fiber Cable (الكيبل الضوئي) ──
    else if (comp.type === 'fiber') {
      const L = (comp.length || 240) * 0.08;
      const dClad = 1.6;
      const dCore = 0.6;

      // Outer Protective Jacket (amber fiber orange)
      const jacketGeo = new THREE.CylinderGeometry(dClad, dClad, L, 24);
      const jacketMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.4,
        roughness: 0.35,
      });
      const jacketMesh = new THREE.Mesh(jacketGeo, jacketMat);
      jacketMesh.rotation.z = Math.PI / 2;
      jacketMesh.position.y = opticalHeight;
      jacketMesh.castShadow = true;
      group.add(jacketMesh);

      // Silica Cladding / Core Light Pipe
      const coreGeo = new THREE.CylinderGeometry(dCore, dCore, L + 0.4, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: comp.isGuiding ? 0x22c55e : 0xffffff,
        transparent: true,
        opacity: 0.85,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.rotation.z = Math.PI / 2;
      coreMesh.position.y = opticalHeight;
      group.add(coreMesh);

      // SMA / FC Connector Ferrules at ends
      const ferruleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.2 });
      const fGeo = new THREE.CylinderGeometry(dClad * 1.35, dClad * 1.35, 1.6, 20);

      const f1 = new THREE.Mesh(fGeo, ferruleMat);
      f1.rotation.z = Math.PI / 2;
      f1.position.set(-L / 2 - 0.8, opticalHeight, 0);
      group.add(f1);

      const f2 = new THREE.Mesh(fGeo, ferruleMat);
      f2.rotation.z = Math.PI / 2;
      f2.position.set(L / 2 + 0.8, opticalHeight, 0);
      group.add(f2);
    }

    // ── Prisms ──
    else if (comp.type === 'prism') {
      const prismMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0e7ff,
        transmission: 0.92,
        transparent: true,
        roughness: 0.05,
        ior: comp.refractiveIndex || 1.62,
      });

      const s = 3.5;
      const prismGeo = new THREE.CylinderGeometry(s, s, 4.0, 3);
      const prismMesh = new THREE.Mesh(prismGeo, prismMat);
      prismMesh.position.y = opticalHeight;
      prismMesh.rotation.y = Math.PI / 6;
      group.add(prismMesh);
    }

    // ── Media ──
    else if (comp.type === 'medium') {
      const W = (comp.width || 150) * 0.075;
      const H = (comp.height || 100) * 0.075;

      const medMat = new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        transmission: 0.88,
        transparent: true,
        roughness: 0.1,
        ior: comp.refractiveIndex || 1.5,
      });
      const medGeo = new THREE.BoxGeometry(W, 4.5, H);
      const medMesh = new THREE.Mesh(medGeo, medMat);
      medMesh.position.y = opticalHeight;
      group.add(medMesh);
    }

    // ── Slits & Gratings ──
    else if (comp.type === 'grating' || comp.type === 'single_slit' || comp.type === 'double_slit' || comp.type === 'aperture') {
      const plateGeo = new THREE.BoxGeometry(0.3, 4.5, 4.5);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x09090b,
        metalness: 0.9,
        roughness: 0.3,
      });
      const plateMesh = new THREE.Mesh(plateGeo, plateMat);
      plateMesh.position.y = opticalHeight;
      plateMesh.castShadow = true;
      group.add(plateMesh);

      // Visual line / slit opening
      const slitGeo = new THREE.BoxGeometry(0.35, 3.0, 0.2);
      const slitMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const slitMesh = new THREE.Mesh(slitGeo, slitMat);
      slitMesh.position.y = opticalHeight;
      group.add(slitMesh);
    }

    // ── Detector & Power Meter ──
    else if (comp.type === 'detector') {
      const detGeo = new THREE.BoxGeometry(1.2, 3.6, 3.6);
      const detMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
      const detMesh = new THREE.Mesh(detGeo, detMat);
      detMesh.position.y = opticalHeight;
      detMesh.castShadow = true;
      group.add(detMesh);

      // Sensor active window
      const winGeo = new THREE.BoxGeometry(0.1, 2.2, 2.2);
      const winMat = new THREE.MeshBasicMaterial({ color: 0x1e3a8a });
      const winMesh = new THREE.Mesh(winGeo, winMat);
      winMesh.position.set(-0.62, opticalHeight, 0);
      group.add(winMesh);
    }

    // ── Screen ──
    else if (comp.type === 'screen') {
      const scrGeo = new THREE.BoxGeometry(0.4, 5.5, 7.5);
      const scrMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 });
      const scrMesh = new THREE.Mesh(scrGeo, scrMat);
      scrMesh.position.y = opticalHeight;
      scrMesh.castShadow = true;
      group.add(scrMesh);
    }

    return group;
  }

  rebuild3DRays(rays) {
    // Remove existing ray meshes
    for (const rMesh of this.rayMeshes) {
      this.scene.remove(rMesh);
    }
    this.rayMeshes = [];

    const opticalHeight = 4.5;
    if (!rays || !Array.isArray(rays)) return;

    for (const ray of rays) {
      const segments = [];
      if (ray.path && Array.isArray(ray.path) && ray.path.length >= 2) {
        for (let i = 0; i < ray.path.length - 1; i++) {
          segments.push({ p1: ray.path[i], p2: ray.path[i + 1] });
        }
      } else if (ray.x1 !== undefined && ray.x2 !== undefined) {
        segments.push({ p1: { x: ray.x1, y: ray.y1 }, p2: { x: ray.x2, y: ray.y2 } });
      }

      for (const seg of segments) {
        const p1 = this.canvasTo3DCoords(seg.p1.x, seg.p1.y);
        const p2 = this.canvasTo3DCoords(seg.p2.x, seg.p2.y);

        const v1 = new THREE.Vector3(p1.x, opticalHeight, p1.z);
        const v2 = new THREE.Vector3(p2.x, opticalHeight, p2.z);
        const dist = v1.distanceTo(v2);
        if (dist < 0.1) continue;

        let hexColor = new THREE.Color(0xef4444);
        if (ray.color) {
          try {
            hexColor = new THREE.Color(ray.color);
          } catch (e) {
            hexColor = new THREE.Color(0xef4444);
          }
        } else if (ray.wavelength) {
          if (ray.wavelength < 440) hexColor = new THREE.Color(0xa855f7);
          else if (ray.wavelength < 500) hexColor = new THREE.Color(0x0284c7);
          else if (ray.wavelength < 570) hexColor = new THREE.Color(0x22c55e);
          else if (ray.wavelength < 600) hexColor = new THREE.Color(0xeab308);
          else hexColor = new THREE.Color(0xef4444);
        }

        // 1. Core Bright Line
        const curve = new THREE.LineCurve3(v1, v2);
        const tubeGeo = new THREE.TubeGeometry(curve, 1, 0.2, 8, false);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const coreMesh = new THREE.Mesh(tubeGeo, coreMat);
        this.scene.add(coreMesh);
        this.rayMeshes.push(coreMesh);

        // 2. Volumetric Glow Cylinder with Additive Blending
        const glowGeo = new THREE.TubeGeometry(curve, 1, 0.65, 12, false);
        const glowMat = new THREE.MeshBasicMaterial({
          color: hexColor,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        this.scene.add(glowMesh);
        this.rayMeshes.push(glowMesh);
      }
    }
  }

  setCameraView(viewType) {
    if (!this.controls) return;
    if (viewType === 'top') {
      this.camera.position.set(0, 130, 0.1);
      this.controls.target.set(0, 4.5, 0);
    } else if (viewType === 'perspective') {
      this.camera.position.set(0, 85, 125);
      this.controls.target.set(0, 4.5, 0);
    } else if (viewType === 'front') {
      this.camera.position.set(0, 10, 125);
      this.controls.target.set(0, 4.5, 0);
    }
    this.controls.update();
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    if (this.controls) {
      this.controls.update();
    }

    // Laser beam pulsation glow
    for (let i = 1; i < this.rayMeshes.length; i += 2) {
      const glowMesh = this.rayMeshes[i];
      if (glowMesh && glowMesh.material) {
        glowMesh.material.opacity = 0.4 + 0.15 * Math.sin(time * 8.0 + i);
      }
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

window.ThreeOpticalBench = ThreeOpticalBench;
