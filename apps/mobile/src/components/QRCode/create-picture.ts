import { ClipOp, Skia, SkImage } from '@shopify/react-native-skia';
import { SharedValue } from 'react-native-reanimated';

import { CANVAS_HEIGHT, CANVAS_WIDTH, CENTER_X, CENTER_Y, DISTANCE } from './constants';
import { reusableClipPath, reusablePaint, reusableWhiteBgPaint } from './data';
import { ColorConfig, Point3D, ShapeData } from './types';
import { rotateX, rotateY, smoothstep } from './utils';

interface AvatarTransform {
  index: number;
  x: number;
  y: number;
  size: number;
  cornerRadius: number;
  imageOpacity: number;
  z: number;
  morphProgress: number;
}

export const createPicture = (
  spriteSheet: SkImage,
  progress: SharedValue<number>,
  iTime: SharedValue<number>,
  staggerBaseTime: SharedValue<number>,
  frozenRotationTime: SharedValue<number>,
  shapeData: ShapeData,
  colors: ColorConfig,
  avatarSize: number,
) => {
  'worklet';

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));

  const progressValue = progress.value;
  const timeValue = iTime.value % (Math.PI * 2);
  const staggerTime = staggerBaseTime.value;
  const frozenRotation = frozenRotationTime.value;

  const { allShapes, nPoints, qrModuleSize, avatarAssignments, spriteCoords } = shapeData;

  const [satMin, satMax] = colors.saturationRange;
  const [lightMin, lightMax] = colors.lightnessRange;
  const satRange = satMax - satMin;
  const lightRange = lightMax - lightMin;

  const transforms: AvatarTransform[] = [];

  for (let index = 0; index < nPoints; index++) {
    const torusPoint = allShapes[0][index];

    let rotatedTorus = rotateX(torusPoint, 0.3);
    rotatedTorus = rotateY(rotatedTorus, staggerTime);

    const angle = Math.atan2(rotatedTorus.z, rotatedTorus.x);
    const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
    const waveDelay = normalizedAngle * 0.25;
    const staggeredProgress = Math.min(1, Math.max(0, (progressValue - waveDelay) / (1 - waveDelay)));

    const eased =
      staggeredProgress < 0.5
        ? 4 * Math.pow(staggeredProgress, 3)
        : 1 - Math.pow(-2 * staggeredProgress + 2, 3) / 2;

    const baseX = allShapes[0][index].x + (allShapes[1][index].x - allShapes[0][index].x) * eased;
    const baseY = allShapes[0][index].y + (allShapes[1][index].y - allShapes[0][index].y) * eased;
    const baseZ = allShapes[0][index].z + (allShapes[1][index].z - allShapes[0][index].z) * eased;

    const transitionBoost = Math.sin(eased * Math.PI) * 0.6;
    let rotationDelta = timeValue - frozenRotation;
    if (rotationDelta > Math.PI) rotationDelta -= 2 * Math.PI;
    if (rotationDelta < -Math.PI) rotationDelta += 2 * Math.PI;

    const rotationAmount = (frozenRotation + rotationDelta) * (1 - eased) + transitionBoost;
    const tiltAmount = 0.3 * (1 - eased);

    let p: Point3D = { x: baseX, y: baseY, z: baseZ };
    p = rotateX(p, tiltAmount);
    p = rotateY(p, rotationAmount);

    const scale = DISTANCE / (DISTANCE + p.z);
    const screenX = CENTER_X + p.x * scale;
    const screenY = CENTER_Y + p.y * scale;

    const avatarScale = avatarSize * scale;
    const qrScale = qrModuleSize * scale * 0.9;
    const baseSize = avatarScale + (qrScale - avatarScale) * eased;

    const pulsePhase = eased * Math.PI;
    const scalePulse = 1 + Math.sin(pulsePhase) * Math.pow(1 - eased, 0.5) * 0.3;
    const size = baseSize * scalePulse;

    const cornerRadius = (size / 2) * (1 - eased);
    const frontFade = smoothstep(100, -150, p.z);
    const imageOpacity = (1 - eased) * frontFade;

    transforms.push({ index, x: screenX - size / 2, y: screenY - size / 2, size, cornerRadius, imageOpacity, z: p.z, morphProgress: eased });
  }

  for (let i = 1; i < transforms.length; i++) {
    const current = transforms[i];
    let j = i - 1;
    while (j >= 0 && transforms[j].z < current.z) {
      transforms[j + 1] = transforms[j];
      j--;
    }
    transforms[j + 1] = current;
  }

  for (const t of transforms) {
    const avatarIndex = avatarAssignments[t.index];
    const coords = spriteCoords[avatarIndex];

    const srcRect = Skia.XYWHRect(coords.x, coords.y, coords.w, coords.h);
    const dstRect = Skia.XYWHRect(t.x, t.y, t.size, t.size);

    const baseSat = satMin + (avatarIndex % 5) * (satRange / 4);
    const baseLight = lightMin + (avatarIndex % 4) * (lightRange / 3);
    const contrastBoost = t.morphProgress;
    const sat = Math.min(100, baseSat + 10 * contrastBoost);
    const light = Math.max(30, baseLight - 15 * contrastBoost);

    const bgColor = `hsl(${colors.hue}, ${sat}%, ${light}%)`;
    reusableWhiteBgPaint.setColor(Skia.Color(bgColor));
    reusableWhiteBgPaint.setAlphaf(Math.max(t.imageOpacity, t.morphProgress));

    const padding = 1;
    const bgRect = Skia.XYWHRect(t.x - padding, t.y - padding, t.size + padding, t.size + padding);
    const bgRadius = (t.size + padding) / 2;
    canvas.drawRRect(Skia.RRectXY(bgRect, bgRadius, bgRadius), reusableWhiteBgPaint);

    if (t.imageOpacity > 0) {
      reusablePaint.setAlphaf(t.imageOpacity);
      canvas.save();
      reusableClipPath.reset();
      reusableClipPath.addRRect(Skia.RRectXY(dstRect, t.cornerRadius, t.cornerRadius));
      canvas.clipPath(reusableClipPath, ClipOp.Intersect, true);
      canvas.drawImageRect(spriteSheet, srcRect, dstRect, reusablePaint);
      canvas.restore();
    }
  }

  return recorder.finishRecordingAsPicture();
};
