/**
 * LASER SCIENCE & TECHNOLOGY - OPTICAL RAY TRACING ENGINE
 * Precision multi-ray propagation, Cauchy dispersion, Snell refraction, TIR,
 * grating multi-order diffraction, slit interference, and sensor power metering.
 * University of Technology - Iraq | College of Laser Science and Technology
 */

(function (window) {
  'use strict';

  const {
    vec,
    getLocalRay,
    localToGlobalPoint,
    localToGlobalVector,
    intersectRaySegment,
    intersectRayArc,
    intersectRayPolygon,
    degToRad,
    getPrismVertices,
  } = window.OpticalGeometry;

  // Wavelength to RGB color mapping
  function wavelengthToColor(wavelength, intensity = 1.0) {
    if (wavelength === 0) {
      // White light
      return `rgba(255, 255, 255, ${Math.min(1.0, intensity)})`;
    }

    let r = 0, g = 0, b = 0;
    let factor = 0;

    if (wavelength >= 380 && wavelength < 440) {
      r = -(wavelength - 440) / (440 - 380);
      g = 0.0;
      b = 1.0;
    } else if (wavelength >= 440 && wavelength < 490) {
      r = 0.0;
      g = (wavelength - 440) / (490 - 440);
      b = 1.0;
    } else if (wavelength >= 490 && wavelength < 510) {
      r = 0.0;
      g = 1.0;
      b = -(wavelength - 510) / (510 - 490);
    } else if (wavelength >= 510 && wavelength < 580) {
      r = (wavelength - 510) / (580 - 510);
      g = 1.0;
      b = 0.0;
    } else if (wavelength >= 580 && wavelength < 645) {
      r = 1.0;
      g = -(wavelength - 645) / (645 - 580);
      b = 0.0;
    } else if (wavelength >= 645 && wavelength <= 780) {
      r = 1.0;
      g = 0.0;
      b = 0.0;
    } else if (wavelength < 380) {
      return `rgba(168, 85, 247, ${0.4 * intensity})`; // UV
    } else {
      return `rgba(239, 68, 68, ${0.4 * intensity})`; // IR
    }

    // Intensity factor for human visual sensitivity curve
    if (wavelength >= 380 && wavelength < 420) {
      factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
    } else if (wavelength >= 420 && wavelength <= 700) {
      factor = 1.0;
    } else if (wavelength > 700 && wavelength <= 780) {
      factor = 0.3 + 0.7 * (780 - wavelength) / (780 - 700);
    } else {
      factor = 0.0;
    }

    const R = Math.round(r * 255);
    const G = Math.round(g * 255);
    const B = Math.round(b * 255);
    const alpha = Math.min(1.0, Math.max(0.15, factor * intensity));

    return `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }

  // Cauchy dispersion equation: n(lambda) = n_base + B / lambda^2
  function getRefractiveIndexForWavelength(nBase, wavelength) {
    if (!wavelength || wavelength <= 0) return nBase;
    const B = 4500; // nm^2
    return nBase + B / (wavelength * wavelength);
  }

  // Main Ray Tracer
  function traceRays(components, settings = {}) {
    const finalRays = [];
    const rayQueue = [];

    // Reset detector power meters
    components.forEach((c) => {
      if (c.type === 'detector' || c.type === 'screen') {
        c.detectedPower = 0;
        c.hitCount = 0;
        c.hitPositions = [];
      }
    });

    // 1. Initialize rays from active light sources
    components.forEach((comp) => {
      if (comp.type === 'laser' || comp.type === 'white_light') {
        const source = comp;
        if (!source.isOn) return;

        const density = settings.laserRayDensity || 3;
        const w = source.beamWidth || 16;
        const div = source.beamDivergence || 0;

        const wavelengthsToEmit =
          (comp.type === 'white_light' || source.wavelength === 0)
            ? [400, 450, 500, 550, 600, 650, 700]
            : [source.wavelength || 532];

        wavelengthsToEmit.forEach((wl) => {
          const wlIntensity = (comp.type === 'white_light' || source.wavelength === 0)
            ? 1.0 / wavelengthsToEmit.length
            : 1.0;

          for (let i = 0; i < density; i++) {
            let localY = 0;
            if (density > 1) {
              localY = -w / 2 + (w * i) / (density - 1);
            } else {
              localY = 0;
            }

            const localStart = { x: 20, y: localY };
            const globalStart = localToGlobalPoint(localStart, source.position, source.rotation);

            let localAngleRad = 0;
            if (div > 0 && density > 1) {
              const fraction = i / (density - 1);
              localAngleRad = degToRad(-div / 2 + div * fraction);
            }

            const localDir = { x: Math.cos(localAngleRad), y: Math.sin(localAngleRad) };
            const globalDir = localToGlobalVector(localDir, source.rotation);

            rayQueue.push({
              origin: globalStart,
              direction: globalDir,
              wavelength: wl,
              intensity: wlIntensity * ((source.power || 5) / 5),
              depth: 0,
              insideComponentId: null,
              path: [globalStart],
            });
          }
        });
      }
    });

    const canvasWidth = 2400;
    const canvasHeight = 1600;
    const maxDepth = settings.maxRayDepth || 8;

    // 2. Ray queue propagation loop
    while (rayQueue.length > 0) {
      const r = rayQueue.shift();

      if (r.depth >= maxDepth || r.intensity < 0.01) {
        finalRays.push({
          origin: r.path[0],
          direction: r.direction,
          wavelength: r.wavelength,
          intensity: r.intensity,
          path: r.path,
          color: wavelengthToColor(r.wavelength, r.intensity),
          isFinished: true,
          type: r.type,
        });
        continue;
      }

      let closestIntersection = null;
      let hitComponent = null;

      components.forEach((comp) => {
        if (
          comp.type === 'laser' ||
          comp.type === 'white_light' ||
          comp.type === 'ruler' ||
          comp.type === 'protractor'
        ) {
          return;
        }

        const localRay = getLocalRay(r.origin, r.direction, comp.position, comp.rotation);
        let localHit = null;

        if (comp.type === 'mirror') {
          const mirror = comp;
          const W = mirror.width || 120;

          if (mirror.mirrorType === 'plane' || mirror.mirrorType === 'partial') {
            localHit = intersectRaySegment(
              localRay.origin,
              localRay.direction,
              { x: -W / 2, y: 0 },
              { x: W / 2, y: 0 }
            );
          } else if (mirror.mirrorType === 'concave') {
            const R = Math.max(10, Math.abs(mirror.focalLength || 120) * 2);
            const thetaSpan = Math.asin(Math.min(0.99, W / (2 * R)));
            localHit = intersectRayArc(
              localRay.origin,
              localRay.direction,
              { x: 0, y: R },
              R,
              Math.PI * 1.5 - thetaSpan,
              Math.PI * 1.5 + thetaSpan
            );
          } else if (mirror.mirrorType === 'convex') {
            const R = Math.max(10, Math.abs(mirror.focalLength || 120) * 2);
            const thetaSpan = Math.asin(Math.min(0.99, W / (2 * R)));
            localHit = intersectRayArc(
              localRay.origin,
              localRay.direction,
              { x: 0, y: -R },
              R,
              Math.PI * 0.5 - thetaSpan,
              Math.PI * 0.5 + thetaSpan
            );
          }
        } else if (comp.type === 'lens') {
          const lens = comp;
          const D = lens.diameter || 80;
          const T = lens.thickness || 16;
          const f = lens.focalLength || 150;
          const n = getRefractiveIndexForWavelength(lens.refractiveIndex || 1.52, r.wavelength);

          const R = Math.max(D / 2 + 5, 2 * (n - 1) * Math.abs(f));
          const thetaSpan = Math.asin(Math.min(0.99, D / (2 * R)));

          if (lens.lensType === 'convex' || lens.lensType === 'cylindrical') {
            const C_L = { x: R - T / 2, y: 0 };
            const C_R = { x: -R + T / 2, y: 0 };

            const hitL = intersectRayArc(localRay.origin, localRay.direction, C_L, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            const hitR = intersectRayArc(localRay.origin, localRay.direction, C_R, R, -thetaSpan, thetaSpan);

            if (hitL && hitR) {
              localHit = hitL.t < hitR.t ? hitL : hitR;
            } else {
              localHit = hitL || hitR;
            }
          } else if (lens.lensType === 'concave') {
            const C_L = { x: -R - T / 2, y: 0 };
            const C_R = { x: R + T / 2, y: 0 };

            const hits = [];
            const hitL = intersectRayArc(localRay.origin, localRay.direction, C_L, R, -thetaSpan, thetaSpan);
            const hitR = intersectRayArc(localRay.origin, localRay.direction, C_R, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            const hitTop = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: -D / 2 }, { x: T / 2, y: -D / 2 });
            const hitBot = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: D / 2 }, { x: T / 2, y: D / 2 });

            if (hitL) hits.push(hitL);
            if (hitR) hits.push(hitR);
            if (hitTop) hits.push(hitTop);
            if (hitBot) hits.push(hitBot);

            if (hits.length > 0) {
              hits.sort((a, b) => a.t - b.t);
              localHit = hits[0];
            }
          } else if (lens.lensType === 'plano-convex') {
            const C_R = { x: T / 2 - R, y: 0 };
            const hits = [];
            const hitFlat = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: -D / 2 }, { x: -T / 2, y: D / 2 });
            const hitCurve = intersectRayArc(localRay.origin, localRay.direction, C_R, R, -thetaSpan, thetaSpan);

            if (hitFlat) hits.push(hitFlat);
            if (hitCurve) hits.push(hitCurve);

            if (hits.length > 0) {
              hits.sort((a, b) => a.t - b.t);
              localHit = hits[0];
            }
          } else if (lens.lensType === 'plano-concave') {
            const C_R = { x: T / 2 + R, y: 0 };
            const hits = [];
            const hitFlat = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: -D / 2 }, { x: -T / 2, y: D / 2 });
            const hitCurve = intersectRayArc(localRay.origin, localRay.direction, C_R, R, Math.PI - thetaSpan, Math.PI + thetaSpan);
            const hitTop = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: -D / 2 }, { x: T / 2, y: -D / 2 });
            const hitBot = intersectRaySegment(localRay.origin, localRay.direction, { x: -T / 2, y: D / 2 }, { x: T / 2, y: D / 2 });

            if (hitFlat) hits.push(hitFlat);
            if (hitCurve) hits.push(hitCurve);
            if (hitTop) hits.push(hitTop);
            if (hitBot) hits.push(hitBot);

            if (hits.length > 0) {
              hits.sort((a, b) => a.t - b.t);
              localHit = hits[0];
            }
          }
        } else if (comp.type === 'grating') {
          const grating = comp;
          const W = grating.width || 120;
          localHit = intersectRaySegment(
            localRay.origin,
            localRay.direction,
            { x: -W / 2, y: 0 },
            { x: W / 2, y: 0 }
          );
        } else if (comp.type === 'prism') {
          const prism = comp;
          const vertices = getPrismVertices(prism.prismType || 'triangular', prism.size || 100);
          localHit = intersectRayPolygon(localRay.origin, localRay.direction, vertices);
        } else if (comp.type === 'medium') {
          const med = comp;
          const W = med.width || 150;
          const H = med.height || 100;
          const vertices = [
            { x: -W / 2, y: -H / 2 },
            { x: W / 2, y: -H / 2 },
            { x: W / 2, y: H / 2 },
            { x: -W / 2, y: H / 2 },
          ];
          localHit = intersectRayPolygon(localRay.origin, localRay.direction, vertices);
        } else if (comp.type === 'single_slit' || comp.type === 'aperture') {
          const slit = comp;
          const W = slit.width || 120;
          const a = slit.slitWidth || 10;
          const hitL = intersectRaySegment(localRay.origin, localRay.direction, { x: -W / 2, y: 0 }, { x: -a / 2, y: 0 });
          const hitR = intersectRaySegment(localRay.origin, localRay.direction, { x: a / 2, y: 0 }, { x: W / 2, y: 0 });
          const hitOpen = intersectRaySegment(localRay.origin, localRay.direction, { x: -a / 2, y: 0 }, { x: a / 2, y: 0 });

          if (hitL && hitR) {
            localHit = hitL.t < hitR.t ? hitL : hitR;
          } else {
            localHit = hitL || hitR;
          }

          if (hitOpen && (!localHit || hitOpen.t < localHit.t)) {
            localHit = { ...hitOpen, faceId: 'opening' };
          }
        } else if (comp.type === 'double_slit') {
          const slit = comp;
          const W = slit.width || 120;
          const a = slit.slitWidth || 6;
          const s = slit.slitSpacing || 24;

          const hitLeft = intersectRaySegment(localRay.origin, localRay.direction, { x: -W / 2, y: 0 }, { x: -s / 2 - a / 2, y: 0 });
          const hitMid = intersectRaySegment(localRay.origin, localRay.direction, { x: -s / 2 + a / 2, y: 0 }, { x: s / 2 - a / 2, y: 0 });
          const hitRight = intersectRaySegment(localRay.origin, localRay.direction, { x: s / 2 + a / 2, y: 0 }, { x: W / 2, y: 0 });

          const hitOpen1 = intersectRaySegment(localRay.origin, localRay.direction, { x: -s / 2 - a / 2, y: 0 }, { x: -s / 2 + a / 2, y: 0 });
          const hitOpen2 = intersectRaySegment(localRay.origin, localRay.direction, { x: s / 2 - a / 2, y: 0 }, { x: s / 2 + a / 2, y: 0 });

          const hits = [];
          if (hitLeft) hits.push(hitLeft);
          if (hitMid) hits.push(hitMid);
          if (hitRight) hits.push(hitRight);

          if (hits.length > 0) {
            hits.sort((a, b) => a.t - b.t);
            localHit = hits[0];
          }

          const openHits = [];
          if (hitOpen1) openHits.push({ ...hitOpen1, faceId: 'opening1' });
          if (hitOpen2) openHits.push({ ...hitOpen2, faceId: 'opening2' });

          if (openHits.length > 0) {
            openHits.sort((a, b) => a.t - b.t);
            const closestOpen = openHits[0];
            if (!localHit || closestOpen.t < localHit.t) {
              localHit = closestOpen;
            }
          }
        } else if (comp.type === 'detector' || comp.type === 'screen') {
          const W = comp.width || (comp.type === 'detector' ? 80 : 150);
          localHit = intersectRaySegment(localRay.origin, localRay.direction, { x: -W / 2, y: 0 }, { x: W / 2, y: 0 });
        } else if (comp.type === 'fiber') {
          const fiber = comp;
          const L = fiber.length || 240;
          const d = fiber.coreDiameter || 22;
          localHit = intersectRaySegment(
            localRay.origin,
            localRay.direction,
            { x: -L / 2, y: -d / 2 },
            { x: -L / 2, y: d / 2 }
          );
        }

        if (localHit) {
          const globalHitPt = localToGlobalPoint(localHit.point, comp.position, comp.rotation);
          const globalNormal = vec.normalize(localToGlobalVector(localHit.normal, comp.rotation));
          const dist = vec.dist(r.origin, globalHitPt);

          if (dist > 1e-3) {
            if (!closestIntersection || dist < closestIntersection.t) {
              closestIntersection = {
                t: dist,
                point: globalHitPt,
                normal: globalNormal,
                u: localHit.u,
                faceId: localHit.faceId,
              };
              hitComponent = comp;
            }
          }
        }
      });

      if (closestIntersection && hitComponent) {
        const hit = closestIntersection;
        const comp = hitComponent;

        r.path.push(hit.point);

        finalRays.push({
          origin: r.path[0],
          direction: r.direction,
          wavelength: r.wavelength,
          intensity: r.intensity,
          path: [...r.path],
          color: wavelengthToColor(r.wavelength, r.intensity),
          isFinished: false,
          type: r.type,
        });

        // Detector & Screen hit registration
        if (comp.type === 'detector' || comp.type === 'screen') {
          const W = comp.width || (comp.type === 'detector' ? 80 : 150);
          const lastRay = finalRays[finalRays.length - 1];
          if (lastRay) {
            lastRay.isFinished = true;
            lastRay.hitComponentId = comp.id;
            lastRay.hitLocalX = -W / 2 + (hit.u || 0) * W;
          }

          comp.hitCount = (comp.hitCount || 0) + 1;
          comp.detectedPower = (comp.detectedPower || 0) + r.intensity * 5; // scaled mW
          comp.hitPositions = comp.hitPositions || [];
          comp.hitPositions.push({
            pos: -W / 2 + (hit.u || 0) * W,
            wavelength: r.wavelength,
            power: r.intensity * 5,
          });
          continue;
        }

        // Optical Fiber (الكيبل الضوئي) TIR Guidance
        if (comp.type === 'fiber') {
          const fiber = comp;
          const L = fiber.length || 240;
          const nCore = fiber.coreIndex || 1.50;
          const nClad = fiber.claddingIndex || 1.45;
          const NA = Math.sqrt(Math.max(0.01, nCore * nCore - nClad * nClad));
          const thetaMax = Math.asin(Math.min(1.0, NA));

          const fiberDirGlobal = localToGlobalVector({ x: 1, y: 0 }, comp.rotation);
          const cosAngle = Math.abs(vec.dot(r.direction, fiberDirGlobal));
          const incidentAngle = Math.acos(Math.min(1.0, cosAngle));

          if (incidentAngle <= thetaMax + 0.15) {
            fiber.isGuiding = true;
            fiber.guidedPower = (fiber.guidedPower || 0) + r.intensity * 5;

            const pOutLocal = { x: L / 2, y: 0 };
            const pOutGlobal = localToGlobalPoint(pOutLocal, comp.position, comp.rotation);
            const mid1 = localToGlobalPoint({ x: -L / 4, y: 3.5 }, comp.position, comp.rotation);
            const mid2 = localToGlobalPoint({ x: 0, y: -3.5 }, comp.position, comp.rotation);
            const mid3 = localToGlobalPoint({ x: L / 4, y: 3.5 }, comp.position, comp.rotation);

            r.path.push(mid1, mid2, mid3, pOutGlobal);

            rayQueue.push({
              origin: pOutGlobal,
              direction: fiberDirGlobal,
              wavelength: r.wavelength,
              intensity: r.intensity * 0.94,
              depth: r.depth + 1,
              insideComponentId: null,
              path: [pOutGlobal],
              type: 'Fiber_Guided',
            });
          }
          continue;
        }

        // Mirrors
        if (comp.type === 'mirror') {
          const mirror = comp;

          if (mirror.mirrorType === 'partial') {
            const reflectDir = vec.normalize(vec.sub(r.direction, vec.scale(hit.normal, 2 * vec.dot(r.direction, hit.normal))));
            const R = mirror.reflectivity !== undefined ? mirror.reflectivity : 0.5;

            // Reflected
            rayQueue.push({
              origin: hit.point,
              direction: reflectDir,
              wavelength: r.wavelength,
              intensity: r.intensity * R,
              depth: r.depth + 1,
              insideComponentId: r.insideComponentId,
              path: [hit.point],
              type: 'Reflected',
            });

            // Transmitted
            rayQueue.push({
              origin: hit.point,
              direction: r.direction,
              wavelength: r.wavelength,
              intensity: r.intensity * (1 - R),
              depth: r.depth + 1,
              insideComponentId: r.insideComponentId,
              path: [hit.point],
              type: 'Transmitted',
            });
          } else {
            const reflectDir = vec.normalize(vec.sub(r.direction, vec.scale(hit.normal, 2 * vec.dot(r.direction, hit.normal))));
            const R = mirror.reflectivity !== undefined ? mirror.reflectivity : 1.0;
            rayQueue.push({
              origin: hit.point,
              direction: reflectDir,
              wavelength: r.wavelength,
              intensity: r.intensity * R,
              depth: r.depth + 1,
              insideComponentId: r.insideComponentId,
              path: [hit.point],
            });
          }
        }
        // Refraction through Lens, Prism, or Medium
        else if (comp.type === 'lens' || comp.type === 'prism' || comp.type === 'medium') {
          const isInside = r.insideComponentId === comp.id;
          const nBase = comp.refractiveIndex || 1.5;
          const nObject = getRefractiveIndexForWavelength(nBase, r.wavelength);

          const n1 = isInside ? nObject : 1.0;
          const n2 = isInside ? 1.0 : nObject;

          let nVec = hit.normal;
          if (vec.dot(r.direction, nVec) > 0) {
            nVec = vec.scale(nVec, -1);
          }

          const eta = n1 / n2;
          const cosI = -vec.dot(nVec, r.direction);
          const sin2T = eta * eta * (1.0 - cosI * cosI);

          let nextIntensity = r.intensity;
          if (isInside && comp.type === 'medium') {
            const distance = vec.dist(r.origin, hit.point);
            const alpha = comp.absorptionCoefficient || 0;
            nextIntensity = r.intensity * Math.exp(-alpha * distance);
          }

          if (sin2T > 1.0) {
            // Total Internal Reflection (TIR)
            const reflectDir = vec.normalize(vec.sub(r.direction, vec.scale(nVec, 2 * vec.dot(r.direction, nVec))));
            rayQueue.push({
              origin: hit.point,
              direction: reflectDir,
              wavelength: r.wavelength,
              intensity: nextIntensity,
              depth: r.depth + 1,
              insideComponentId: r.insideComponentId,
              path: [hit.point],
              type: 'TIR',
            });
          } else {
            // Snell's Law Refraction
            const cosT = Math.sqrt(1.0 - sin2T);
            const refractDir = vec.normalize(
              vec.add(vec.scale(r.direction, eta), vec.scale(nVec, eta * cosI - cosT))
            );

            const nextInsideComponentId = isInside ? null : comp.id;

            rayQueue.push({
              origin: hit.point,
              direction: refractDir,
              wavelength: r.wavelength,
              intensity: nextIntensity,
              depth: r.depth + 1,
              insideComponentId: nextInsideComponentId,
              path: [hit.point],
            });
          }
        }
        // Diffraction Grating (Orders m = -2, -1, 0, 1, 2)
        else if (comp.type === 'grating') {
          const grating = comp;
          const localRay = getLocalRay(r.origin, r.direction, comp.position, comp.rotation);
          const theta_i = Math.atan2(localRay.direction.y, localRay.direction.x);
          const incomingNormalAngle = localRay.direction.y > 0 ? Math.PI / 2 : -Math.PI / 2;
          const relativeAngle = theta_i - incomingNormalAngle;

          const d_nm = 1e6 / (grating.gratingDensity || 600);
          const lambda_nm = r.wavelength || 532;
          const orders = [-2, -1, 0, 1, 2];

          orders.forEach((m) => {
            const sin_theta_m = Math.sin(relativeAngle) + (m * lambda_nm) / d_nm;

            if (Math.abs(sin_theta_m) <= 1.0) {
              const rel_theta_m = Math.asin(sin_theta_m);
              const localTheta = rel_theta_m + incomingNormalAngle;
              const localDiffractedDir = { x: Math.cos(localTheta), y: Math.sin(localTheta) };
              const globalDiffractedDir = vec.normalize(localToGlobalVector(localDiffractedDir, comp.rotation));

              let orderIntensity = r.intensity;
              if (m === 0) orderIntensity *= 0.55;
              else if (Math.abs(m) === 1) orderIntensity *= 0.22;
              else orderIntensity *= 0.08;

              rayQueue.push({
                origin: hit.point,
                direction: globalDiffractedDir,
                wavelength: r.wavelength,
                intensity: orderIntensity,
                depth: r.depth + 1,
                insideComponentId: r.insideComponentId,
                path: [hit.point],
                type: `m = ${m}`,
              });
            }
          });
        }
        // Single Slit
        else if (comp.type === 'single_slit' || comp.type === 'aperture') {
          if (hit.faceId === 'opening') {
            const slitWidth = comp.slitWidth || 10;
            const lambda = r.wavelength || 532;
            const a_nm = slitWidth * 100;
            const sin_theta = lambda / a_nm;

            const angles = [0];
            if (sin_theta <= 1.0) {
              const theta = Math.asin(sin_theta);
              angles.push(theta);
              angles.push(-theta);
            }

            const localRay = getLocalRay(r.origin, r.direction, comp.position, comp.rotation);
            const incomingAngle = Math.atan2(localRay.direction.y, localRay.direction.x);
            const normalAngle = localRay.direction.y > 0 ? Math.PI / 2 : -Math.PI / 2;
            const relAngle = incomingAngle - normalAngle;

            angles.forEach((da, idx) => {
              const nextAngle = relAngle + da + normalAngle;
              const localDir = { x: Math.cos(nextAngle), y: Math.sin(nextAngle) };
              const globalDir = vec.normalize(localToGlobalVector(localDir, comp.rotation));

              rayQueue.push({
                origin: hit.point,
                direction: globalDir,
                wavelength: r.wavelength,
                intensity: r.intensity * (idx === 0 ? 0.7 : 0.15),
                depth: r.depth + 1,
                insideComponentId: r.insideComponentId,
                path: [hit.point],
                type: idx === 0 ? '0th Order' : 'Diffracted',
              });
            });
          }
        }
        // Double Slit (Young)
        else if (comp.type === 'double_slit') {
          if (hit.faceId && hit.faceId.startsWith('opening')) {
            const slitSpacing = comp.slitSpacing || 24;
            const lambda = r.wavelength || 532;
            const d_nm = slitSpacing * 100;
            const sin_theta = lambda / d_nm;

            const angles = [0];
            if (sin_theta <= 1.0) {
              const theta = Math.asin(sin_theta);
              angles.push(theta);
              angles.push(-theta);
            }

            const localRay = getLocalRay(r.origin, r.direction, comp.position, comp.rotation);
            const incomingAngle = Math.atan2(localRay.direction.y, localRay.direction.x);
            const normalAngle = localRay.direction.y > 0 ? Math.PI / 2 : -Math.PI / 2;
            const relAngle = incomingAngle - normalAngle;

            angles.forEach((da, idx) => {
              const nextAngle = relAngle + da + normalAngle;
              const localDir = { x: Math.cos(nextAngle), y: Math.sin(nextAngle) };
              const globalDir = vec.normalize(localToGlobalVector(localDir, comp.rotation));

              rayQueue.push({
                origin: hit.point,
                direction: globalDir,
                wavelength: r.wavelength,
                intensity: r.intensity * (idx === 0 ? 0.6 : 0.2),
                depth: r.depth + 1,
                insideComponentId: r.insideComponentId,
                path: [hit.point],
                type: idx === 0 ? 'Central' : 'Interference',
              });
            });
          }
        }
      } else {
        // Ray reaches boundaries
        const tMax = Math.max(canvasWidth, canvasHeight) * 2;
        const endPoint = vec.add(r.origin, vec.scale(r.direction, tMax));
        r.path.push(endPoint);

        finalRays.push({
          origin: r.path[0],
          direction: r.direction,
          wavelength: r.wavelength,
          intensity: r.intensity,
          path: r.path,
          color: wavelengthToColor(r.wavelength, r.intensity),
          isFinished: true,
          type: r.type,
        });
      }
    }

    return finalRays;
  }

  window.OpticalRayTracer = {
    wavelengthToColor,
    getRefractiveIndexForWavelength,
    traceRays,
  };

})(typeof window !== 'undefined' ? window : this);
