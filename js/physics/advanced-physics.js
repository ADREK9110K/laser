/**
 * LASER SCIENCE & TECHNOLOGY - VIRTUAL INTERACTIVE LABORATORY
 * University of Technology - Iraq
 * Advanced Physics Engine: Nonlinear Optics, Spectroscopy, Laser-Matter & Biomedical
 */

const AdvancedPhysicsEngine = {
  // Second Harmonic Generation (SHG) & Phase Matching
  calculateSHG(crystalAngleDeg, phaseMatchAngleDeg, fundamentalIntensityMwPerCm2, crystalLengthMm) {
    const dThetaRad = ((crystalAngleDeg - phaseMatchAngleDeg) * Math.PI) / 180;
    
    // Phase mismatch deltaK * L / 2
    // Approximate phase mismatch slope ~ 50 rad / (deg * cm)
    const crystalLengthCm = crystalLengthMm / 10.0;
    const deltaKHalfL = 25.0 * (crystalAngleDeg - phaseMatchAngleDeg) * crystalLengthCm;

    let phaseMatchFactor = 1.0;
    if (Math.abs(deltaKHalfL) > 1e-5) {
      const sincVal = Math.sin(deltaKHalfL) / deltaKHalfL;
      phaseMatchFactor = sincVal * sincVal;
    }

    // Small-signal SHG efficiency eta ~ d_eff^2 * L^2 * I_fund * sinc^2(deltaK*L/2)
    // Normalized conversion efficiency (capped at 75% for depleted pump regime)
    const conversionEfficiency = Math.min(0.75, 0.0015 * fundamentalIntensityMwPerCm2 * crystalLengthCm * crystalLengthCm * phaseMatchFactor);
    const harmonicIntensity = fundamentalIntensityMwPerCm2 * conversionEfficiency;

    return {
      conversionEfficiencyPercent: conversionEfficiency * 100.0,
      harmonicIntensityMwPerCm2: harmonicIntensity,
      phaseMatchFactor: phaseMatchFactor,
      deltaKHalfL: deltaKHalfL
    };
  },

  // Beer-Lambert Spectroscopy Law
  calculateBeerLambert(molarExtinctionCoeff, concentrationMolPerL, pathLengthCm, inputIntensity = 100) {
    // Absorbance A = epsilon * c * L
    const absorbance = molarExtinctionCoeff * concentrationMolPerL * pathLengthCm;
    // Transmittance T = 10^(-A)
    const transmittance = Math.pow(10, -absorbance);
    const transmittedIntensity = inputIntensity * transmittance;

    return {
      absorbance: absorbance,
      transmittancePercent: transmittance * 100.0,
      transmittedIntensity: transmittedIntensity
    };
  },

  // Laser Ablation Crater Depth
  calculateLaserAblation(fluenceJcm2, thresholdFluenceJcm2, effectivePenetrationDepthUm) {
    if (fluenceJcm2 <= thresholdFluenceJcm2) {
      return {
        ablationDepthUm: 0.0,
        isAblating: false,
        thermalRegime: "Sub-threshold heating"
      };
    }

    // Logarithmic ablation depth: d = delta_eff * ln(F / F_th)
    const depthUm = effectivePenetrationDepthUm * Math.log(fluenceJcm2 / thresholdFluenceJcm2);

    return {
      ablationDepthUm: depthUm,
      isAblating: true,
      thermalRegime: "Phase explosion & vaporization"
    };
  },

  // Pulsed Laser Deposition (PLD) Plume & Film Thickness
  calculatePLDThickness(substrateDistanceMm, pulseCount, targetSubstrateAngleDeg = 0) {
    const dCm = substrateDistanceMm / 10.0;
    const forwardPeakingExponent = 8; // p ~ 6 to 12 for high vacuum PLD plume
    const angleRad = (targetSubstrateAngleDeg * Math.PI) / 180;

    // Plume angular flux: F(theta) = F0 * cos^p(theta)
    const fluxFactor = Math.pow(Math.cos(angleRad), forwardPeakingExponent);
    
    // Thickness per pulse in Angstroms (~0.1 - 0.5 A/pulse at d = 4 cm)
    const ratePerPulseAngstrom = (4.0 / (dCm * dCm)) * fluxFactor;
    const totalThicknessNm = (ratePerPulseAngstrom * pulseCount) / 10.0;

    return {
      totalThicknessNm: totalThicknessNm,
      depositionRateNmPerMin: (ratePerPulseAngstrom * 10 * 60) / 10.0 // Assuming 10 Hz
    };
  },

  // Biomedical Optical Penetration Depth
  calculateTissuePenetration(muA_perCm, muSPrime_perCm) {
    // Effective attenuation coefficient: mu_eff = sqrt(3 * mu_a * (mu_a + mu_s'))
    const muEff_perCm = Math.sqrt(3.0 * muA_perCm * (muA_perCm + muSPrime_perCm));
    const penetrationDepthMm = (1.0 / muEff_perCm) * 10.0;

    return {
      penetrationDepthMm: penetrationDepthMm,
      muEff_perCm: muEff_perCm
    };
  },

  // Ophthalmic Nd:YAG Photodisruption Breakdown
  calculateOphthalmicPhotodisruption(pulseEnergyMj, spotDiameterUm, pulseDurationNs) {
    const energyJ = pulseEnergyMj * 1e-3;
    const durationS = pulseDurationNs * 1e-9;
    const spotRadiusCm = (spotDiameterUm * 1e-4) / 2.0;
    const focalAreaCm2 = Math.PI * spotRadiusCm * spotRadiusCm;

    // Peak power and power density (W/cm^2)
    const peakPowerW = energyJ / durationS;
    const powerDensityWPerCm2 = peakPowerW / focalAreaCm2;

    const breakdownThresholdWPerCm2 = 1.0e11; // 100 GW/cm^2 in transparent ocular media
    const isBreakdownAchieved = powerDensityWPerCm2 >= breakdownThresholdWPerCm2;

    return {
      powerDensityWPerCm2: powerDensityWPerCm2,
      peakPowerMw: peakPowerW * 1e-6,
      isBreakdownAchieved: isBreakdownAchieved,
      breakdownSafetyRatio: powerDensityWPerCm2 / breakdownThresholdWPerCm2
    };
  },

  // Optical Coherence Tomography (OCT) Axial Resolution
  calculateOCTResolution(centralWavelengthNm, bandwidthNm, refractiveIndexTissue = 1.38) {
    const lambda0Um = centralWavelengthNm / 1000.0;
    const deltaLambdaUm = bandwidthNm / 1000.0;

    // Axial resolution: l_c = (2 * ln(2) / pi) * (lambda0^2 / (n * delta_lambda))
    const factor = (2.0 * Math.LN2) / Math.PI; // ≈ 0.441
    const axialResolutionUm = factor * (lambda0Um * lambda0Um) / (refractiveIndexTissue * deltaLambdaUm);

    return {
      axialResolutionUm: axialResolutionUm
    };
  }
};

window.AdvancedPhysicsEngine = AdvancedPhysicsEngine;
