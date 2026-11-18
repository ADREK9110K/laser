/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Wave Optics, Interference, and Diffraction Engine
 */

const WaveOpticsEngine = {
  // Sinc function: sin(x)/x
  sinc(x) {
    if (Math.abs(x) < 1e-7) return 1.0;
    return Math.sin(x) / x;
  },

  // First-order Bessel function approximation J1(x)
  besselJ1(x) {
    const ax = Math.abs(x);
    if (ax < 3.75) {
      const y = (x / 3.75) * (x / 3.75);
      return x * (0.5 + y * (-0.56249985 + y * (0.21093573 + y * (-0.03954289 + y * (0.00443319 - y * 0.00031761)))));
    } else {
      const y = 3.75 / ax;
      const f0 = 0.79788456 + y * (-0.00000077 + y * (-0.00552740 + y * (0.00009512 + y * (0.00137237 - y * 0.00072805))));
      const theta0 = ax - 2.35619449 + y * (0.04687499 + y * (-0.00020096 + y * (-0.00320246 + y * (0.00022252 + y * 0.00018576))));
      return (Math.sign(x) * (1.0 / Math.sqrt(ax)) * f0 * Math.cos(theta0));
    }
  },

  // Young's Double Slit profile: returns array of { positionMm, intensity }
  calculateDoubleSlitProfile(wavelengthNm, slitDistMm, slitWidthMm, screenDistMm, numPoints = 200, spanMm = 20) {
    const lambdaM = wavelengthNm * 1e-9;
    const dM = slitDistMm * 1e-3;
    const aM = slitWidthMm * 1e-3;
    const LM = screenDistMm * 1e-3;

    const data = [];
    const step = (spanMm * 2) / numPoints;

    for (let posMm = -spanMm; posMm <= spanMm; posMm += step) {
      const yM = posMm * 1e-3;
      const sinTheta = yM / Math.sqrt(yM * yM + LM * LM);

      // Diffraction parameter alpha
      const alpha = (Math.PI * aM * sinTheta) / lambdaM;
      const diffEnvelope = this.sinc(alpha) * this.sinc(alpha);

      // Interference parameter beta
      const beta = (Math.PI * dM * sinTheta) / lambdaM;
      const interTerm = Math.cos(beta) * Math.cos(beta);

      const intensity = diffEnvelope * interTerm;
      data.push({ x: posMm, intensity: intensity });
    }

    const fringeSpacingMm = (lambdaM * LM / dM) * 1e3;
    return {
      data: data,
      fringeSpacingMm: fringeSpacingMm
    };
  },

  // Single Slit Fraunhofer profile
  calculateSingleSlitProfile(wavelengthNm, slitWidthMm, screenDistMm, numPoints = 200, spanMm = 25) {
    const lambdaM = wavelengthNm * 1e-9;
    const aM = slitWidthMm * 1e-3;
    const LM = screenDistMm * 1e-3;

    const data = [];
    const step = (spanMm * 2) / numPoints;

    for (let posMm = -spanMm; posMm <= spanMm; posMm += step) {
      const yM = posMm * 1e-3;
      const sinTheta = yM / Math.sqrt(yM * yM + LM * LM);
      const beta = (Math.PI * aM * sinTheta) / lambdaM;
      const intensity = this.sinc(beta) * this.sinc(beta);
      data.push({ x: posMm, intensity: intensity });
    }

    const centralWidthMm = (2 * lambdaM * LM / aM) * 1e3;
    return {
      data: data,
      centralWidthMm: centralWidthMm
    };
  },

  // Multiple Slit / Grating Diffraction
  calculateMultiSlitProfile(N, slitDistMm, slitWidthMm, wavelengthNm, screenDistMm, numPoints = 300, spanMm = 30) {
    const lambdaM = wavelengthNm * 1e-9;
    const dM = slitDistMm * 1e-3;
    const aM = slitWidthMm * 1e-3;
    const LM = screenDistMm * 1e-3;

    const data = [];
    const step = (spanMm * 2) / numPoints;

    for (let posMm = -spanMm; posMm <= spanMm; posMm += step) {
      const yM = posMm * 1e-3;
      const sinTheta = yM / Math.sqrt(yM * yM + LM * LM);

      // Single slit diffraction envelope
      const alpha = (Math.PI * aM * sinTheta) / lambdaM;
      const diffTerm = this.sinc(alpha) * this.sinc(alpha);

      // N-slit interference term: [sin(N gamma) / (N * sin(gamma))]^2
      const gamma = (Math.PI * dM * sinTheta) / lambdaM;
      let interTerm = 1.0;
      if (Math.abs(Math.sin(gamma)) > 1e-6) {
        const ratio = Math.sin(N * gamma) / (N * Math.sin(gamma));
        interTerm = ratio * ratio;
      }

      const intensity = diffTerm * interTerm;
      data.push({ x: posMm, intensity: intensity });
    }

    return { data: data };
  },

  // Circular Aperture (Airy Disk)
  calculateAiryPattern(wavelengthNm, diameterMm, focalLengthMm, radiusMm = 2.0, numPoints = 100) {
    const lambdaM = wavelengthNm * 1e-9;
    const DM = diameterMm * 1e-3;
    const fM = focalLengthMm * 1e-3;

    const data = [];
    const step = radiusMm / numPoints;

    for (let r = 0; r <= radiusMm; r += step) {
      const rM = r * 1e-3;
      const sinTheta = rM / fM;
      const u = (Math.PI * DM * sinTheta) / lambdaM;
      
      let intensity = 1.0;
      if (Math.abs(u) > 1e-6) {
        const j1Val = this.besselJ1(u);
        const term = (2.0 * j1Val) / u;
        intensity = term * term;
      }
      data.push({ r: r, intensity: intensity });
    }

    const airyRadiusMm = (1.22 * lambdaM * fM / DM) * 1e3;
    return {
      data: data,
      airyRadiusMm: airyRadiusMm
    };
  },

  // Michelson Interferometer intensity calculation
  calculateMichelson(displacementUm, wavelengthNm) {
    const lambdaUm = wavelengthNm / 1000.0;
    // Optical path difference delta = 2 * d
    const opdUm = 2.0 * displacementUm;
    // Phase difference deltaPhi = (2*pi / lambda) * (2*d)
    const phaseRad = (2.0 * Math.PI * opdUm) / lambdaUm;
    const normalizedIntensity = 0.5 * (1.0 + Math.cos(phaseRad));
    const fringeCount = opdUm / lambdaUm;

    return {
      intensity: normalizedIntensity,
      phaseRad: phaseRad,
      fringeCount: fringeCount,
      opdUm: opdUm
    };
  },

  // Fabry-Pérot Cavity Airy Transmission
  calculateFabryPerot(reflectivityR, cavitySpacingMm, wavelengthNm) {
    const lambdaM = wavelengthNm * 1e-9;
    const dM = cavitySpacingMm * 1e-3;
    const c = 299792458;

    // Cavity Finesse
    const finesse = (Math.PI * Math.sqrt(reflectivityR)) / (1.0 - reflectivityR);
    // Free Spectral Range (FSR)
    const fsrHz = c / (2.0 * dM);
    const fsrNm = (wavelengthNm * wavelengthNm * 1e-9) / (2.0 * dM) * 1e9;
    const linewidthFwhmHz = fsrHz / finesse;

    // Coefficient of finesse F = 4R / (1 - R)^2
    const F = (4.0 * reflectivityR) / Math.pow(1.0 - reflectivityR, 2);

    // Roundtrip phase delta = 4*pi*d / lambda
    const delta = (4.0 * Math.PI * dM) / lambdaM;
    const transmission = 1.0 / (1.0 + F * Math.pow(Math.sin(delta / 2.0), 2));

    return {
      transmission: transmission,
      finesse: finesse,
      fsrHz: fsrHz,
      fsrNm: fsrNm,
      linewidthHz: linewidthFwhmHz
    };
  },

  // Newton's Rings Radii
  calculateNewtonsRings(radiusCurvatureMm, wavelengthNm, numRings = 10) {
    const lambdaMm = wavelengthNm * 1e-6;
    const rings = [];

    for (let m = 1; m <= numRings; m++) {
      // Dark ring radius: r_m = sqrt(m * lambda * R)
      const rDark = Math.sqrt(m * lambdaMm * radiusCurvatureMm);
      // Bright ring radius: r_bright = sqrt((m - 0.5) * lambda * R)
      const rBright = Math.sqrt((m - 0.5) * lambdaMm * radiusCurvatureMm);
      rings.push({
        order: m,
        darkRadiusMm: rDark,
        brightRadiusMm: rBright,
        darkDiameterMm: 2 * rDark
      });
    }

    return { rings: rings };
  },

  // Coherence Length
  calculateCoherence(wavelengthNm, linewidthDeltaLambdaNm) {
    const lambdaM = wavelengthNm * 1e-9;
    const deltaLambdaM = linewidthDeltaLambdaNm * 1e-9;
    const c = 299792458;

    const coherenceLengthM = (lambdaM * lambdaM) / deltaLambdaM;
    const coherenceTimeSec = coherenceLengthM / c;

    return {
      coherenceLengthMm: coherenceLengthM * 1e3,
      coherenceTimePs: coherenceTimeSec * 1e12
    };
  }
};

window.WaveOpticsEngine = WaveOpticsEngine;
