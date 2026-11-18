/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Laser Safety & Radiation Hazard Analysis Engine (ANSI Z136.1 / IEC 60825 Standards)
 */

const SafetyEngine = {
  // Compute Maximum Permissible Exposure (MPE) in W/m^2 or J/m^2 for 0.25s blink reflex (visible)
  calculateMPE(wavelengthNm, exposureDurationSec = 0.25) {
    let mpeWPerM2 = 25.4; // 2.54 mW/cm^2 standard visible 0.25s eye aversion reflex
    let formula = "25.4 W/m² (0.25s aversion reflex)";

    if (wavelengthNm >= 400 && wavelengthNm <= 700) {
      if (exposureDurationSec <= 1e-9) {
        mpeWPerM2 = 2.0e-3 / exposureDurationSec; // 2 mJ/m^2
        formula = "2.0×10⁻³ J/m² (ultrafast visible)";
      } else if (exposureDurationSec < 0.25) {
        mpeWPerM2 = 18 * Math.pow(exposureDurationSec, 0.75) / exposureDurationSec;
        formula = "18 · t^0.75 J/m²";
      } else {
        mpeWPerM2 = 25.4;
      }
    } else if (wavelengthNm > 700 && wavelengthNm <= 1050) {
      // Near-IR correction factor C_A = 10^(0.002*(lambda - 700))
      const CA = Math.pow(10, 0.002 * (wavelengthNm - 700));
      mpeWPerM2 = 25.4 * CA;
      formula = `25.4 × CA (${CA.toFixed(2)}) W/m²`;
    } else if (wavelengthNm > 1050 && wavelengthNm <= 1400) {
      mpeWPerM2 = 25.4 * 5.0; // CA = 5.0
      formula = "127 W/m²";
    } else if (wavelengthNm > 1400) {
      // Mid-IR cornea hazard
      mpeWPerM2 = 1000.0;
      formula = "1000 W/m² (Corneal limit)";
    }

    return {
      mpeWPerM2: mpeWPerM2,
      mpeMwPerCm2: mpeWPerM2 / 10.0,
      formula: formula
    };
  },

  // Calculate Nominal Ocular Hazard Distance (NOHD)
  calculateNOHD(powerW, beamDiameterMm, divergenceMrad, wavelengthNm) {
    const mpeObj = this.calculateMPE(wavelengthNm);
    const mpe = mpeObj.mpeWPerM2;

    const d0M = beamDiameterMm * 1e-3;
    const thetaRad = divergenceMrad * 1e-3;

    // NOHD = (1 / theta) * sqrt( (4 * P) / (pi * MPE) - d0^2 )
    const insideSqrt = (4.0 * powerW) / (Math.PI * mpe) - (d0M * d0M);

    let nohdM = 0;
    if (insideSqrt > 0) {
      nohdM = (1.0 / thetaRad) * Math.sqrt(insideSqrt);
    }

    return {
      nohdMeters: nohdM,
      nohdFeet: nohdM * 3.28084,
      mpeWPerM2: mpe
    };
  },

  // Calculate Required Optical Density (OD) for Laser Safety Glasses
  calculateRequiredOD(powerW, beamDiameterMm, wavelengthNm) {
    const mpeObj = this.calculateMPE(wavelengthNm);
    const mpe = mpeObj.mpeWPerM2;

    const beamAreaM2 = Math.PI * Math.pow((beamDiameterMm * 1e-3) / 2.0, 2);
    const beamIrradianceWPerM2 = powerW / beamAreaM2;

    // OD = log10(H0 / MPE)
    let od = 0;
    if (beamIrradianceWPerM2 > mpe) {
      od = Math.log10(beamIrradianceWPerM2 / mpe);
    }

    return {
      requiredOD: Math.max(0, od),
      recommendedOD: Math.ceil(Math.max(0, od) + 1.0), // safety margin of 1 OD
      beamIrradianceWPerM2: beamIrradianceWPerM2
    };
  },

  // Determine Laser Hazard Class according to IEC 60825-1
  classifyLaser(powerMw, wavelengthNm, isPulsed = false, pulseEnergyMj = 0) {
    if (wavelengthNm >= 400 && wavelengthNm <= 700) {
      if (powerMw <= 0.39) {
        return {
          laserClass: "Class 1",
          hazard: "Safe under all reasonably foreseeable operating conditions.",
          warningColor: "#10b981",
          measures: "No special controls required."
        };
      } else if (powerMw <= 1.0) {
        return {
          laserClass: "Class 2",
          hazard: "Eye protection afforded by natural blink reflex (0.25 s).",
          warningColor: "#3b82f6",
          measures: "Do not stare into beam intentionally."
        };
      } else if (powerMw <= 5.0) {
        return {
          laserClass: "Class 3R",
          hazard: "Low risk to eyes. Direct intrabeam viewing may be hazardous.",
          warningColor: "#f59e0b",
          measures: "Avoid direct ocular exposure. Lab warning sign."
        };
      } else if (powerMw <= 500.0) {
        return {
          laserClass: "Class 3B",
          hazard: "Hazardous to eyes under direct beam or specular reflection. Diffuse reflections safe.",
          warningColor: "#f97316",
          measures: "Protective eyewear required. Key switch, safety interlock."
        };
      } else {
        return {
          laserClass: "Class 4",
          hazard: "DANGER! High power. Severe eye and skin burn hazard from direct, specular, AND diffuse reflections. Fire hazard.",
          warningColor: "#ef4444",
          measures: "Certified OD laser goggles mandatory, enclosed beam path, remote interlock, fire-resistant beam stops."
        };
      }
    } else {
      // Invisible infrared or UV
      if (powerMw <= 0.5) {
        return {
          laserClass: "Class 1",
          hazard: "Safe under normal conditions.",
          warningColor: "#10b981",
          measures: "Standard caution."
        };
      } else if (powerMw <= 500.0) {
        return {
          laserClass: "Class 3B (Invisible)",
          hazard: "Severe invisible radiation ocular hazard without blink protection.",
          warningColor: "#f97316",
          measures: "Sensor detection card, IR/UV goggles mandatory."
        };
      } else {
        return {
          laserClass: "Class 4 (Invisible)",
          hazard: "CRITICAL DANGER: Invisible high power beam. Instant retina/corneal damage and fire hazard.",
          warningColor: "#ef4444",
          measures: "Complete enclosure, interlock, certified goggles, laser warning lamp."
        };
      }
    }
  }
};

window.SafetyEngine = SafetyEngine;
