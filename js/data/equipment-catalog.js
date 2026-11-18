/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Equipment Library Catalog (50+ Real Scientific Instruments)
 */

const EQUIPMENT_CATALOG = {
  sources: [
    {
      id: "src_hene",
      name: "He-Ne Gas Laser (Helium-Neon)",
      nameAr: "ليزر الهيليوم-نيون الغازي",
      category: "gas_laser",
      wavelength: 632.8, // nm
      power: 5.0, // mW
      beamDiameter: 1.0, // mm
      divergence: 1.2, // mrad
      profile: "TEM00",
      coherenceLength: 300, // mm
      polarization: "linear",
      color: "#ff1a40",
      icon: "laser-tube",
      description: "Continuous wave gas discharge laser operating at 632.8 nm with high spatial coherence and TEM00 single transverse mode."
    },
    {
      id: "src_ndyag_cw",
      name: "Nd:YAG Solid-State Laser (1064 nm / 532 nm)",
      nameAr: "ليزر الحالة الصلبة Nd:YAG",
      category: "solid_state",
      wavelength: 1064,
      shgWavelength: 532,
      power: 500, // mW
      beamDiameter: 2.0,
      divergence: 1.5,
      profile: "TEM00",
      polarization: "linear",
      color: "#00ff77", // Green when frequency doubled
      icon: "laser-box",
      description: "Neodymium-doped Yttrium Aluminum Garnet laser capable of fundamental 1064 nm IR output and frequency-doubled 532 nm green emission."
    },
    {
      id: "src_diode_blue",
      name: "Semiconductor Diode Laser (GaN 405 nm)",
      nameAr: "ليزر شبه الموصل (دايود أزرق/بنفسجي)",
      category: "semiconductor",
      wavelength: 405,
      power: 50,
      beamDiameter: 1.5,
      divergence: 2.5,
      profile: "Elliptical",
      polarization: "linear",
      color: "#6b21a8",
      icon: "diode",
      description: "Gallium Nitride blue-violet laser diode featuring compact footprint, direct electrical modulation, and high photon energy."
    },
    {
      id: "src_tisapphire",
      name: "Ti:Sapphire Ultrafast Femtosecond Laser",
      nameAr: "ليزر تيتانيوم-ياقوت فائق السرعة (فيمتوثانية)",
      category: "ultrafast",
      wavelength: 800,
      pulseDuration: 100, // fs
      repRate: 80, // MHz
      pulseEnergy: 10, // nJ
      peakPower: 100, // kW
      bandwidth: 30, // nm
      color: "#e11d48",
      icon: "ultrafast",
      description: "Titanium-doped sapphire laser delivering broadband femtosecond pulses for nonlinear optics and time-resolved spectroscopy."
    },
    {
      id: "src_co2",
      name: "CO2 Molecular Gas Laser (10.6 µm)",
      nameAr: "ليزر ثنائي أكسيد الكربون الجزيئي",
      category: "gas_laser",
      wavelength: 10600, // nm
      power: 25000, // mW
      beamDiameter: 4.0,
      divergence: 2.0,
      profile: "TEM00",
      color: "#991b1b",
      icon: "laser-tube",
      description: "High-power mid-infrared molecular laser operating between vibrational-rotational levels of CO2 for material processing and tissue ablation."
    },
    {
      id: "src_white_light",
      name: "Halogen / Xenon Broadband Light Source",
      nameAr: "مصدر ضوء هالوجين / زينون عريض النطاق",
      category: "broadband",
      wavelengthRange: [380, 780],
      power: 2000,
      divergence: 25.0,
      profile: "Diffuse",
      color: "#fef08a",
      icon: "lamp",
      description: "Incoherent blackbody-like spectrum emitter covering full visible and near-IR range for dispersion and absorption spectroscopy."
    },
    {
      id: "src_argon",
      name: "Argon-Ion Multi-line Gas Laser (488/514 nm)",
      nameAr: "ليزر أيونات الآرغون متعدد الخطوط",
      category: "gas_laser",
      wavelength: 514.5,
      power: 150,
      beamDiameter: 1.2,
      divergence: 1.0,
      color: "#06b6d4",
      icon: "laser-tube",
      description: "Continuous wave noble gas laser delivering high power density at blue and green wavelengths for Raman spectroscopy and flow cytometry."
    },
    {
      id: "src_fiber_laser",
      name: "Erbium-Doped Fiber Laser (EDFL 1550 nm)",
      nameAr: "ليزر الألياف المشوبة بالإربيوم",
      category: "fiber_laser",
      wavelength: 1550,
      power: 100,
      beamDiameter: 0.8,
      divergence: 0.8,
      color: "#f43f5e",
      icon: "fiber-coil",
      description: "Single-mode optical fiber core laser with Bragg reflector mirrors, providing telecom C-band emission with exceptional stability."
    }
  ],

  optics: [
    {
      id: "opt_mirror_plane",
      name: "Dielectric Plane Mirror (HR)",
      nameAr: "مرآة مستوية عاكسة بالكامل",
      type: "mirror",
      reflectivity: 0.998,
      diameter: 25.4, // mm
      clearAperture: 23.0,
      icon: "mirror-flat",
      description: "Broadband dielectric multi-layer coated mirror providing >99.8% reflectance at design angles."
    },
    {
      id: "opt_mirror_concave",
      name: "Spherical Concave Mirror",
      nameAr: "مرآة مقعرة كروية",
      type: "curved_mirror",
      radiusCurvature: 200, // mm
      focalLength: 100, // mm
      reflectivity: 0.99,
      diameter: 25.4,
      icon: "mirror-concave",
      description: "Focusing spherical reflector used in optical resonators, beam condensers, and imaging setups."
    },
    {
      id: "opt_lens_convex",
      name: "Plano-Convex Focusing Lens",
      nameAr: "عدسة محدبة مجمعة (بلانو-كونفكس)",
      type: "lens",
      focalLength: 100, // mm
      refractiveIndex: 1.5168, // N-BK7 at 632.8 nm
      diameter: 25.4,
      centerThickness: 4.2,
      icon: "lens-convex",
      description: "Positive focal length lens designed for minimal spherical aberration in infinite conjugate ratio setups."
    },
    {
      id: "opt_lens_concave",
      name: "Plano-Concave Diverging Lens",
      nameAr: "عدسة مقعرة مفرقة",
      type: "lens",
      focalLength: -75, // mm
      refractiveIndex: 1.5168,
      diameter: 25.4,
      icon: "lens-concave",
      description: "Negative focal length optical element used in beam expanders, optical leveling, and collimation systems."
    },
    {
      id: "opt_beamsplitter_cube",
      name: "Non-Polarizing Beam Splitter Cube (50:50)",
      nameAr: "مكعب مجزئ الحزمة غير المستقطب (50:50)",
      type: "beamsplitter",
      splitRatio: 0.5,
      transmission: 0.5,
      reflection: 0.5,
      dimensions: [20, 20, 20],
      icon: "cube-split",
      description: "Precision cube consisting of two right-angle prisms cemented together with dielectric interface separating input beam equally."
    },
    {
      id: "opt_pbs_cube",
      name: "Polarizing Beam Splitter (PBS)",
      nameAr: "مكعب تجزئة الحزم المستقطبة (PBS)",
      type: "pbs",
      extinctionRatio: 1000,
      tPolarization: "p",
      rPolarization: "s",
      icon: "cube-pbs",
      description: "Splits unpolarized or arbitrarily polarized light into orthogonal P-polarized transmitted and S-polarized reflected components."
    },
    {
      id: "opt_prism_equilateral",
      name: "Equilateral Dispersive Prism (N-SF11)",
      nameAr: "منشور تشتتي متساوي الأضلاع",
      type: "prism",
      apexAngle: 60, // degrees
      material: "N-SF11",
      cauchyA: 1.734,
      cauchyB: 0.0135,
      icon: "prism",
      description: "Dense flint glass prism providing high chromatic dispersion for spectral separation and wavelength calibration."
    },
    {
      id: "opt_diffraction_grating",
      name: "Ruled Transmission Diffraction Grating",
      nameAr: "محزوز حيود نفاذي",
      type: "grating",
      groovesPerMm: 600, // lines/mm
      gratingPeriod: 1.6667, // µm
      blazeWavelength: 500,
      icon: "grating",
      description: "Periodic micro-ruled diffraction grating dispersing incident light into angular diffraction orders according to grating equation."
    },
    {
      id: "opt_polarizer_linear",
      name: "Linear Glan-Thompson Polarizer",
      nameAr: "مستقطب خطي (غلان-طومسون)",
      type: "polarizer",
      extinctionRatio: 1e5,
      rotationAngle: 0, // degrees
      icon: "polarizer",
      description: "High-extinction optical polarizer with 360-degree calibrated dial for Malus's Law and polarization analysis."
    },
    {
      id: "opt_waveplate_quarter",
      name: "Zero-Order Quarter-Wave Plate (λ/4)",
      nameAr: "لوح ربع موجي (Zero-Order λ/4)",
      type: "waveplate",
      retardation: 0.25, // wave = 90 deg phase shift
      fastAxisAngle: 45,
      icon: "waveplate-q",
      description: "Birefringent crystal quartz plate introducing a 90° phase shift between ordinary and extraordinary rays, converting linear to circular polarization."
    },
    {
      id: "opt_waveplate_half",
      name: "Zero-Order Half-Wave Plate (λ/2)",
      nameAr: "لوح نصف موجي (λ/2)",
      type: "waveplate",
      retardation: 0.5, // 180 deg phase shift
      fastAxisAngle: 45,
      icon: "waveplate-h",
      description: "Rotates the polarization plane of linearly polarized light by twice the angle between the fast axis and input polarization."
    },
    {
      id: "opt_optical_fiber",
      name: "Step-Index Silica Optical Fiber",
      nameAr: "ليف بصري متعدد الأنماط عالي النقاء",
      type: "fiber",
      coreDiameter: 50, // µm
      claddingDiameter: 125,
      coreIndex: 1.48,
      cladIndex: 1.46,
      numericalAperture: 0.24,
      attenuation: 0.2, // dB/km
      icon: "fiber",
      description: "Total internal reflection light guide for optical communications, sensor interrogations, and beam delivery."
    },
    {
      id: "opt_shg_crystal",
      name: "BBO Nonlinear Crystal (Type I SHG)",
      nameAr: "بلورة بصرية لاخطية BBO لتوليد التوافقية الثانية",
      type: "nonlinear_crystal",
      material: "Beta-Barium Borate",
      deff: 2.2, // pm/V
      phaseMatchAngle: 22.8, // deg for 1064 -> 532 nm
      length: 5.0, // mm
      icon: "crystal",
      description: "Anisotropic birefringent crystal fulfilling phase-matching condition for second harmonic generation and parametric down-conversion."
    }
  ],

  detectors: [
    {
      id: "det_power_meter",
      name: "Precision Optical Power Meter & Console",
      nameAr: "مقياس القدرة الضوئية الرقمي الدقيق",
      sensorType: "Silicon Photodiode & Thermopile",
      range: "10 nW - 20 W",
      accuracy: "±2%",
      spectralRange: [400, 1100], // nm
      icon: "power-meter",
      description: "Calibrated sensor head with digital console providing real-time optical power, average energy, and optical density readouts."
    },
    {
      id: "det_beam_profiler",
      name: "CCD Camera Beam Profiler (ISO 11146)",
      nameAr: "محلل المقطع العرضي للحزمة (Beam Profiler)",
      resolution: "1920x1200 pixels",
      pixelPitch: 3.45, // µm
      icon: "profiler",
      description: "High-resolution 2D array sensor analyzing Gaussian beam waist w0, M^2 factor, ellipticity, and centroid position."
    },
    {
      id: "det_spectrometer",
      name: "Czerny-Turner High-Resolution Spectrometer",
      nameAr: "مطياف تحليلي عالي الدقة (Czerny-Turner)",
      spectralRange: [200, 1100], // nm
      opticalResolution: 0.05, // nm FWHM
      integrationTime: "1 ms - 60 s",
      icon: "spectrometer",
      description: "Grating-based multi-channel spectrometer measuring optical emission, absorption, LIBS spectra, and fluorescence bands."
    },
    {
      id: "det_interferometer_detector",
      name: "Interferometric Fringe Photo-Detector",
      nameAr: "كاشف أهداب التداخل الضوئي المتزامن",
      bandwidth: "100 MHz",
      sensitivity: "0.5 A/W",
      icon: "fringe-detector",
      description: "High-speed detector measuring cyclic constructive and destructive fringe shifts for nanometer displacement and refractive index metrology."
    }
  ],

  mechanics: [
    {
      id: "mech_optical_table",
      name: "Pneumatic Vibration-Isolated Optical Table",
      nameAr: "طاولة بصرية معزولة ميكانيكياً ومثقبة (M6)",
      dimensions: "1200 x 800 mm",
      gridSpacing: 25, // mm M6 tapped holes
      damping: "Broadband internal tuned dampening",
      icon: "table",
      description: "Precision honeycomb stainless steel optical breadboard with pneumatic vibration isolation legs and M6 mounting grid."
    },
    {
      id: "mech_kinematic_mount",
      name: "Precision Kinematic Mirror Mount",
      nameAr: "حامل مرايا حركي ثنائي المحاور (Pitch/Yaw)",
      resolution: "100 TPI micrometer screws (0.25 mm pitch)",
      travelRange: "±4°",
      icon: "mount",
      description: "Two-axis kinematic adjustment mount allowing micro-radian tilt and tip beam steering."
    },
    {
      id: "mech_translation_stage",
      name: "Micrometer Linear Translation Stage",
      nameAr: "منصة إزاحة خطية بميكرومتر دقيق",
      travel: "25 mm",
      sensitivity: "1 µm",
      icon: "stage",
      description: "Crossed-roller bearing translation stage for sub-micron component positioning along optical axis."
    },
    {
      id: "mech_beam_dump",
      name: "Water-Cooled / Convection Laser Beam Dump",
      nameAr: "ممتص الحزم الليزرية الآمن (Beam Dump)",
      maxPower: "50 W CW",
      coating: "High-absorption carbon black cavity",
      icon: "beam-dump",
      description: "Light trap capturing non-used laser beams, preventing hazardous specular back-reflections."
    }
  ]
};

window.EQUIPMENT_CATALOG = EQUIPMENT_CATALOG;
