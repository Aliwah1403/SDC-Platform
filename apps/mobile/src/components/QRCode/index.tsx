import { StyleSheet, View } from 'react-native';
import { useEffect, useRef } from 'react';

import { Canvas, Picture, Skia, useImage } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Easing,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ToggleButton } from './components';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_AVATAR_SIZE,
  DEFAULT_COLORS,
  DEFAULT_QR_TARGET_HEIGHT,
  DEFAULT_TORUS,
} from './constants';
import { createPicture } from './create-picture';
import { useShapeData } from './hooks';
import { QRCodeAnimationProps, QRCodeAnimationRef, SpriteConfig } from './types';
import { hapticSoft } from './utils';

const HAPTIC_THRESHOLDS = [0.05, 0.12, 0.21, 0.32];

const QRCodeAnimation = ({
  qrData,
  sprite,
  colors = DEFAULT_COLORS,
  torus = DEFAULT_TORUS,
  avatarSize = DEFAULT_AVATAR_SIZE,
  qrTargetHeight = DEFAULT_QR_TARGET_HEIGHT,
  progress: externalProgress,
  ref,
}: QRCodeAnimationProps) => {
  const iTime = useSharedValue(0.0);
  const internalProgress = useSharedValue(0);
  const progress = externalProgress ?? internalProgress;
  const isShowingQR = useSharedValue(false);
  const lastHapticIndex = useSharedValue(-1);
  const staggerBaseTime = useSharedValue(0.0);
  const frozenRotationTime = useSharedValue(0.0);

  const shapeData = useShapeData(qrData, torus, qrTargetHeight, sprite);
  const spriteSheet = useImage(sprite.source);

  const toggle = () => {
    const showQR = !isShowingQR.value;
    isShowingQR.value = showQR;
    lastHapticIndex.value = -1;

    const currentRotation = iTime.value % (2 * Math.PI);
    staggerBaseTime.value = currentRotation;
    frozenRotationTime.value = currentRotation;

    progress.value = withSpring(showQR ? 1 : 0, {
      duration: showQR ? 6000 : 4000,
      dampingRatio: 1,
    });
  };

  if (ref) {
    ref.current = { toggle };
  }

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (previous === null) return;
      if (current > previous) {
        for (let i = 0; i < HAPTIC_THRESHOLDS.length; i++) {
          if (
            previous < HAPTIC_THRESHOLDS[i] &&
            current >= HAPTIC_THRESHOLDS[i] &&
            i > lastHapticIndex.value
          ) {
            lastHapticIndex.value = i;
            scheduleOnRN(hapticSoft);
            break;
          }
        }
      } else if (current < 0.05) {
        lastHapticIndex.value = -1;
      }
    },
  );

  useEffect(() => {
    const duration = 40000;
    const rotations = 1000;
    iTime.value = withTiming(Math.PI * 2 * rotations, {
      duration: duration * rotations,
      easing: Easing.linear,
    });
  }, [iTime]);

  const picture = useDerivedValue(() => {
    if (!spriteSheet) {
      const recorder = Skia.PictureRecorder();
      recorder.beginRecording(Skia.XYWHRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT));
      return recorder.finishRecordingAsPicture();
    }
    return createPicture(
      spriteSheet,
      progress,
      iTime,
      staggerBaseTime,
      frozenRotationTime,
      shapeData,
      colors,
      avatarSize,
    );
  }, [spriteSheet, progress, iTime, staggerBaseTime, frozenRotationTime, shapeData, colors, avatarSize]);

  if (!spriteSheet || shapeData.nPoints === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        <Picture picture={picture} />
      </Canvas>
    </View>
  );
};

const DEFAULT_SPRITE: SpriteConfig = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  source: require('./avatars-sprite.png'),
  cols: 5,
  rows: 4,
  cellSize: 128,
  numAvatars: 20,
};

interface HemoQRCodeProps {
  qrData: string;
}

export const HemoQRCode = ({ qrData }: HemoQRCodeProps) => {
  const animationRef = useRef<QRCodeAnimationRef | null>(null);
  const progress = useSharedValue(0);

  return (
    <View style={styles.container}>
      <QRCodeAnimation
        ref={animationRef}
        qrData={qrData}
        sprite={DEFAULT_SPRITE}
        progress={progress}
      />

      <LinearGradient
        colors={['#F8F4F0', 'rgba(248,244,240,0.8)', 'rgba(248,244,240,0)']}
        locations={[0, 0.4, 1]}
        style={styles.topGradient}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(248,244,240,0)', 'rgba(248,244,240,0.9)', '#F8F4F0']}
        locations={[0, 0.6, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <ToggleButton
        progress={progress}
        onPress={() => animationRef.current?.toggle()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomGradient: {
    bottom: 0,
    height: 280,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  canvas: {
    height: CANVAS_HEIGHT,
    position: 'absolute',
    width: CANVAS_WIDTH,
  },
  container: {
    backgroundColor: '#F8F4F0',
    flex: 1,
  },
  topGradient: {
    height: 150,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export type { QRCodeAnimationProps, QRCodeAnimationRef };
