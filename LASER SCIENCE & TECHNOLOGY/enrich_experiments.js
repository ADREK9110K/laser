const fs = require('fs');
const path = require('path');

// Read existing catalog
const catalogPath = path.join(__dirname, 'js', 'data', 'experiments-catalog.js');
let code = fs.readFileSync(catalogPath, 'utf8');

// Execute to get EXPERIMENTS_DATABASE
global.window = global;
eval(code);

console.log('Read', EXPERIMENTS_DATABASE.length, 'experiments');

// Helper to create component
function makeComp(type, subType, name, pos, rot, extra = {}) {
  const id = `preset_${type}_${Math.random().toString(36).substring(2, 7)}`;
  const base = {
    id,
    type,
    name,
    position: pos,
    rotation: rot,
  };
  return Object.assign(base, extra);
}

// Generate components preset for each experiment based on its phenomenon and category
EXPERIMENTS_DATABASE.forEach((exp, index) => {
  const num = exp.num;
  const cat = exp.category;
  const title = exp.title.toLowerCase();
  const comps = [];

  // 1. Fundamental Optics (001 - 015)
  if (num === '001') {
    // Law of Reflection
    comps.push(makeComp('laser', 'red', 'He-Ne Laser (632.8nm)', { x: 150, y: 280 }, 0, { wavelength: 632.8, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('protractor', '', 'Precision Circular Protractor', { x: 450, y: 280 }, 0, { radius: 110 }));
    comps.push(makeComp('mirror', 'plane', 'Kinematic Plane Mirror', { x: 450, y: 280 }, 45, { width: 130, reflectivity: 1.0 }));
    comps.push(makeComp('detector', '', 'Silicon Photodiode', { x: 450, y: 500 }, 90, { width: 80 }));
  } else if (num === '002') {
    // Snell's Law
    comps.push(makeComp('laser', 'green', 'Green Diode Laser (532nm)', { x: 140, y: 260 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('medium', 'transparent', 'Optical Glass Block (N-BK7)', { x: 400, y: 260 }, 28, { width: 140, height: 90, refractiveIndex: 1.52 }));
    comps.push(makeComp('screen', '', 'Calibrated Screen', { x: 700, y: 260 }, 90, { width: 160 }));
  } else if (num === '003' || num === '004') {
    // Critical Angle & Total Internal Reflection
    comps.push(makeComp('laser', 'red', 'Laser Source (650nm)', { x: 180, y: 210 }, 48, { wavelength: 650, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('prism', 'triangular', 'High-Index Prism (n=1.65)', { x: 420, y: 280 }, 0, { size: 120, refractiveIndex: 1.65 }));
    comps.push(makeComp('screen', '', 'Observation Screen', { x: 680, y: 220 }, 80, { width: 150 }));
  } else if (num === '005' || title.includes('dispersion') || title.includes('prism')) {
    // Dispersion through Prism
    comps.push(makeComp('white_light', '', 'Broadband White Light Source', { x: 140, y: 240 }, 0, { beamWidth: 22, beamDivergence: 10, isOn: true }));
    comps.push(makeComp('prism', 'triangular', 'Flint Glass Dispersive Prism', { x: 380, y: 240 }, 15, { size: 110, refractiveIndex: 1.66 }));
    comps.push(makeComp('screen', '', 'Spectrum Screen', { x: 700, y: 270 }, 80, { width: 200 }));
  } else if (num === '006' || title.includes('convex lens') || (title.includes('focal') && !title.includes('concave'))) {
    // Convex Lens Focal Point
    comps.push(makeComp('laser', 'green', 'Multi-Ray Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 24, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Double Convex Lens (f=150mm)', { x: 380, y: 250 }, 0, { focalLength: 150, diameter: 90, thickness: 18, refractiveIndex: 1.52 }));
    comps.push(makeComp('screen', '', 'Focal Plane Screen', { x: 530, y: 250 }, 90, { width: 140 }));
  } else if (num === '007' || title.includes('concave lens')) {
    // Concave Lens Divergence
    comps.push(makeComp('laser', 'green', 'Multi-Ray Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 20, isOn: true }));
    comps.push(makeComp('lens', 'concave', 'Double Concave Lens (f=-120mm)', { x: 380, y: 250 }, 0, { focalLength: -120, diameter: 80, thickness: 18, refractiveIndex: 1.52 }));
    comps.push(makeComp('screen', '', 'Projection Screen', { x: 680, y: 250 }, 90, { width: 180 }));
  } else if (title.includes('concave mirror')) {
    // Concave Mirror
    comps.push(makeComp('laser', 'red', 'Collimated Laser (650nm)', { x: 150, y: 230 }, 0, { wavelength: 650, power: 5, beamWidth: 16, isOn: true }));
    comps.push(makeComp('mirror', 'concave', 'Spherical Concave Mirror', { x: 520, y: 250 }, 180, { width: 120, focalLength: 130, reflectivity: 1.0 }));
    comps.push(makeComp('screen', '', 'Image Plane Screen', { x: 320, y: 260 }, 90, { width: 100 }));
  } else if (title.includes('convex mirror')) {
    // Convex Mirror
    comps.push(makeComp('laser', 'red', 'Laser Source (650nm)', { x: 150, y: 250 }, 0, { wavelength: 650, power: 5, beamWidth: 18, isOn: true }));
    comps.push(makeComp('mirror', 'convex', 'Spherical Convex Mirror', { x: 480, y: 250 }, 180, { width: 120, focalLength: -120, reflectivity: 1.0 }));
    comps.push(makeComp('screen', '', 'Divergence Screen', { x: 220, y: 380 }, 45, { width: 120 }));
  } else if (title.includes('beam expander') || title.includes('telescope') || title.includes('collimat')) {
    // Beam Expander (Keplerian)
    comps.push(makeComp('laser', 'green', 'Narrow Beam Laser (532nm)', { x: 120, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 10, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Objective Lens (f=60mm)', { x: 280, y: 250 }, 0, { focalLength: 60, diameter: 50, thickness: 14 }));
    comps.push(makeComp('lens', 'convex', 'Collimating Lens (f=180mm)', { x: 520, y: 250 }, 0, { focalLength: 180, diameter: 100, thickness: 22 }));
    comps.push(makeComp('screen', '', 'Expanded Beam Screen', { x: 740, y: 250 }, 90, { width: 160 }));
  } else if (title.includes('cylindrical')) {
    // Cylindrical Lens
    comps.push(makeComp('laser', 'green', 'Laser Source (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 20, isOn: true }));
    comps.push(makeComp('lens', 'cylindrical', 'Planoconvex Cylindrical Lens', { x: 380, y: 250 }, 0, { focalLength: 120, diameter: 80, thickness: 16 }));
    comps.push(makeComp('screen', '', 'Astigmatic Focal Screen', { x: 580, y: 250 }, 90, { width: 140 }));
  } else if (title.includes('fiber') || title.includes('waveguide')) {
    // Optical Fiber Waveguide
    comps.push(makeComp('laser', 'red', 'He-Ne Laser (632.8nm)', { x: 120, y: 242 }, 8, { wavelength: 632.8, power: 5, beamWidth: 10, isOn: true }));
    comps.push(makeComp('medium', 'transparent', 'Optical Fiber Core (n=1.62)', { x: 420, y: 250 }, 0, { width: 340, height: 44, refractiveIndex: 1.62 }));
    comps.push(makeComp('detector', '', 'Output Power Sensor', { x: 680, y: 250 }, 90, { width: 70 }));
  } else if (title.includes('brewster')) {
    // Brewster's Angle
    comps.push(makeComp('laser', 'red', 'Polarized Laser (632.8nm)', { x: 160, y: 170 }, 34, { wavelength: 632.8, power: 5, beamWidth: 12, isOn: true }));
    comps.push(makeComp('medium', 'transparent', 'Dielectric Window (n=1.50)', { x: 420, y: 270 }, 0, { width: 160, height: 90, refractiveIndex: 1.50 }));
    comps.push(makeComp('detector', '', 'Reflected Wave Detector', { x: 620, y: 150 }, 146, { width: 70 }));
  } else if (title.includes('retroreflector') || title.includes('corner cube')) {
    // Retroreflector
    comps.push(makeComp('laser', 'green', 'Green Laser (532nm)', { x: 140, y: 220 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('prism', 'triangular', '90° Porro / Retro Prism', { x: 450, y: 250 }, 45, { size: 110, refractiveIndex: 1.52 }));
    comps.push(makeComp('screen', '', 'Return Path Screen', { x: 140, y: 280 }, 90, { width: 100 }));
  }

  // 2. Wave Optics & Interference (016 - 030)
  else if (num === '016' || title.includes('double slit') || title.includes('young')) {
    comps.push(makeComp('laser', 'green', 'Single-Mode Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 16, isOn: true }));
    comps.push(makeComp('double_slit', '', 'Young Double-Slit (d=24µm)', { x: 380, y: 250 }, 0, { width: 120, slitWidth: 6, slitSpacing: 24 }));
    comps.push(makeComp('screen', '', 'Interference Fringe Screen', { x: 720, y: 250 }, 90, { width: 220 }));
  } else if (num === '017' || title.includes('single slit')) {
    comps.push(makeComp('laser', 'red', 'He-Ne Laser (632.8nm)', { x: 140, y: 250 }, 0, { wavelength: 632.8, power: 5, beamWidth: 16, isOn: true }));
    comps.push(makeComp('single_slit', '', 'Precision Slit (a=10µm)', { x: 380, y: 250 }, 0, { width: 120, slitWidth: 10 }));
    comps.push(makeComp('screen', '', 'Diffraction Pattern Screen', { x: 720, y: 250 }, 90, { width: 200 }));
  } else if (num === '018' || title.includes('grating')) {
    comps.push(makeComp('laser', 'green', 'Multi-Order Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('grating', '', 'Diffraction Grating (600 L/mm)', { x: 380, y: 250 }, 0, { width: 120, gratingDensity: 600 }));
    comps.push(makeComp('screen', '', 'Diffraction Orders Screen', { x: 720, y: 250 }, 90, { width: 240 }));
  } else if (num === '019' || title.includes('aperture') || title.includes('airy')) {
    comps.push(makeComp('laser', 'green', 'Gaussian Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 16, isOn: true }));
    comps.push(makeComp('aperture', '', 'Circular Pinhole Aperture', { x: 380, y: 250 }, 0, { width: 120, slitWidth: 12 }));
    comps.push(makeComp('screen', '', 'Airy Disk Observation Screen', { x: 720, y: 250 }, 90, { width: 180 }));
  } else if (num === '020' || title.includes('michelson')) {
    // Michelson Interferometer
    comps.push(makeComp('laser', 'red', 'He-Ne Laser (632.8nm)', { x: 140, y: 250 }, 0, { wavelength: 632.8, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('mirror', 'partial', '50/50 Beam Splitter', { x: 350, y: 250 }, 45, { width: 90, reflectivity: 0.5 }));
    comps.push(makeComp('mirror', 'plane', 'Reference Mirror M1', { x: 350, y: 110 }, 0, { width: 100, reflectivity: 1.0 }));
    comps.push(makeComp('mirror', 'plane', 'Movable Mirror M2', { x: 530, y: 250 }, 90, { width: 100, reflectivity: 1.0 }));
    comps.push(makeComp('detector', '', 'Interference Fringe Detector', { x: 350, y: 410 }, 0, { width: 90 }));
  } else if (num === '021' || title.includes('mach-zehnder')) {
    // Mach-Zehnder Interferometer
    comps.push(makeComp('laser', 'green', 'Laser Source (532nm)', { x: 140, y: 200 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('mirror', 'partial', 'Beam Splitter BS1', { x: 300, y: 200 }, 45, { width: 80, reflectivity: 0.5 }));
    comps.push(makeComp('mirror', 'plane', 'Turn Mirror M1', { x: 300, y: 380 }, 45, { width: 80, reflectivity: 1.0 }));
    comps.push(makeComp('mirror', 'plane', 'Turn Mirror M2', { x: 520, y: 200 }, 45, { width: 80, reflectivity: 1.0 }));
    comps.push(makeComp('mirror', 'partial', 'Beam Combiner BS2', { x: 520, y: 380 }, 45, { width: 80, reflectivity: 0.5 }));
    comps.push(makeComp('detector', '', 'Photodiode Detector D1', { x: 670, y: 380 }, 90, { width: 70 }));
  } else if (num === '022' || title.includes('sagnac')) {
    // Sagnac Ring Interferometer
    comps.push(makeComp('laser', 'green', 'Laser Source (532nm)', { x: 140, y: 220 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('mirror', 'partial', 'Beam Splitter BS', { x: 320, y: 220 }, 45, { width: 80, reflectivity: 0.5 }));
    comps.push(makeComp('mirror', 'plane', 'Corner Mirror M1', { x: 520, y: 150 }, 60, { width: 80, reflectivity: 1.0 }));
    comps.push(makeComp('mirror', 'plane', 'Corner Mirror M2', { x: 520, y: 350 }, 120, { width: 80, reflectivity: 1.0 }));
    comps.push(makeComp('detector', '', 'Gyroscope Detector', { x: 320, y: 380 }, 0, { width: 80 }));
  } else if (num === '023' || title.includes('fabry-perot') || title.includes('cavity')) {
    // Fabry-Perot Cavity
    comps.push(makeComp('laser', 'red', 'Single-Frequency Laser', { x: 140, y: 250 }, 0, { wavelength: 632.8, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('mirror', 'partial', 'Partial Mirror M1 (R=90%)', { x: 320, y: 250 }, 90, { width: 100, reflectivity: 0.9 }));
    comps.push(makeComp('mirror', 'partial', 'Partial Mirror M2 (R=90%)', { x: 500, y: 250 }, 90, { width: 100, reflectivity: 0.9 }));
    comps.push(makeComp('detector', '', 'Cavity Transmission Detector', { x: 660, y: 250 }, 90, { width: 80 }));
  } else if (num === '024' || title.includes('newton')) {
    // Newton's Rings
    comps.push(makeComp('laser', 'red', 'He-Ne Laser (632.8nm)', { x: 140, y: 250 }, 0, { wavelength: 632.8, power: 5, beamWidth: 16, isOn: true }));
    comps.push(makeComp('mirror', 'partial', '45° Beam Splitter', { x: 340, y: 250 }, 45, { width: 90, reflectivity: 0.5 }));
    comps.push(makeComp('lens', 'plano-convex', 'Plano-Convex Lens on Flat Plate', { x: 340, y: 130 }, 0, { focalLength: 300, diameter: 80, thickness: 14 }));
    comps.push(makeComp('screen', '', 'Ring Pattern Screen', { x: 340, y: 400 }, 0, { width: 140 }));
  }

  // 3. Polarization & EM Optics (031 - 040)
  else if (cat === 'polarization' || title.includes('polariz') || title.includes('malus') || title.includes('birefr')) {
    comps.push(makeComp('laser', 'green', 'Linearly Polarized Laser', { x: 140, y: 250 }, 0, { wavelength: 532, power: 5, beamWidth: 14, isOn: true }));
    comps.push(makeComp('medium', 'transparent', 'Input Polarizer (0°)', { x: 320, y: 250 }, 0, { width: 30, height: 90, refractiveIndex: 1.5 }));
    comps.push(makeComp('medium', 'transparent', 'Analyzing Polarizer (θ)', { x: 480, y: 250 }, 0, { width: 30, height: 90, refractiveIndex: 1.5 }));
    comps.push(makeComp('detector', '', 'Optical Power Meter', { x: 660, y: 250 }, 90, { width: 80 }));
  }

  // 4. Laser Physics & Resonators (041 - 055)
  else if (cat === 'laser_physics' || title.includes('laser cavity') || title.includes('resonator') || title.includes('diode laser') || title.includes('he-ne')) {
    comps.push(makeComp('mirror', 'plane', 'High Reflector (R=99.9%)', { x: 180, y: 250 }, 90, { width: 100, reflectivity: 0.999 }));
    comps.push(makeComp('medium', 'transparent', 'Active Laser Gain Medium', { x: 340, y: 250 }, 0, { width: 180, height: 60, refractiveIndex: 1.82 }));
    comps.push(makeComp('mirror', 'partial', 'Output Coupler (R=95%)', { x: 500, y: 250 }, 90, { width: 100, reflectivity: 0.95 }));
    comps.push(makeComp('laser', 'red', 'Coherent Laser Output (632.8nm)', { x: 520, y: 250 }, 0, { wavelength: 632.8, power: 8, beamWidth: 14, isOn: true }));
    comps.push(makeComp('detector', '', 'Laser Power Meter', { x: 720, y: 250 }, 90, { width: 80 }));
  }

  // 5. Advanced Laser Technology (056 - 065)
  else if (cat === 'advanced_laser') {
    comps.push(makeComp('laser', 'green', 'Seed Oscillator Laser', { x: 140, y: 250 }, 0, { wavelength: 532, power: 6, beamWidth: 14, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Coupling Microscope Lens', { x: 300, y: 250 }, 0, { focalLength: 80, diameter: 60, thickness: 14 }));
    comps.push(makeComp('medium', 'transparent', 'Fiber Amplifier / Micro-cavity', { x: 450, y: 250 }, 0, { width: 160, height: 50, refractiveIndex: 1.48 }));
    comps.push(makeComp('lens', 'convex', 'Output Collimating Lens', { x: 600, y: 250 }, 0, { focalLength: 100, diameter: 70, thickness: 16 }));
    comps.push(makeComp('detector', '', 'Spectrometer Detector', { x: 740, y: 250 }, 90, { width: 80 }));
  }

  // 6. Nonlinear Optics (066 - 075)
  else if (cat === 'nonlinear' || title.includes('harmonic') || title.includes('shg') || title.includes('z-scan') || title.includes('raman')) {
    comps.push(makeComp('laser', 'red', 'Pulsed Laser (1064nm IR)', { x: 140, y: 250 }, 0, { wavelength: 650, power: 10, beamWidth: 16, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Focusing Objective', { x: 300, y: 250 }, 0, { focalLength: 100, diameter: 70, thickness: 16 }));
    comps.push(makeComp('prism', 'triangular', 'Nonlinear BBO Crystal', { x: 450, y: 250 }, 30, { size: 90, refractiveIndex: 1.67 }));
    comps.push(makeComp('detector', '', 'Second Harmonic Detector (532nm)', { x: 720, y: 250 }, 90, { width: 80 }));
  }

  // 7. Spectroscopy & Photonics (076 - 085)
  else if (cat === 'spectroscopy' || title.includes('spectroscop') || title.includes('absorption') || title.includes('fluorescence')) {
    comps.push(makeComp('white_light', '', 'Tunable Laser / Light Source', { x: 140, y: 250 }, 0, { beamWidth: 16, beamDivergence: 0, isOn: true }));
    comps.push(makeComp('medium', 'absorbing', 'Chemical Gas Absorption Cell', { x: 350, y: 250 }, 0, { width: 150, height: 70, refractiveIndex: 1.33, absorptionCoefficient: 0.02 }));
    comps.push(makeComp('grating', '', 'Spectrometer Monochromator Grating', { x: 530, y: 250 }, 0, { width: 110, gratingDensity: 1200 }));
    comps.push(makeComp('detector', '', 'Calibrated Silicon Detector', { x: 720, y: 250 }, 90, { width: 80 }));
  }

  // 8. Laser-Matter & Materials Processing (086 - 093)
  else if (cat === 'materials' || title.includes('cutting') || title.includes('welding') || title.includes('cleaning') || title.includes('drilling') || title.includes('material')) {
    comps.push(makeComp('laser', 'red', 'High-Power Fiber Laser (1.5 kW)', { x: 140, y: 250 }, 0, { wavelength: 650, power: 10, beamWidth: 20, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Cutting Head Focusing Nozzle', { x: 340, y: 250 }, 0, { focalLength: 120, diameter: 80, thickness: 20 }));
    comps.push(makeComp('medium', 'absorbing', 'Steel / Titanium Specimen Block', { x: 520, y: 250 }, 0, { width: 140, height: 110, absorptionCoefficient: 0.1, refractiveIndex: 2.2 }));
    comps.push(makeComp('detector', '', 'Melt Pool Thermal Pyrometer', { x: 680, y: 150 }, 135, { width: 70 }));
  }

  // 9. Biomedical Applications (094 - 100)
  else {
    comps.push(makeComp('laser', 'green', 'Biomedical Surgical Laser (532nm)', { x: 140, y: 250 }, 0, { wavelength: 532, power: 7, beamWidth: 14, isOn: true }));
    comps.push(makeComp('lens', 'convex', 'Achromatic Delivery Objective', { x: 320, y: 250 }, 0, { focalLength: 110, diameter: 70, thickness: 16 }));
    comps.push(makeComp('medium', 'absorbing', 'Tissue Phantom Specimen (Skin/Cornea)', { x: 480, y: 250 }, 0, { width: 140, height: 90, absorptionCoefficient: 0.03, refractiveIndex: 1.38 }));
    comps.push(makeComp('detector', '', 'Diffuse Backscatter Sensor', { x: 360, y: 390 }, 45, { width: 80 }));
  }

  exp.components = comps;
});

// Write updated catalog back
const outputCode = `/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq | College of Laser Science and Technology
 * Complete 100 Experiments Catalog Database (001 - 100) with Pre-Configured Optical Setups
 */

const EXPERIMENTS_DATABASE = ${JSON.stringify(EXPERIMENTS_DATABASE, null, 2)};

if (typeof window !== 'undefined') {
  window.EXPERIMENTS_DATABASE = EXPERIMENTS_DATABASE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EXPERIMENTS_DATABASE;
}
`;

fs.writeFileSync(catalogPath, outputCode, 'utf8');
console.log('Successfully saved 100 experiments with pre-configured setups to', catalogPath);
