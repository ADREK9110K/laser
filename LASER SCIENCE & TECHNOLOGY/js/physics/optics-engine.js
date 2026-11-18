/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Geometrical & Ray Optics Simulation Engine
 */

const OpticsEngine = {
  // Speed of light in vacuum (m/s)
  C: 299792458,

  // Calculate angle of reflection
  calculateReflection(thetaIncident) {
    return {
      thetaReflected: thetaIncident,
      inPlane: true
    };
  },

  // Calculate Snell's Law refraction
  calculateSnell(n1, n2, theta1Deg) {
    const theta1Rad = (theta1Deg * Math.PI) / 180;
    const sinTheta2 = (n1 / n2) * Math.sin(theta1Rad);
    
    // Check for Total Internal Reflection
    if (Math.abs(sinTheta2) > 1.0) {
      const thetaCritDeg = (Math.asin(n2 / n1) * 180) / Math.PI;
      return {
        isTIR: true,
        theta2Deg: null,
        thetaCritDeg: thetaCritDeg,
        reflectance: 1.0,
        transmittance: 0.0
      };
    }
    
    const theta2Rad = Math.asin(sinTheta2);
    const theta2Deg = (theta2Rad * 180) / Math.PI;
    const thetaCritDeg = (n1 > n2) ? (Math.asin(n2 / n1) * 180) / Math.PI : null;

    // Fresnel coefficients
    const cos1 = Math.cos(theta1Rad);
    const cos2 = Math.cos(theta2Rad);
    
    // S-polarization (TE)
    const rs = (n1 * cos1 - n2 * cos2) / (n1 * cos1 + n2 * cos2);
    const Rs = rs * rs;
    
    // P-polarization (TM)
    const rp = (n2 * cos1 - n1 * cos2) / (n2 * cos1 + n1 * cos2);
    const Rp = rp * rp;
    
    // Unpolarized average
    const R_unpol = (Rs + Rp) / 2;
    const T_unpol = 1.0 - R_unpol;

    return {
      isTIR: false,
      theta2Deg: theta2Deg,
      thetaCritDeg: thetaCritDeg,
      rs: rs,
      rp: rp,
      Rs: Rs,
      Rp: Rp,
      reflectance: R_unpol,
      transmittance: T_unpol
    };
  },

  // Critical angle
  calculateCriticalAngle(n1, n2) {
    if (n1 <= n2) return null;
    return (Math.asin(n2 / n1) * 180) / Math.PI;
  },

  // Thin lens conjugate calculation
  calculateThinLens(f, doDist) {
    // 1/f = 1/do + 1/di  =>  1/di = 1/f - 1/do  =>  di = (f * do) / (do - f)
    if (Math.abs(doDist - f) < 1e-6) {
      return {
        di: Infinity,
        magnification: Infinity,
        isReal: false,
        isUpright: true,
        desc: "Image at infinity (collimated beam)"
      };
    }

    const di = (f * doDist) / (doDist - f);
    const magnification = -di / doDist;
    const isReal = di > 0;
    const isUpright = magnification > 0;

    return {
      di: di,
      magnification: magnification,
      isReal: isReal,
      isUpright: isUpright,
      powerDiopters: 1000 / f // f in mm
    };
  },

  // Curved mirror calculation (concave f > 0, convex f < 0)
  calculateCurvedMirror(f, doDist) {
    if (Math.abs(doDist - f) < 1e-6) {
      return {
        di: Infinity,
        magnification: Infinity,
        isReal: false,
        isUpright: true
      };
    }

    const di = (f * doDist) / (doDist - f);
    const magnification = -di / doDist;
    const isReal = di > 0;
    const isUpright = magnification > 0;

    return {
      di: di,
      magnification: magnification,
      isReal: isReal,
      isUpright: isUpright
    };
  },

  // Cauchy dispersion formula: n(lambda) = A + B / lambda^2 (lambda in micrometers)
  calculateCauchyIndex(A, B, lambdaNm) {
    const lambdaMicrons = lambdaNm / 1000.0;
    return A + (B / (lambdaMicrons * lambdaMicrons));
  },

  // Prism angular deviation
  calculatePrismDeviation(apexAngleDeg, incidentAngleDeg, nPrism, nSurround = 1.0) {
    const alphaRad = (apexAngleDeg * Math.PI) / 180;
    const theta1Rad = (incidentAngleDeg * Math.PI) / 180;

    // Face 1 refraction: sin(theta1) * nSurround = sin(r1) * nPrism
    const sinR1 = (nSurround / nPrism) * Math.sin(theta1Rad);
    if (Math.abs(sinR1) > 1.0) return { isTIR: true };
    const r1 = Math.asin(sinR1);

    // Geometry inside prism: r1 + r2 = alpha => r2 = alpha - r1
    const r2 = alphaRad - r1;

    // Face 2 refraction: sin(r2) * nPrism = sin(theta2) * nSurround
    const sinTheta2 = (nPrism / nSurround) * Math.sin(r2);
    if (Math.abs(sinTheta2) > 1.0) return { isTIR: true };
    const theta2Rad = Math.asin(sinTheta2);

    // Total deviation angle: delta = theta1 + theta2 - alpha
    const deltaRad = theta1Rad + theta2Rad - alphaRad;
    const deltaDeg = (deltaRad * 180) / Math.PI;

    // Minimum deviation angle formula: n = sin((alpha + delta_m)/2) / sin(alpha/2)
    const sinHalfAlpha = Math.sin(alphaRad / 2);
    const deltaMinRad = 2 * Math.asin((nPrism / nSurround) * sinHalfAlpha) - alphaRad;
    const deltaMinDeg = (deltaMinRad * 180) / Math.PI;

    return {
      isTIR: false,
      refractedAngleDeg: (theta2Rad * 180) / Math.PI,
      deviationAngleDeg: deltaDeg,
      minDeviationAngleDeg: deltaMinDeg
    };
  },

  // Optical fiber numerical aperture and acceptance
  calculateFiberParams(nCore, nClad, nAmbient = 1.0) {
    if (nCore <= nClad) {
      return { na: 0, acceptanceAngleDeg: 0, criticalAngleDeg: 90 };
    }
    const na = Math.sqrt(nCore * nCore - nClad * nClad);
    const sinThetaAcc = Math.min(1.0, na / nAmbient);
    const thetaAccDeg = (Math.asin(sinThetaAcc) * 180) / Math.PI;
    const thetaCritDeg = (Math.asin(nClad / nCore) * 180) / Math.PI;

    return {
      na: na,
      acceptanceAngleDeg: thetaAccDeg,
      criticalAngleDeg: thetaCritDeg
    };
  },

  // Macro-bending loss calculation
  calculateFiberBendingLoss(bendRadiusMm, turns, inputPowerMw) {
    // Exponential macro-bend attenuation model
    const C1 = 12.0;
    const C2 = 0.22;
    const alphaBendDbPerTurn = C1 * Math.exp(-C2 * bendRadiusMm);
    const totalLossDb = alphaBendDbPerTurn * turns;
    const outputPowerMw = inputPowerMw * Math.pow(10, -totalLossDb / 10);

    return {
      lossDb: totalLossDb,
      outputPowerMw: Math.max(0, outputPowerMw),
      transmissionRatio: outputPowerMw / inputPowerMw
    };
  }
};

window.OpticsEngine = OpticsEngine;
