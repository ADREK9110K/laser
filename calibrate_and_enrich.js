global.window = global;
const fs = require('fs');
const catPath = 'D:/Program/prooooooooooooooooogramer/LASER SCIENCE & TECHNOLOGY/js/data/experiments-catalog.js';
const cat = require(catPath);

cat.forEach((exp, idx) => {
  const numInt = parseInt(exp.num, 10);

  // Default properties fix
  exp.components.forEach(c => {
    if (c.type === 'mirror') {
      if (!c.mirrorType) c.mirrorType = 'plane';
      if (c.reflectivity === undefined) c.reflectivity = c.mirrorType === 'partial' ? 0.5 : 1.0;
      if (c.width === undefined) c.width = 120;
    }
    if (c.type === 'lens') {
      if (!c.lensType) c.lensType = 'convex';
      if (!c.focalLength) c.focalLength = 150;
      if (!c.diameter) c.diameter = 80;
      if (!c.refractiveIndex) c.refractiveIndex = 1.52;
    }
    if (c.type === 'prism') {
      if (!c.prismType) c.prismType = 'triangular';
      if (!c.refractiveIndex) c.refractiveIndex = 1.62;
      if (!c.size) c.size = 110;
    }
    if (c.type === 'laser' || c.type === 'white_light') {
      c.isOn = true;
      if (!c.beamWidth) c.beamWidth = 14;
      if (!c.power) c.power = 5;
    }
    if (c.type === 'grating' || c.type === 'single_slit' || c.type === 'double_slit' || c.type === 'aperture') {
      if (c.rotation === 0) c.rotation = 90;
    }
    if (c.type === 'screen' || c.type === 'detector') {
      if (!c.width) c.width = c.type === 'screen' ? 160 : 80;
      if (c.rotation === 0 && c.position && c.position.y === 280) c.rotation = 90;
    }
  });

  // Specific tuning for known categories to ensure optimal optical alignment:
  // 1. TIR & Prisms (003, 004)
  if (numInt === 3 || numInt === 4) {
    exp.components = [
      { id: 'laser_003', type: 'laser', name: 'Precision He-Ne Laser', position: { x: 140, y: 280 }, rotation: 0, wavelength: 632.8, power: 5, beamWidth: 14, isOn: true },
      { id: 'prism_003', type: 'prism', name: 'High-Index Triangular Prism (n=1.65)', position: { x: 390, y: 280 }, rotation: 15, size: 120, refractiveIndex: 1.65, prismType: 'triangular' },
      { id: 'screen_003', type: 'screen', name: 'Refracted & TIR Screen', position: { x: 680, y: 280 }, rotation: 90, width: 180 }
    ];
  }

  // 2. Optical Fiber Guidance experiments (014, 015, 061, 074, 083, 085)
  if (numInt === 14 || numInt === 15 || numInt === 61 || numInt === 74 || numInt === 83 || numInt === 85) {
    exp.components = [
      { id: 'laser_fib', type: 'laser', name: 'Single-Mode Diode Laser (635nm)', position: { x: 120, y: 280 }, rotation: 0, wavelength: 635, power: 10, beamWidth: 10, isOn: true },
      { id: 'lens_coupler', type: 'lens', name: 'Microscope Objective Coupler', position: { x: 230, y: 280 }, rotation: 0, lensType: 'convex', focalLength: 60, diameter: 60, refractiveIndex: 1.52 },
      { id: 'fiber_cable', type: 'fiber', name: 'الكيبل الضوئي (Optical Fiber)', position: { x: 420, y: 280 }, rotation: 0, length: 240, coreDiameter: 20, claddingDiameter: 40, coreIndex: 1.50, claddingIndex: 1.45, attenuation: 0.2 },
      { id: 'detector_fib', type: 'detector', name: 'Optical Power Meter', position: { x: 670, y: 280 }, rotation: 90, width: 80 }
    ];
  }

  // 3. Young's Double Slit & Wave Optics (016, 017)
  if (numInt === 16) {
    exp.components = [
      { id: 'laser_016', type: 'laser', name: 'Coherent Green Laser (532nm)', position: { x: 140, y: 270 }, rotation: 0, wavelength: 532, power: 5, beamWidth: 28, isOn: true },
      { id: 'slit_016', type: 'double_slit', name: 'Young Double Slit (d=50µm)', position: { x: 380, y: 270 }, rotation: 90, width: 120, slitWidth: 6, slitSpacing: 12 },
      { id: 'screen_016', type: 'screen', name: 'Interference Fringes Screen', position: { x: 720, y: 270 }, rotation: 90, width: 220 }
    ];
  }
  if (numInt === 17) {
    exp.components = [
      { id: 'laser_017', type: 'laser', name: 'Red Laser Source (650nm)', position: { x: 140, y: 270 }, rotation: 0, wavelength: 650, power: 5, beamWidth: 16, isOn: true },
      { id: 'slit_017', type: 'single_slit', name: 'Single Slit Aperture (a=20µm)', position: { x: 380, y: 270 }, rotation: 90, width: 120, slitWidth: 15 },
      { id: 'screen_017', type: 'screen', name: 'Fraunhofer Diffraction Screen', position: { x: 720, y: 270 }, rotation: 90, width: 220 }
    ];
  }

  // 4. Laser Cavities and Active Resonators (041 to 057)
  if (numInt >= 41 && numInt <= 57) {
    exp.components = [
      { id: 'laser_pump', type: 'laser', name: 'Optical Pump Source', position: { x: 100, y: 270 }, rotation: 0, wavelength: 532, power: 15, beamWidth: 12, isOn: true },
      { id: 'mirror_m1', type: 'mirror', name: 'Cavity Rear Mirror (R=99.9%)', position: { x: 210, y: 270 }, rotation: 90, mirrorType: 'partial', reflectivity: 0.95, width: 110 },
      { id: 'laser_medium', type: 'medium', name: 'Active Gain Medium (Nd:YAG Rod)', position: { x: 360, y: 270 }, rotation: 0, width: 140, height: 70, refractiveIndex: 1.82, mediumType: 'transparent' },
      { id: 'mirror_m2', type: 'mirror', name: 'Output Coupler Mirror (R=85%)', position: { x: 510, y: 270 }, rotation: 90, mirrorType: 'partial', reflectivity: 0.85, width: 110 },
      { id: 'detector_cav', type: 'detector', name: 'Laser Emission Power Meter', position: { x: 690, y: 270 }, rotation: 90, width: 80 }
    ];
  }
});

// Ensure global attachment
const header = '/**\n * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY\n * University of Technology - Iraq | College of Laser Science and Technology\n * Complete 100 Experiments Catalog Database (001 - 100) with Pre-Configured Optical Setups\n */\n\n';
const body = 'window.EXPERIMENTS_DATABASE = ' + JSON.stringify(cat, null, 2) + ';\n\n';
const footer = 'if (typeof module !== "undefined" && module.exports) {\n  module.exports = window.EXPERIMENTS_DATABASE;\n}\n';

fs.writeFileSync(catPath, header + body + footer, 'utf8');
console.log('✅ Successfully calibrated all 100 experiments!');
