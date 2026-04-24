import { Point3D } from '../types';

export const hungarianMatch = (source: Point3D[], target: Point3D[]): Point3D[] => {
  const n = source.length;
  if (n !== target.length) {
    throw new Error('Point sets must have equal length');
  }

  const result: Point3D[] = new Array(n);
  const usedTarget = new Set<number>();

  for (let i = 0; i < n; i++) {
    const src = source[i];
    let bestDist = Infinity;
    let bestIdx = -1;

    for (let j = 0; j < n; j++) {
      if (usedTarget.has(j)) continue;
      const dx = src.x - target[j].x;
      const dy = src.y - target[j].y;
      const dz = src.z - target[j].z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < bestDist) {
        bestDist = distSq;
        bestIdx = j;
      }
    }

    result[i] = target[bestIdx];
    usedTarget.add(bestIdx);
  }

  return result;
};
