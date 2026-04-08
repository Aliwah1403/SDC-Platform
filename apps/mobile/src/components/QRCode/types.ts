import type { DataSourceParam } from '@shopify/react-native-skia';

export type Point3D = { x: number; y: number; z: number };

export interface SpriteConfig {
  source: DataSourceParam;
  cols: number;
  rows: number;
  cellSize: number;
  numAvatars: number;
}

export interface ColorConfig {
  hue: number;
  saturationRange: [number, number];
  lightnessRange: [number, number];
}

export interface TorusConfig {
  majorRadius: number;
  minorRadius: number;
  targetHeight: number;
}

export interface QRCodeAnimationRef {
  toggle: () => void;
}

export interface QRCodeAnimationProps {
  qrData: string;
  sprite: SpriteConfig;
  colors?: ColorConfig;
  torus?: TorusConfig;
  avatarSize?: number;
  qrTargetHeight?: number;
  progress?: import('react-native-reanimated').SharedValue<number>;
  ref?: React.RefObject<QRCodeAnimationRef | null>;
}

export interface ShapeData {
  allShapes: [Point3D[], Point3D[]];
  nPoints: number;
  qrSize: number;
  qrModuleSize: number;
  avatarAssignments: number[];
  spriteCoords: Array<{ x: number; y: number; w: number; h: number }>;
}
