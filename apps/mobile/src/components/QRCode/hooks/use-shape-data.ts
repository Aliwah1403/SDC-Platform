import { useEffect, useRef, useState } from 'react';

import {
  generateQRMatrix,
  generateQRPointsFromModules,
  generateTorusPoints,
  getQRBlackModules,
  hungarianMatch,
  normalizeShape,
  sortBySpiral,
  sortTorusByFlow,
} from '../utils';

import type { Point3D, ShapeData, SpriteConfig, TorusConfig } from '../types';

const shapeDataCache = new Map<string, ShapeData>();

const computeShapeData = (
  qrData: string,
  torus: TorusConfig,
  qrTargetHeight: number,
  sprite: SpriteConfig,
): ShapeData => {
  const qrMatrix = generateQRMatrix(qrData);
  const qrBlackModules = getQRBlackModules(qrMatrix);

  const nPoints = qrBlackModules.length;
  const qrSize = qrMatrix.length;
  const qrModuleSize = qrTargetHeight / qrSize;

  const rawTorusPoints = generateTorusPoints(nPoints, torus.majorRadius, torus.minorRadius);
  const rawQRPoints = generateQRPointsFromModules(qrBlackModules, qrSize);

  const normalizedTorus = normalizeShape(rawTorusPoints, torus.targetHeight);
  const normalizedQR = normalizeShape(rawQRPoints, qrTargetHeight);

  const torusPoints = sortTorusByFlow(normalizedTorus);
  const qrPoints = hungarianMatch(torusPoints, sortBySpiral(normalizedQR));

  const avatarAssignments = Array.from({ length: nPoints }, (_, i) => i % sprite.numAvatars);

  const spriteCoords = Array.from({ length: sprite.numAvatars }, (_, i) => ({
    x: (i % sprite.cols) * sprite.cellSize,
    y: Math.floor(i / sprite.cols) * sprite.cellSize,
    w: sprite.cellSize,
    h: sprite.cellSize,
  }));

  return {
    allShapes: [torusPoints, qrPoints],
    nPoints,
    qrSize,
    qrModuleSize,
    avatarAssignments,
    spriteCoords,
  };
};

const EMPTY_SHAPE_DATA: ShapeData = {
  allShapes: [[], []] as [Point3D[], Point3D[]],
  nPoints: 0,
  qrSize: 0,
  qrModuleSize: 0,
  avatarAssignments: [],
  spriteCoords: [],
};

export const useShapeData = (
  qrData: string,
  torus: TorusConfig,
  qrTargetHeight: number,
  sprite: SpriteConfig,
): ShapeData => {
  const cacheKey = `${qrData}-${torus.majorRadius}-${torus.minorRadius}-${torus.targetHeight}-${qrTargetHeight}`;
  const cached = shapeDataCache.get(cacheKey);

  const [shapeData, setShapeData] = useState<ShapeData>(cached ?? EMPTY_SHAPE_DATA);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (shapeDataCache.has(cacheKey)) {
      setShapeData(shapeDataCache.get(cacheKey)!);
      return;
    }

    let rafId: number;
    let timeoutId: ReturnType<typeof setTimeout>;

    rafId = requestAnimationFrame(() => {
      timeoutId = setTimeout(() => {
        if (!mountedRef.current) return;
        const data = computeShapeData(qrData, torus, qrTargetHeight, sprite);
        shapeDataCache.set(cacheKey, data);
        if (mountedRef.current) setShapeData(data);
      }, 0);
    });

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [cacheKey, qrData, torus, qrTargetHeight, sprite]);

  return shapeData;
};
