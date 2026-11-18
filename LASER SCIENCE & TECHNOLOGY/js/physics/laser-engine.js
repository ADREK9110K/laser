/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Laser Physics, Resonators, Gaussian Beams, and Quantum Electronics Engine
 */

const LaserEngine = {
  // Gaussian Beam Propagation
  calculateGaussianBeam(waistRadiusW0Mm, wavelengthNm, zPosMm, m2Factor = 1.0) {
    const lambdaMm = wavelengthNm * 1e-6;
    const w0Mm = waistRadiusW0Mm;

    // Rayleigh Range: zR = pi * w0^2 / (M^2 * lambda)
    const zRMm = (Math.PI * w0Mm * w0Mm) / (m2Factor * lambdaMm);

    // Beam radius at distance z: w(z) = w0 * sqrt(1 + (z/zR)^2)
    const wZMm = w0Mm * Math.sqrt(1.0 + Math.pow(zPosMm / zRMm, 2));

    // Far-field divergence half-angle: theta = M^2 * lambda / (pi * w0)
    const thetaDivRad = (m2Factor * lambdaMm) / (Math.PI * w0Mm);
    const thetaDivMrad = thetaDivRad * 1000.0;

    // Radius of curvature of wavefront: R(z) = z * (1 + (zR/z)^2)
    let radiusCurvatureMm = Infinity;
    if (Math.abs(zPosMm) > 1e-6) {
      radiusCurvatureMm = zPosMm * (1.0 + Math.pow(zRMm / zPosMm, 2));
    }

    // On-axis intensity fraction: I(0, z) / I(0, 0) = (w0 / w(z))^2
    const onAxisIntensityFraction = Math.pow(w0Mm / wZMm, 2);

    return {
      wZMm: wZMm,
      waistW0Mm: w0Mm,
      zRMm: zRMm,
      thetaDivMrad: thetaDivMrad,
      radiusCurvatureMm: radiusCurvatureMm,
      onAxisIntensityFraction: onAxisIntensityFraction
    };
  },

  // Resonator Stability g-parameters
  calculateResonatorStability(cavityLengthMm, radiusR1Mm, radiusR2Mm) {
    const g1 = 1.0 - (cavityLengthMm / radiusR1Mm);
    const g2 = 1.0 - (cavityLengthMm / radiusR2Mm);
    const gProduct = g1 * g2;
    const isStable = (gProduct >= 0.0 && gProduct <= 1.0);

    return {
      g1: g1,
      g2: g2,
      gProduct: gProduct,
      isStable: isStable,
      stabilityMargin: isStable ? Math.min(gProduct, 1.0 - gProduct) : -1
    };
  },

  // Laser Threshold Gain Condition
  calculateLaserThreshold(cavityLengthCm, mirrorR1, mirrorR2, internalLossAlphaPerCm) {
    // gamma_th = alpha_s + (1 / (2*L)) * ln(1 / (R1 * R2))
    const couplingLoss = (1.0 / (2.0 * cavityLengthCm)) * Math.log(1.0 / (mirrorR1 * mirrorR2));
    const thresholdGainPerCm = internalLossAlphaPerCm + couplingLoss;

    return {
      thresholdGainPerCm: thresholdGainPerCm,
      couplingLossPerCm: couplingLoss,
      internalLossPerCm: internalLossAlphaPerCm,
      roundtripLossPercent: (1.0 - mirrorR1 * mirrorR2 * Math.exp(-2.0 * internalLossAlphaPerCm * cavityLengthCm)) * 100.0
    };
  },

  // 4-Level Laser Output Power above Threshold
  calculateLaserOutputPower(pumpPowerW, thresholdPowerW, slopeEfficiency) {
    if (pumpPowerW <= thresholdPowerW) {
      return {
        outputPowerW: 0.0,
        opticalEfficiency: 0.0,
        isLasing: false
      };
    }

    const outputPowerW = slopeEfficiency * (pumpPowerW - thresholdPowerW);
    const opticalEfficiency = (outputPowerW / pumpPowerW) * 100.0;

    return {
      outputPowerW: outputPowerW,
      opticalEfficiency: opticalEfficiency,
      isLasing: true
    };
  },

  // Q-Switching Peak Power and Pulse Width
  calculateQSwitchPulse(storedEnergyMj, pulseDurationNs, repRateHz) {
    const energyJ = storedEnergyMj * 1e-3;
    const durationS = pulseDurationNs * 1e-9;
    
    // Approximate peak power = Energy / PulseDuration
    const peakPowerW = energyJ / durationS;
    const peakPowerMw = peakPowerW * 1e-6; // Megawatts
    const averagePowerW = energyJ * repRateHz;

    return {
      peakPowerMw: peakPowerMw,
      averagePowerW: averagePowerW,
      pulseEnergyMj: storedEnergyMj
    };
  },

  // Mode Locking Ultrafast Pulse Parameters
  calculateModeLocking(pulseDurationFs, cavityLengthM, bandwidthNm, centralWavelengthNm = 800) {
    const c = 299792458;
    // Repetition period T = 2L / c
    const roundtripTimeSec = (2.0 * cavityLengthM) / c;
    const repRateMhz = (1.0 / roundtripTimeSec) * 1e-6;

    // Time-bandwidth product limit for sech^2 pulses is 0.315; for Gaussian is 0.441
    const deltaNuHz = (c / Math.pow(centralWavelengthNm * 1e-9, 2)) * (bandwidthNm * 1e-9);
    const transformLimitedDurationFs = (0.441 / deltaNuHz) * 1e15;

    return {
      repRateMhz: repRateMhz,
      roundtripTimeNs: roundtripTimeSec * 1e9,
      transformLimitedDurationFs: transformLimitedDurationFs,
      isTransformLimited: pulseDurationFs <= transformLimitedDurationFs * 1.1
    };
  },

  // Free Electron Laser Resonance Wavelength
  calculateFEL(electronEnergyMev, undulatorPeriodMm, magneticFieldTesla) {
    // Relativistic gamma = E / (m_e * c^2) = E_MeV / 0.5109989 MeV
    const gamma = electronEnergyMev / 0.5109989;
    
    // Undulator dimensionless deflection parameter K:
    // K = (e * B0 * lambda_u) / (2 * pi * m_e * c) ≈ 0.934 * B0[Tesla] * lambda_u[cm]
    const undulatorPeriodCm = undulatorPeriodMm / 10.0;
    const K = 0.934 * magneticFieldTesla * undulatorPeriodCm;

    // Resonance wavelength: lambda_r = lambda_u / (2 * gamma^2) * (1 + K^2 / 2)
    const lambdaRMm = (undulatorPeriodMm / (2.0 * gamma * gamma)) * (1.0 + (K * K) / 2.0);
    const lambdaRNm = lambdaRMm * 1e6;

    return {
      resonanceWavelengthNm: lambdaRNm,
      gamma: gamma,
      undulatorParameterK: K
    };
  }
};

window.LaserEngine = LaserEngine;
