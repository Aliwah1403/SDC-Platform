import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { ArrowLeft, Bell, Clock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingStep, { TOTAL_STEPS } from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

function PhoneMockup({ name }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.94, translateY: 12 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 80 }}
      style={styles.phoneMockup}
    >
      {/* Status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusTime}>9:41</Text>
        <View style={styles.statusIcons}>
          {[4, 6, 8, 10].map((h, i) => (
            <View key={i} style={[styles.signalBar, { height: h }]} />
          ))}
          <View style={styles.battery}>
            <View style={styles.batteryFill} />
          </View>
        </View>
      </View>

      {/* Notification card */}
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 220 }}
        style={styles.mockNotifCard}
      >
        <View style={styles.mockNotifAppIcon}>
          <Bell size={13} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.mockNotifTopRow}>
            <Text style={styles.mockNotifApp}>Hemo</Text>
            <Text style={styles.mockNotifTime}>now</Text>
          </View>
          <Text style={styles.mockNotifTitle}>Daily check-in</Text>
          <Text style={styles.mockNotifBody} numberOfLines={1}>
            {`How are you feeling today${name !== 'you' ? `, ${name}` : ''}?`}
          </Text>
        </View>
      </MotiView>

      {/* App icon placeholders */}
      <View style={styles.appGrid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.appRow}>
            {[0, 1, 2, 3].map((col) => (
              <View
                key={col}
                style={[styles.appIcon, { opacity: row === 1 ? 0.45 : 0.75 }]}
              />
            ))}
          </View>
        ))}
        <View style={styles.appRow}>
          {[0, 1, 2, 3].map((col) => (
            <View key={col} style={[styles.appIcon, { opacity: 0.22, borderRadius: 22 }]} />
          ))}
        </View>
      </View>
    </MotiView>
  );
}

export default function Step5() {
  const { setOnboardingField, onboardingData } = useAppStore();
  const insets = useSafeAreaInsets();
  const name = onboardingData.nickname || 'you';

  const [phase, setPhase] = useState('gate');
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setPhase('timepicker');
      } else {
        setOnboardingField('notificationsEnabled', false);
        router.push('/(onboarding)/step-6');
      }
    } catch {
      setOnboardingField('notificationsEnabled', false);
      router.push('/(onboarding)/step-6');
    }
  };

  const handleSkip = () => {
    setOnboardingField('notificationsEnabled', false);
    router.push('/(onboarding)/step-6');
  };

  const handleSaveTime = () => {
    const checkInTime = `${String(hour).padStart(2, '0')}:${minute} ${period}`;
    setOnboardingField('checkInTime', checkInTime);
    setOnboardingField('notificationsEnabled', true);
    router.push('/(onboarding)/step-6');
  };

  if (phase === 'timepicker') {
    return (
      <OnboardingStep
        step={5}
        title="Set your daily reminder"
        subtitle="When should Hemo check in with you?"
        illustrationIcon={Clock}
        illustrationColor="#A9334D"
        onBack={() => setPhase('gate')}
        onCta={handleSaveTime}
        ctaLabel="Save & Next"
      >
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Clock size={18} color="#09332C" strokeWidth={1.8} />
            <Text style={styles.cardTitle}>Reminder time</Text>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeGroup}>
              <Text style={styles.timeLabel}>Hour</Text>
              <View style={styles.timeChips}>
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.timeChip, hour === h && styles.timeChipActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.timeChipText, hour === h && styles.timeChipTextActive]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.timeGroup}>
              <Text style={styles.timeLabel}>Minute</Text>
              <View style={styles.timeChips}>
                {MINUTES.map((m) => (
                  <Pressable
                    key={m}
                    style={[styles.timeChip, minute === m && styles.timeChipActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.timeChipText, minute === m && styles.timeChipTextActive]}>
                      :{m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.timeGroup}>
              <Text style={styles.timeLabel}>Period</Text>
              <View style={styles.timeChips}>
                {PERIODS.map((p) => (
                  <Pressable
                    key={p}
                    style={[styles.timeChip, period === p && styles.timeChipActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[styles.timeChipText, period === p && styles.timeChipTextActive]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.previewBadge}>
            <Text style={styles.previewText}>
              Reminder set for{' '}
              <Text style={styles.previewTime}>
                {String(hour).padStart(2, '0')}:{minute} {period}
              </Text>
            </Text>
          </View>
        </View>
      </OnboardingStep>
    );
  }

  // Gate phase — custom full-screen layout to match reference design
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backCircle, pressed && { opacity: 0.6 }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#09332C" strokeWidth={2} />
        </Pressable>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === 4 ? styles.dotCurrent : i < 4 ? styles.dotPast : styles.dotFuture,
              ]}
            />
          ))}
        </View>
        <Pressable onPress={handleSkip} hitSlop={10} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Middle: phone + heading, vertically centered */}
      <View style={styles.middle}>
        <PhoneMockup name={name} />

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 320 }}
          style={styles.headingBlock}
        >
          <Text style={styles.title}>Never miss a moment</Text>
          <Text style={styles.subtitle}>
            Daily reminders, streak alerts, and health nudges — all in one place.
          </Text>
        </MotiView>
      </View>

      {/* Bottom: full-width CTA + skip link */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 420 }}
        style={[styles.bottomArea, { paddingBottom: insets.bottom + 28 }]}
      >
        <Pressable
          style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRequestPermission}
        >
          <Text style={styles.ctaBtnText}>Turn on Notifications</Text>
        </Pressable>
        <Pressable onPress={handleSkip} hitSlop={12}>
          <Text style={styles.notNowText}>Not right now</Text>
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Gate phase layout ──────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: '#F8F4F0',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 52,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(9,51,44,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  dotCurrent: { width: 22, backgroundColor: '#A9334D' },
  dotPast: { width: 6, backgroundColor: '#A9334D', opacity: 0.4 },
  dotFuture: { width: 6, backgroundColor: 'rgba(9,51,44,0.14)' },
  skipBtn: { width: 44, alignItems: 'flex-end' },
  skipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: 'rgba(9,51,44,0.4)',
  },
  middle: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 36,
  },
  headingBlock: {
    gap: 10,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Geist_700Bold',
    fontSize: 30,
    color: '#09332C',
    letterSpacing: -0.9,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: 'rgba(9,51,44,0.55)',
    lineHeight: 22,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 14,
    alignItems: 'center',
  },
  ctaBtn: {
    width: '100%',
    backgroundColor: '#A9334D',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  notNowText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: 'rgba(9,51,44,0.4)',
  },

  // ── Phone mockup ───────────────────────────────────────────────
  phoneMockup: {
    alignSelf: 'center',
    width: '100%',
    backgroundColor: 'rgba(9,51,44,0.035)',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.07)',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  statusTime: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: 'rgba(9,51,44,0.55)',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  signalBar: {
    width: 3,
    backgroundColor: 'rgba(9,51,44,0.45)',
    borderRadius: 1,
  },
  battery: {
    width: 20,
    height: 10,
    borderRadius: 2.5,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginLeft: 4,
  },
  batteryFill: {
    height: 5,
    width: '75%',
    backgroundColor: 'rgba(9,51,44,0.4)',
    borderRadius: 1,
  },
  mockNotifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  mockNotifAppIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#A9334D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockNotifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  mockNotifApp: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 11,
    color: 'rgba(9,51,44,0.45)',
  },
  mockNotifTime: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: 'rgba(9,51,44,0.3)',
  },
  mockNotifTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: '#09332C',
  },
  mockNotifBody: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    marginTop: 1,
  },
  appGrid: {
    gap: 8,
    paddingTop: 4,
  },
  appRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  appIcon: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(9,51,44,0.07)',
  },

  // ── Time picker phase ──────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    gap: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 15,
    color: '#09332C',
  },
  timeRow: { gap: 12 },
  timeGroup: { gap: 6 },
  timeLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    letterSpacing: 0.3,
  },
  timeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8F4F0',
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
  },
  timeChipActive: {
    backgroundColor: '#A9334D',
    borderColor: '#A9334D',
  },
  timeChipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#09332C',
  },
  timeChipTextActive: { color: '#FFFFFF' },
  previewBadge: {
    backgroundColor: 'rgba(9,51,44,0.06)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  previewText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(9,51,44,0.6)',
  },
  previewTime: {
    fontFamily: 'Geist_600SemiBold',
    color: '#09332C',
  },
});
