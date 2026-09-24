import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { fonts } from '@/utils/fonts'
import type { ToastConfig } from './ToastProvider'

const ENTER_OFFSET = 200
const HIDDEN_SCALE = 0.7
const AUTO_DISMISS_MS = 3000
const FADE_IN_MS = 200
const EXIT_MS = 160
const EXIT_DROP = 40
const SWIPE_EXIT_DROP = 80
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1)
const DISMISS_DISTANCE = 56
const DISMISS_VELOCITY = 800
const STACK_PEEK = 14
const STACK_SCALE_STEP = 0.05
const MAX_VISIBLE = 3

type DismissKind = 'timeout' | 'close' | 'swipe'

interface ToastProps {
  toast: ToastConfig
  index: number
  height?: number
  frontHeight?: number
  onHeightChange: (id: number, height: number) => void
  onDismissStart: (id: number) => void
  onDismissed: (id: number) => void
}

function rubberBand(distance: number) {
  'worklet'
  return (40 * distance) / (distance + 120)
}

function stackOffset(index: number, height: number, frontHeight: number) {
  const scale = 1 - index * STACK_SCALE_STEP
  return -frontHeight + (height * (1 + scale)) / 2 - index * STACK_PEEK
}

export function Toast({
  toast,
  index,
  height,
  frontHeight,
  onHeightChange,
  onDismissStart,
  onDismissed,
}: ToastProps) {
  const insets = useSafeAreaInsets()
  const reduced = useReducedMotion()
  const dir = toast.position === 'top' ? -1 : 1
  const progress = useSharedValue(0)
  const opacity = useSharedValue(0)
  const dragY = useSharedValue(0)
  const stackY = useSharedValue(0)
  const stackScale = useSharedValue(1 - index * STACK_SCALE_STEP)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitingRef = useRef(false)
  const indexRef = useRef(index)
  const dismissRef = useRef<(kind: DismissKind) => void>(() => {})
  indexRef.current = index

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const restartTimer = useCallback(() => {
    if (exitingRef.current) return
    clearTimer()
    timerRef.current = setTimeout(() => dismissRef.current('timeout'), AUTO_DISMISS_MS)
  }, [clearTimer])

  const finishDismiss = useCallback(() => {
    onDismissed(toast.id)
  }, [onDismissed, toast.id])

  const dismiss = useCallback(
    (kind: DismissKind) => {
      if (exitingRef.current) return
      exitingRef.current = true
      clearTimer()
      onDismissStart(toast.id)

      opacity.set(
        withTiming(0, { duration: EXIT_MS, easing: EASE_OUT }, (finished) => {
          if (finished) scheduleOnRN(finishDismiss)
        }),
      )

      if (reduced) return
      if (kind === 'swipe') {
        dragY.set(
          withTiming(dragY.get() + dir * SWIPE_EXIT_DROP, {
            duration: EXIT_MS,
            easing: EASE_OUT,
          }),
        )
      } else if (indexRef.current === 0) {
        dragY.set(withTiming(dir * EXIT_DROP, { duration: EXIT_MS, easing: EASE_OUT }))
      }
    },
    [clearTimer, dir, dragY, finishDismiss, onDismissStart, opacity, reduced, toast.id],
  )

  useEffect(() => {
    dismissRef.current = dismiss
  }, [dismiss])

  useEffect(() => {
    progress.set(reduced ? 1 : withSpring(1))
    opacity.set(withTiming(1, { duration: FADE_IN_MS }))
    restartTimer()
    return clearTimer
  }, [clearTimer, opacity, progress, reduced, restartTimer])

  useEffect(() => {
    if (exitingRef.current) return
    const scale = 1 - index * STACK_SCALE_STEP
    stackScale.set(reduced ? scale : withSpring(scale))
    if (height !== undefined && frontHeight !== undefined) {
      const y = dir * stackOffset(index, height, frontHeight)
      stackY.set(reduced ? y : withSpring(y))
    }
    opacity.set(withTiming(index >= MAX_VISIBLE ? 0 : 1, { duration: FADE_IN_MS }))
  }, [dir, frontHeight, height, index, opacity, reduced, stackScale, stackY])

  const commitSwipeDismiss = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    dismiss('swipe')
  }, [dismiss])

  const pan = useMemo(
    () => Gesture.Pan()
      .enabled(index === 0)
      .onBegin(() => {
        scheduleOnRN(clearTimer)
      })
      .onUpdate((event) => {
        const toward = event.translationY * dir
        dragY.set(dir * (toward >= 0 ? toward : -rubberBand(-toward)))
      })
      .onEnd((event) => {
        if (
          event.translationY * dir > DISMISS_DISTANCE ||
          event.velocityY * dir > DISMISS_VELOCITY
        ) {
          scheduleOnRN(commitSwipeDismiss)
        } else {
          dragY.set(withSpring(0))
          scheduleOnRN(restartTimer)
        }
      })
      .onFinalize((_event, success) => {
        if (!success) scheduleOnRN(restartTimer)
      }),
    [clearTimer, commitSwipeDismiss, dir, dragY, index, restartTimer],
  )

  const animatedStyle = useAnimatedStyle(() => {
    const entranceProgress = progress.get()
    return {
      opacity: opacity.get(),
      transform: [
        {
          translateY:
            (1 - entranceProgress) * ENTER_OFFSET * dir + stackY.get() + dragY.get(),
        },
        {
          scale:
            (HIDDEN_SCALE + (1 - HIDDEN_SCALE) * entranceProgress) * stackScale.get(),
        },
      ],
    }
  })

  const handleAction = () => {
    toast.onActionPress?.()
    dismiss('close')
  }

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        onLayout={(event) => onHeightChange(toast.id, event.nativeEvent.layout.height)}
        style={[
          styles.container,
          toast.position === 'top'
            ? { top: insets.top + 16 }
            : { bottom: insets.bottom + 16 },
          animatedStyle,
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['#8E2F22', '#C5365E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.leadingIcon}>
          <Feather name="check" size={17} color="#781D11" />
        </View>
        <Text numberOfLines={3} style={styles.message}>{toast.message}</Text>
        {toast.actionText ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleAction}
            style={({ pressed }) => [styles.action, pressed && styles.pressed]}
          >
            <Text style={styles.actionText}>{toast.actionText.toUpperCase()}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityLabel="Dismiss notification"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => dismiss('close')}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Feather name="x" size={18} color="rgba(255,255,255,0.72)" />
        </Pressable>
      </Animated.View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 52,
    borderRadius: 15,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#A9334D',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.25)',
    zIndex: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  leadingIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8E9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 19,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  actionText: {
    color: '#F8E9E7',
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  close: {
    width: 44,
    height: 44,
    marginHorizontal: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.62,
  },
})
