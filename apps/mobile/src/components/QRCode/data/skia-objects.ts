import { Skia } from '@shopify/react-native-skia';

// Reusable Skia objects — created once, reused every frame for performance
export const reusablePaint = Skia.Paint();

export const reusableBlackPaint = Skia.Paint();
reusableBlackPaint.setColor(Skia.Color('#09332C'));

export const reusableWhiteBgPaint = Skia.Paint();

export const reusableClipPath = Skia.Path.Make();
