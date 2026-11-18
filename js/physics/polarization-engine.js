/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Polarization & Electromagnetic Optics Engine (Jones Calculus & Stokes Formalism)
 */

const PolarizationEngine = {
  // Malus's Law calculation
  calculateMalus(i0, angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(angleRad);
    const intensity = i0 * cosVal * cosVal;
    return {
      intensity: intensity,
      transmissionRatio: cosVal * cosVal
    };
  },

  // Brewster's Angle
  calculateBrewster(n1, n2) {
    const thetaBRad = Math.atan(n2 / n1);
    const thetaBDeg = (thetaBRad * 180) / Math.PI;
    return {
      brewsterAngleDeg: thetaBDeg,
      refractedAngleDeg: 90 - thetaBDeg
    };
  },

  // Complex number multiplication helper: (a + ib)*(c + id) = (ac - bd) + i(ad + bc)
  complexMultiply(c1, c2) {
    return {
      re: c1.re * c2.re - c1.im * c2.im,
      im: c1.re * c2.im + c1.im * c2.re
    };
  },

  // Jones matrix propagation for waveplate of retardation Gamma at angle Theta
  // Gamma = pi/2 for QWP, pi for HWP
  calculateWaveplateTransmission(inputLinearAngleDeg, waveplateAngleDeg, retardationRad, analyzerAngleDeg = null) {
    const inRad = (inputLinearAngleDeg * Math.PI) / 180;
    const wpRad = (waveplateAngleDeg * Math.PI) / 180;

    // Input Jones vector (linear polarized): E = [cos(inRad), sin(inRad)]
    const Ex_in = { re: Math.cos(inRad), im: 0 };
    const Ey_in = { re: Math.sin(inRad), im: 0 };

    // Rotate into waveplate fast/slow coordinate system: theta = inRad - wpRad
    const thetaRel = inRad - wpRad;
    const E_fast = { re: Math.cos(thetaRel), im: 0 };
    const E_slow = { re: Math.sin(thetaRel), im: 0 };

    // Apply phase shift: E_slow picks up exp(-i * Gamma) = cos(Gamma) - i*sin(Gamma)
    const phaseFactor = { re: Math.cos(retardationRad), im: -Math.sin(retardationRad) };
    const E_slow_out = this.complexMultiply(E_slow, phaseFactor);

    // Rotate back to laboratory frame (x, y)
    const cosW = Math.cos(wpRad);
    const sinW = Math.sin(wpRad);

    const Ex_out = {
      re: E_fast.re * cosW - E_slow_out.re * sinW,
      im: E_fast.im * cosW - E_slow_out.im * sinW
    };
    const Ey_out = {
      re: E_fast.re * sinW + E_slow_out.re * cosW,
      im: E_fast.im * sinW + E_slow_out.im * cosW
    };

    // Calculate Stokes parameters
    const S0 = (Ex_out.re * Ex_out.re + Ex_out.im * Ex_out.im) + (Ey_out.re * Ey_out.re + Ey_out.im * Ey_out.im);
    const S1 = (Ex_out.re * Ex_out.re + Ex_out.im * Ex_out.im) - (Ey_out.re * Ey_out.re + Ey_out.im * Ey_out.im);
    const S2 = 2 * (Ex_out.re * Ey_out.re + Ex_out.im * Ey_out.im);
    const S3 = 2 * (Ex_out.re * Ey_out.im - Ex_out.im * Ey_out.re);

    // Determine state type
    let state = "Linear";
    if (Math.abs(S3 / S0) > 0.95) {
      state = S3 > 0 ? "Right-Circular" : "Left-Circular";
    } else if (Math.abs(S3 / S0) > 0.1) {
      state = S3 > 0 ? "Right-Elliptical" : "Left-Elliptical";
    }

    // If analyzer present, calculate transmitted intensity
    let analyzerTransmission = null;
    if (analyzerAngleDeg !== null) {
      const aRad = (analyzerAngleDeg * Math.PI) / 180;
      const cosA = Math.cos(aRad);
      const sinA = Math.sin(aRad);
      const E_proj_re = Ex_out.re * cosA + Ey_out.re * sinA;
      const E_proj_im = Ex_out.im * cosA + Ey_out.im * sinA;
      analyzerTransmission = E_proj_re * E_proj_re + E_proj_im * E_proj_im;
    }

    return {
      Ex: Ex_out,
      Ey: Ey_out,
      stokes: { S0, S1, S2, S3 },
      state: state,
      ellipticity: Math.abs(S3 / S0),
      analyzerTransmission: analyzerTransmission
    };
  },

  // Biot's law for chiral liquid optical activity
  calculateBiotRotation(specificRotationDeg, concentrationGPerDl, pathLengthDm) {
    // alpha = [alpha] * c * l
    // c in g/mL = concentration / 100
    const cGPerMl = concentrationGPerDl / 100.0;
    const rotationDeg = specificRotationDeg * cGPerMl * pathLengthDm;
    return {
      rotationDeg: rotationDeg
    };
  }
};

window.PolarizationEngine = PolarizationEngine;
