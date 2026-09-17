import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WifiOff } from 'lucide-react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAuthStore } from '@/utils/auth/store';
import { retryAllFailedHealthLogs } from '@/services/local/healthLogSync';
import { useHealthLogSyncStatus } from '@/hooks/useHealthLogSync';
import OfflineStatusSheet from '@/components/OfflineStatusSheet';

const AMBER_INK = '#9A5C0A';

export function deriveHealthLogBannerState({ isOffline, pending = 0, failed = 0 }) {
  if (isOffline) {
    return {
      text: 'Offline',
      kind: 'offline',
      action: null,
    };
  }
  if (failed > 0) {
    return {
      text: `${failed} health log${failed === 1 ? ' needs' : 's need'} attention`,
      kind: 'failed',
      action: 'retry',
    };
  }
  if (pending > 0) {
    return {
      text: `${pending} health log${pending === 1 ? '' : 's'} waiting to sync`,
      kind: 'pending',
      action: null,
    };
  }
  return null;
}

/** A compact, non-blocking indicator for connectivity and queued health logs. */
export default function OfflineBanner() {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const { isOffline } = useNetworkStatus();
  const { pending, failed } = useHealthLogSyncStatus();
  const userId = useAuthStore((state) => state.auth?.user?.id);
  const insets = useSafeAreaInsets();
  const banner = deriveHealthLogBannerState({ isOffline, pending, failed });
  if (!banner && !detailsVisible) return null;

  const retry = banner?.action === 'retry';
  const showOfflineDetails = banner?.kind === 'offline';
  const interactive = showOfflineDetails || retry;
  const content = (
    <>
      {showOfflineDetails ? (
        <WifiOff color={AMBER_INK} size={18} strokeWidth={2} />
      ) : null}
      <Text style={styles.text}>{banner?.text}{retry ? ' — Tap to retry' : ''}</Text>
    </>
  );

  return (
    <>
      {banner ? (
        <View
          pointerEvents="box-none"
          style={[styles.positioner, { bottom: insets.bottom + 74 }]}
        >
          {interactive ? (
            <Pressable
              onPress={() => {
                if (showOfflineDetails) setDetailsVisible(true);
                else retryAllFailedHealthLogs(userId).catch(() => {});
              }}
              style={({ pressed }) => [styles.badge, pressed && styles.badgePressed]}
              accessibilityRole="button"
              accessibilityLabel={showOfflineDetails ? 'Offline. Show offline information.' : `${banner.text}. Tap to retry.`}
              hitSlop={8}
              pressRetentionOffset={16}
            >
              {content}
            </Pressable>
          ) : (
            <View pointerEvents="none" style={styles.badge} accessibilityRole="alert">
              {content}
            </View>
          )}
        </View>
      ) : null}
      <OfflineStatusSheet
        visible={detailsVisible}
        isOffline={isOffline}
        onClose={() => setDetailsVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  positioner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  badge: {
    maxWidth: '92%',
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F6DEAD',
    backgroundColor: '#FFF6DF',
    boxShadow: '0 4px 12px rgba(154, 92, 10, 0.12)',
  },
  badgePressed: {
    opacity: 0.82,
  },
  text: {
    color: AMBER_INK,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
