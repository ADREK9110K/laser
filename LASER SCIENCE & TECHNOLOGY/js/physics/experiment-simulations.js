/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq | College of Laser Science and Technology
 * Complete 100-Experiment Interactive Simulations Manager
 */

const ExperimentSimulations = {
  // Generates dedicated optical table setup for ANY of the 100 experiments
  setupExperimentOnBench(bench, exp, params = {}) {
    bench.components = [];
    const w = bench.canvas.width;
    const h = bench.canvas.height;
    const midY = h / 2;
    const simType = exp.simType || 'reflection';
    const p = { ...exp.defaultParams, ...params };

    // Common source color helper
    const getWlColor = (wl) => {
      if (wl < 430) return "#8b5cf6"; // Violet
      if (wl < 490) return "#00d4ff"; // Blue
      if (wl < 560) return "#00ff77"; // Green
      if (wl < 600) return "#f59e0b"; // Yellow
      if (wl < 750) return "#ff1a40"; // Red
      return "#e11d48"; // Infrared
    };

    const laserColor = getWlColor(p.wavelength || 632.8);

    // ========================================================
    // CATEGORY 1: FUNDAMENTAL OPTICS (001 - 015)
    // ========================================================
    if (simType === 'reflection') {
      const theta = p.incidentAngle !== undefined ? p.incidentAngle : 45;
      bench.components.push(
        { id: "src", type: "laser", name: "He-Ne Laser (632.8nm)", x: 100, y: midY, angle: 0, wavelength: 632.8, power: p.power || 5.0, color: "#ff1a40" },
        { id: "mir", type: "mirror", name: "Kinematic Plane Mirror", x: 400, y: midY, angle: 90 + theta / 2, reflectivity: p.mirrorReflectivity || 0.99 },
        { id: "det", type: "detector", name: "Silicon Photodiode", x: 400 + 260 * Math.cos((theta * Math.PI) / 180), y: midY + 260 * Math.sin((theta * Math.PI) / 180), angle: 180 - theta, measuredPower: 0 }
      );
    } else if (simType === 'refraction' || simType === 'tir') {
      const theta = p.incidentAngle !== undefined ? p.incidentAngle : 35;
      bench.components.push(
        { id: "src", type: "laser", name: "Laser Source", x: 120, y: midY, angle: theta, wavelength: p.wavelength || 532, power: 10, color: laserColor },
        { id: "prism", type: "prism", name: "Refractive Boundary", x: 400, y: midY, angle: 90, n1: p.n1 || 1.0, n2: p.n2 || 1.5168 },
        { id: "det", type: "detector", name: "Power Meter", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'mirror_imaging' || simType === 'curved_mirror') {
      bench.components.push(
        { id: "src1", type: "laser", name: "Ray 1 (Axis)", x: 100, y: midY - 15, angle: 0, wavelength: 632.8, power: 3, color: "#ff1a40" },
        { id: "src2", type: "laser", name: "Ray 2 (Off-axis)", x: 100, y: midY + 15, angle: 5, wavelength: 632.8, power: 3, color: "#ff1a40" },
        { id: "mir", type: "mirror", name: exp.title, x: 450, y: midY, angle: 90, reflectivity: 0.99 },
        { id: "scr", type: "target", name: "Image Screen", x: 250, y: midY, angle: 90 }
      );
    } else if (simType === 'thin_lens' || simType === 'apparent_depth') {
      const f = p.focalLength || 120;
      bench.components.push(
        { id: "src1", type: "laser", name: "Upper Ray", x: 100, y: midY - 25, angle: 0, wavelength: 632.8, power: 5, color: "#ff1a40" },
        { id: "src2", type: "laser", name: "Central Ray", x: 100, y: midY, angle: 0, wavelength: 632.8, power: 5, color: "#ff1a40" },
        { id: "src3", type: "laser", name: "Lower Ray", x: 100, y: midY + 25, angle: 0, wavelength: 632.8, power: 5, color: "#ff1a40" },
        { id: "lens", type: "lens", name: "Biconvex Lens", x: 380, y: midY, angle: 90, focalLength: f },
        { id: "det", type: "target", name: "Focal Plane Screen", x: 380 + f, y: midY, angle: 90 }
      );
    } else if (simType === 'prism_dispersion') {
      bench.components.push(
        { id: "src", type: "laser", name: "White/Broadband Beam", x: 100, y: midY, angle: p.incidentAngle || 48, wavelength: 550, power: 15, color: "#fef08a" },
        { id: "prism", type: "prism", name: "Equilateral Flint Prism", x: 380, y: midY, angle: 60 },
        { id: "det", type: "target", name: "Spectral Dispersion Screen", x: 680, y: midY + 60, angle: 120 }
      );
    } else if (simType === 'fiber_na' || simType === 'fiber_guidance' || simType === 'fiber_bending') {
      bench.components.push(
        { id: "src", type: "laser", name: "Launch Laser Diode", x: 100, y: midY, angle: p.launchAngle || 0, wavelength: 632.8, power: p.inputPower || 10, color: "#ff1a40" },
        { id: "lens", type: "lens", name: "Fiber Coupler Objective", x: 260, y: midY, angle: 90, focalLength: 30 },
        { id: "fiber", type: "beamsplitter", name: "Optical Fiber Cable Core", x: 440, y: midY, angle: 90 },
        { id: "det", type: "detector", name: "Optical Power Meter", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 2: WAVE OPTICS AND INTERFERENCE (016 - 030)
    // ========================================================
    else if (simType === 'double_slit' || simType === 'single_slit' || simType === 'multi_slit' || simType === 'grating' || simType === 'airy_disk' || simType === 'fresnel') {
      bench.components.push(
        { id: "src", type: "laser", name: "Collimated Laser", x: 100, y: midY, angle: 0, wavelength: p.wavelength || 632.8, power: 8, color: laserColor },
        { id: "aperture", type: "beamsplitter", name: exp.title, x: 350, y: midY, angle: 90 },
        { id: "screen", type: "target", name: "Observation Screen", x: 680, y: midY, angle: 90 }
      );
    } else if (simType === 'michelson') {
      bench.components.push(
        { id: "src", type: "laser", name: "He-Ne Laser (632.8nm)", x: 120, y: midY, angle: 0, wavelength: 632.8, power: 10, color: "#ff1a40" },
        { id: "bs", type: "beamsplitter", name: "50:50 Cube Splitter", x: 380, y: midY, angle: 45, splitRatio: 0.5 },
        { id: "mir_ref", type: "mirror", name: "Reference Mirror", x: 380, y: midY - 180, angle: 0, reflectivity: 0.99 },
        { id: "mir_sample", type: "mirror", name: "Piezo Moving Mirror", x: 560, y: midY, angle: 90, reflectivity: 0.99 },
        { id: "det", type: "detector", name: "Fringe Photodetector", x: 380, y: midY + 180, angle: 270, measuredPower: 0 }
      );
    } else if (simType === 'mach_zehnder') {
      bench.components.push(
        { id: "src", type: "laser", name: "Laser Source", x: 100, y: midY + 80, angle: 0, wavelength: 632.8, power: 10, color: "#ff1a40" },
        { id: "bs1", type: "beamsplitter", name: "BS 1", x: 260, y: midY + 80, angle: 45 },
        { id: "mir1", type: "mirror", name: "Mirror 1", x: 260, y: midY - 80, angle: 45 },
        { id: "mir2", type: "mirror", name: "Mirror 2", x: 520, y: midY + 80, angle: 45 },
        { id: "bs2", type: "beamsplitter", name: "BS 2 Recombiner", x: 520, y: midY - 80, angle: 45 },
        { id: "det", type: "detector", name: "Interferometer Detector", x: 680, y: midY - 80, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'fabry_perot') {
      bench.components.push(
        { id: "src", type: "laser", name: "Single-Frequency Laser", x: 100, y: midY, angle: 0, wavelength: 632.8, power: 10, color: "#ff1a40" },
        { id: "mir1", type: "mirror", name: "Etalon Front Mirror", x: 360, y: midY, angle: 90, reflectivity: p.mirrorReflectivity || 0.95 },
        { id: "mir2", type: "mirror", name: "Etalon Rear Mirror", x: 420, y: midY, angle: 90, reflectivity: p.mirrorReflectivity || 0.95 },
        { id: "det", type: "detector", name: "Transmission Sensor", x: 660, y: midY, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'newtons_rings' || simType === 'thin_film' || simType === 'wedge_film' || simType === 'coherence' || simType === 'spatial_coherence' || simType === 'temporal_coherence') {
      bench.components.push(
        { id: "src", type: "laser", name: "Monochromatic Source", x: 100, y: midY, angle: 0, wavelength: p.wavelength || 589, power: 10, color: laserColor },
        { id: "bs", type: "beamsplitter", name: "Partial Reflector", x: 380, y: midY, angle: 45 },
        { id: "sample", type: "mirror", name: exp.title, x: 380, y: midY - 160, angle: 0 },
        { id: "det", type: "detector", name: "CCD Fringe Imager", x: 380, y: midY + 160, angle: 270, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 3: POLARIZATION & EM OPTICS (031 - 040)
    // ========================================================
    else if (simType.includes('pol') || simType === 'malus' || simType === 'brewster' || simType.includes('waveplate') || simType === 'optical_activity' || simType === 'birefringence' || simType === 'photoelasticity') {
      bench.components.push(
        { id: "src", type: "laser", name: "Laser Source", x: 100, y: midY, angle: 0, wavelength: 632.8, power: 10, color: "#ff1a40" },
        { id: "pol1", type: "beamsplitter", name: "Linear Polarizer", x: 280, y: midY, angle: 90 },
        { id: "sample", type: "prism", name: exp.title, x: 440, y: midY, angle: 90 },
        { id: "analyzer", type: "beamsplitter", name: "Analyzer", x: 560, y: midY, angle: 90 },
        { id: "det", type: "detector", name: "Power Meter", x: 700, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 4 & 5: LASER PHYSICS & ADVANCED LASERS (041 - 065)
    // ========================================================
    else if (simType === 'ndyag_system' || simType === 'three_level' || simType === 'four_level' || simType === 'laser_threshold' || simType === 'resonator_stability' || simType === 'q_switching' || simType === 'mode_locking') {
      bench.components.push(
        { id: "pump", type: "laser", name: "808nm Pump Diode", x: 100, y: midY, angle: 0, wavelength: 808, power: p.pumpPower || 1500, color: "#e11d48" },
        { id: "m1", type: "mirror", name: "HR Cavity Mirror (R>99.9%)", x: 260, y: midY, angle: 90, reflectivity: 0.999 },
        { id: "crystal", type: "prism", name: "Nd:YAG Active Rod", x: 380, y: midY, angle: 90 },
        { id: "m2", type: "mirror", name: "Output Coupler (R=92%)", x: 500, y: midY, angle: 90, reflectivity: 0.92 },
        { id: "det", type: "detector", name: "Laser Power Meter", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'gaussian_beam' || simType === 'beam_quality' || simType === 'transverse_modes') {
      bench.components.push(
        { id: "src", type: "laser", name: "TEM00 Laser", x: 100, y: midY, angle: 0, wavelength: 632.8, power: 5, color: "#ff1a40" },
        { id: "lens", type: "lens", name: "Focusing Beam Waist Lens", x: 300, y: midY, angle: 90, focalLength: 80 },
        { id: "profiler", type: "detector", name: "CCD Beam Profiler", x: 300 + (p.zPos || 200), y: midY, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'hene_gas' || simType === 'co2_laser' || simType === 'excimer_laser') {
      bench.components.push(
        { id: "src", type: "laser", name: "Discharge Plasma Tube", x: 220, y: midY, angle: 0, wavelength: p.wavelength || 632.8, power: 15, color: laserColor },
        { id: "optics", type: "prism", name: "Brewster Window", x: 420, y: midY, angle: 56.6 },
        { id: "det", type: "detector", name: "Output Power Detector", x: 660, y: midY, angle: 180, measuredPower: 0 }
      );
    } else if (simType === 'diode_pi' || simType === 'fiber_laser_arch' || simType === 'ti_sapphire' || simType === 'fel_physics' || simType === 'cpa_amplifier' || simType === 'dispersion_comp') {
      bench.components.push(
        { id: "src", type: "laser", name: "Ultrafast / Accelerator Source", x: 100, y: midY, angle: 0, wavelength: p.wavelength || 800, power: 50, color: laserColor },
        { id: "stage1", type: "beamsplitter", name: "Stretcher / Undulator", x: 320, y: midY, angle: 90 },
        { id: "stage2", type: "prism", name: "Amplifier / Compressor", x: 500, y: midY, angle: 90 },
        { id: "det", type: "detector", name: "Autocorrelator / Sensor", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 6: NONLINEAR OPTICS (066 - 075)
    // ========================================================
    else if (simType.includes('nonlinear') || simType.includes('shg') || simType.includes('thg') || simType.includes('mixing') || simType.includes('opa') || simType.includes('opo') || simType.includes('kerr') || simType.includes('focusing') || simType.includes('broadening')) {
      bench.components.push(
        { id: "pump", type: "laser", name: "Fundamental 1064nm Laser", x: 100, y: midY, angle: 0, wavelength: 1064, power: p.fundamentalPower || 200, color: "#ff1a40" },
        { id: "lens1", type: "lens", name: "Focusing Lens", x: 260, y: midY, angle: 90, focalLength: 100 },
        { id: "crystal", type: "prism", name: "Nonlinear BBO Crystal", x: 400, y: midY, angle: p.crystalAngleDeg || 22.8 },
        { id: "filter", type: "beamsplitter", name: "Dichroic Filter", x: 540, y: midY, angle: 90 },
        { id: "det", type: "detector", name: "Harmonic Sensor (532nm)", x: 700, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 7: SPECTROSCOPY & PHOTONICS (076 - 085)
    // ========================================================
    else if (simType === 'beer_lambert' || simType === 'fluorescence' || simType === 'raman_spec' || simType === 'ftir_spec' || simType === 'atomic_emission' || simType === 'tauc_bandgap' || simType === 'libs_spectroscopy' || simType === 'fiber_comm' || simType === 'wdm_system' || simType === 'fbg_sensing') {
      bench.components.push(
        { id: "src", type: "laser", name: "Probe / Excitation Laser", x: 100, y: midY, angle: 0, wavelength: p.wavelength || 532, power: 20, color: laserColor },
        { id: "cuvette", type: "prism", name: "Sample Cell / Target", x: 340, y: midY, angle: 90 },
        { id: "spec", type: "beamsplitter", name: "Spectrometer Grating", x: 500, y: midY, angle: 45 },
        { id: "det", type: "detector", name: "Array Spectrometer", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 8: LASER-MATTER & PROCESSING (086 - 093)
    // ========================================================
    else if (simType.includes('ablation') || simType.includes('plasma') || simType.includes('heating') || simType.includes('welding') || simType.includes('cutting') || simType.includes('peening') || simType.includes('pld')) {
      bench.components.push(
        { id: "laser", type: "laser", name: "High-Power Pulsed Laser", x: 100, y: midY, angle: 0, wavelength: 1064, power: p.laserPowerW || 500, color: "#ff1a40" },
        { id: "mir", type: "mirror", name: "Steering Mirror", x: 300, y: midY, angle: 45 },
        { id: "lens", type: "lens", name: "F-Theta Objective", x: 300, y: midY + 120, angle: 0, focalLength: 80 },
        { id: "target", type: "prism", name: "Material Target Chamber", x: 300, y: midY + 220, angle: 0 },
        { id: "det", type: "detector", name: "Plume Diagnostic Sensor", x: 520, y: midY + 220, angle: 180, measuredPower: 0 }
      );
    }

    // ========================================================
    // CATEGORY 9: BIOMEDICAL LASER APPLICATIONS (094 - 100)
    // ========================================================
    else if (simType.includes('tissue') || simType.includes('photothermal') || simType.includes('pdt') || simType.includes('skin') || simType.includes('ophthalmic') || simType.includes('oct')) {
      bench.components.push(
        { id: "med_laser", type: "laser", name: "Medical Laser (810/1064nm)", x: 100, y: midY, angle: 0, wavelength: p.wavelength || 810, power: 100, color: "#e11d48" },
        { id: "delivery", type: "lens", name: "Focusing Handpiece Lens", x: 300, y: midY, angle: 90, focalLength: 60 },
        { id: "phantom", type: "prism", name: "Tissue Phantom / Cornea", x: 440, y: midY, angle: 90 },
        { id: "sensor", type: "detector", name: "Backscatter / Thermal Sensor", x: 660, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    // Default fallback: Always build an active 3-component setup so NO experiment is ever empty
    else {
      bench.components.push(
        { id: "src", type: "laser", name: "Laser Source", x: 120, y: midY, angle: 0, wavelength: p.wavelength || 632.8, power: 5.0, color: laserColor },
        { id: "elem", type: "prism", name: exp.title, x: 400, y: midY, angle: 90 },
        { id: "det", type: "detector", name: "Optical Detector", x: 680, y: midY, angle: 180, measuredPower: 0 }
      );
    }

    bench.traceRays();
    bench.render();
  }
};

window.ExperimentSimulations = ExperimentSimulations;
