/**
 * LASER SCIENCE & TECHNOLOGY - OPTICAL GEOMETRY ENGINE
 * Based on high-precision 2D ray-optics mathematical calculations
 * University of Technology - Iraq | College of Laser Science and Technology
 */

(function (window) {
  'use strict';

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function radToDeg(rad) {
    return (rad * 180) / Math.PI;
  }

  // Vector 2D Operations
  const vec = {
    add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
    sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
    scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
    dot: (v1, v2) => v1.x * v2.x + v1.y * v2.y,
    cross: (v1, v2) => v1.x * v2.y - v1.y * v2.x,
    lenSq: (v) => v.x * v.x + v.y * v.y,
    len: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
    normalize: (v) => {
      const l = Math.sqrt(v.x * v.x + v.y * v.y);
      return l === 0 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
    },
    dist: (v1, v2) => Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2),
    distSq: (v1, v2) => (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2,
    rotate: (v, angleRad) => {
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      return {
        x: v.x * cos - v.y * sin,
        y: v.x * sin + v.y * cos,
      };
    },
    angle: (v) => Math.atan2(v.y, v.x),
  };

  // Transform helpers for components
  function getLocalRay(rayOrigin, rayDir, compPos, compRotationDeg) {
    const localOrigin = vec.rotate(vec.sub(rayOrigin, compPos), -degToRad(compRotationDeg));
    const localDir = vec.normalize(vec.rotate(rayDir, -degToRad(compRotationDeg)));
    return { origin: localOrigin, direction: localDir };
  }

  function localToGlobalPoint(localPt, compPos, compRotationDeg) {
    return vec.add(compPos, vec.rotate(localPt, degToRad(compRotationDeg)));
  }

  function localToGlobalVector(localVec, compRotationDeg) {
    return vec.rotate(localVec, degToRad(compRotationDeg));
  }

  function globalToLocal(globalPt, compPos, compRotationDeg) {
    return vec.rotate(vec.sub(globalPt, compPos), -degToRad(compRotationDeg));
  }

  const EPSILON = 1e-4;

  // Ray-Segment Intersection
  function intersectRaySegment(O, D, A, B) {
    const V = vec.sub(B, A);
    const det = D.x * V.y - D.y * V.x;

    if (Math.abs(det) < 1e-8) {
      return null; // Parallel
    }

    const t = ((A.x - O.x) * V.y - (A.y - O.y) * V.x) / det;
    const u = ((A.x - O.x) * D.y - (A.y - O.y) * D.x) / det;

    if (t >= EPSILON && u >= 0 && u <= 1) {
      const pt = vec.add(O, vec.scale(D, t));
      let normal = vec.normalize({ x: -V.y, y: V.x });
      if (vec.dot(normal, D) > 0) {
        normal = vec.scale(normal, -1);
      }
      return { t, point: pt, normal, u };
    }

    return null;
  }

  // Ray-Circle Intersection
  function intersectRayCircle(O, D, C, R) {
    const W = vec.sub(O, C);
    const b = vec.dot(W, D);
    const c = vec.dot(W, W) - R * R;
    const disc = b * b - c;

    if (disc < 0) return null;

    const sqrtDisc = Math.sqrt(disc);
    return {
      t1: -b - sqrtDisc,
      t2: -b + sqrtDisc,
    };
  }

  // Ray-Arc Intersection
  function intersectRayArc(O, D, C, R, thetaStartRad, thetaEndRad) {
    const hits = intersectRayCircle(O, D, C, R);
    if (!hits) return null;

    const validHits = [];

    const checkArc = (t) => {
      if (t < EPSILON) return;
      const pt = vec.add(O, vec.scale(D, t));
      const radial = vec.sub(pt, C);
      let angle = Math.atan2(radial.y, radial.x);
      if (angle < 0) angle += Math.PI * 2;

      let start = thetaStartRad;
      let end = thetaEndRad;
      if (start < 0) start += Math.PI * 2;
      if (end < 0) end += Math.PI * 2;

      let inside = false;
      if (start <= end) {
        inside = angle >= start && angle <= end;
      } else {
        inside = angle >= start || angle <= end;
      }

      if (inside) {
        let normal = vec.normalize(radial);
        if (vec.dot(normal, D) > 0) {
          normal = vec.scale(normal, -1);
        }
        validHits.push({ t, point: pt, normal });
      }
    };

    checkArc(hits.t1);
    checkArc(hits.t2);

    if (validHits.length === 0) return null;
    validHits.sort((a, b) => a.t - b.t);
    return validHits[0];
  }

  // Ray-Polygon Intersection
  function intersectRayPolygon(O, D, vertices) {
    let closest = null;

    for (let i = 0; i < vertices.length; i++) {
      const A = vertices[i];
      const B = vertices[(i + 1) % vertices.length];
      const hit = intersectRaySegment(O, D, A, B);
      if (hit) {
        if (!closest || hit.t < closest.t) {
          closest = {
            ...hit,
            faceId: `edge_${i}`,
          };
        }
      }
    }

    return closest;
  }

  // Generate vertices for geometric prisms
  function getPrismVertices(prismType, size) {
    const vertices = [];
    if (prismType === 'triangular') {
      const h = (size * Math.sqrt(3)) / 2;
      vertices.push({ x: 0, y: (-2 * h) / 3 });
      vertices.push({ x: size / 2, y: h / 3 });
      vertices.push({ x: -size / 2, y: h / 3 });
    } else if (prismType === 'rectangular') {
      const w = size;
      const h = size * 0.6;
      vertices.push({ x: -w / 2, y: -h / 2 });
      vertices.push({ x: w / 2, y: -h / 2 });
      vertices.push({ x: w / 2, y: h / 2 });
      vertices.push({ x: -w / 2, y: h / 2 });
    } else if (prismType === 'pentagonal') {
      const r = size / 2;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        vertices.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
      }
    } else {
      vertices.push({ x: -size * 0.4, y: -size * 0.3 });
      vertices.push({ x: size * 0.4, y: -size * 0.3 });
      vertices.push({ x: size * 0.5, y: size * 0.3 });
      vertices.push({ x: -size * 0.5, y: size * 0.3 });
    }
    return vertices;
  }

  // Export to window.OpticalGeometry
  window.OpticalGeometry = {
    degToRad,
    radToDeg,
    vec,
    getLocalRay,
    localToGlobalPoint,
    localToGlobalVector,
    globalToLocal,
    intersectRaySegment,
    intersectRayCircle,
    intersectRayArc,
    intersectRayPolygon,
    getPrismVertices,
    EPSILON,
  };

})(typeof window !== 'undefined' ? window : this);
