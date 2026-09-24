import { useCallback, useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloudOff, NotebookPen, RefreshCw, Users, WifiOff, X } from 'lucide-react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { fonts } from '@/utils/fonts';
import { useTheme } from '@/hooks/useTheme';

const OFFLINE_ICON = '#D9910B';
const HEMO_RED = '#A9334D';
const SYNC_GREEN = '#2E9D57';
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const SHEET_SPRING = {
  duration: 300,
  dampingRatio: 0.8,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
};

function InfoRow({ icon: Icon, iconColor, title, body, theme }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.rowIcon}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={styles.rowCopy}>
        <Text selectable style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        <Text selectable style={[styles.rowBody, { color: theme.textSecondary }]}>{body}</Text>
      </View>
    </View>
  );
}

export default function OfflineStatusSheet({ visible, isOffline, onClose }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(64);
  const sheetOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const finishClose = useCallback(() => onClose?.(), [onClose]);

  const close = useCallback(() => {
    backdropOpacity.set(withTiming(0, {
      duration: 180,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    }));
    sheetOpacity.set(withTiming(0, {
      duration: 180,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    }));
    translateY.set(
      reducedMotion
        ? withTiming(0, { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.System }, (finished) => {
            if (finished) scheduleOnRN(finishClose);
          })
        : withSpring(64, SHEET_SPRING, (finished) => {
            if (finished) scheduleOnRN(finishClose);
          }),
    );
  }, [backdropOpacity, finishClose, reducedMotion, sheetOpacity, translateY]);

  useEffect(() => {
    if (!visible) return;
    translateY.set(reducedMotion ? 0 : 64);
    sheetOpacity.set(0);
    backdropOpacity.set(0);
    backdropOpacity.set(withTiming(1, {
      duration: 180,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    }));
    sheetOpacity.set(withTiming(1, {
      duration: 180,
      easing: EASE_OUT,
      reduceMotion: ReduceMotion.System,
    }));
    translateY.set(
      reducedMotion
        ? withTiming(0, { duration: 180, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
        : withSpring(0, SHEET_SPRING),
    );
  }, [backdropOpacity, reducedMotion, sheetOpacity, translateY, visible]);

  useEffect(() => {
    if (visible && !isOffline) close();
  }, [close, isOffline, visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.get(),
    transform: [{ translateY: translateY.get() }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={StyleSheet.absoluteFill} accessibilityViewIsModal onAccessibilityEscape={close}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: theme.modalBackdrop }, backdropStyle]}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              bottom: Math.max(insets.bottom, 12),
              maxHeight: height - Math.max(insets.top, 12) - Math.max(insets.bottom, 12) - 24,
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            },
            sheetStyle,
          ]}
        >
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.header}>
              <View style={styles.headingRow}>
                <WifiOff size={25} color={OFFLINE_ICON} strokeWidth={2} />
                <Text selectable style={[styles.title, { color: theme.text }]}>You’re offline</Text>
              </View>
              <Pressable
                onPress={close}
                hitSlop={8}
                pressRetentionOffset={16}
                accessibilityRole="button"
                accessibilityLabel="Close offline information"
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.isDark ? theme.surface : '#F2EEEA' },
                  pressed && styles.pressed,
                ]}
              >
                <X size={19} color={theme.textSecondary} strokeWidth={2.25} />
              </Pressable>
            </View>

            <Text selectable style={[styles.subtitle, { color: theme.textSecondary }]}>
              Hemo can’t reach the internet right now, but your available saved data is still here.
            </Text>

            <Text selectable style={[styles.sectionLabel, { color: theme.textTertiary }]}>WHAT STILL WORKS</Text>
            <View style={styles.rows}>
              <InfoRow
                icon={NotebookPen}
                iconColor={HEMO_RED}
                title="Log your health"
                body="Record symptoms, pain, mood and hydration while offline."
                theme={theme}
              />
              <InfoRow
                icon={RefreshCw}
                iconColor={SYNC_GREEN}
                title="Automatic sync"
                body="Anything you log will sync automatically when your connection returns."
                theme={theme}
              />
            </View>

            <Text selectable style={[styles.sectionLabel, styles.limitedLabel, { color: theme.textTertiary }]}>TEMPORARILY LIMITED</Text>
            <View style={styles.rows}>
              <InfoRow
                icon={Users}
                iconColor={HEMO_RED}
                title="Community and live content"
                body="New posts and fresh content need an internet connection."
                theme={theme}
              />
              <InfoRow
                icon={CloudOff}
                iconColor={HEMO_RED}
                title="Cross-device updates"
                body="Your other devices will update after Hemo reconnects."
                theme={theme}
              />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  sheet: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 28,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    boxShadow: '0 16px 42px rgba(0, 0, 0, 0.22)',
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  headingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
    transform: [{ scale: 0.97 }],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  rows: {
    gap: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  rowIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    paddingTop: 1,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 2,
  },
  rowBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  limitedLabel: {
    marginTop: 25,
  },
});
