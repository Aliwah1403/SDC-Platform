import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Bell, BellOff, Clock } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function Step5() {
  const { setOnboardingField } = useAppStore();

  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('PM');
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifStatus, setNotifStatus] = useState('idle');

  const toggleNotifications = async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      setNotifStatus('idle');
      return;
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotifEnabled(true);
        setNotifStatus('granted');
      } else {
        setNotifStatus('denied');
      }
    } catch {
      setNotifStatus('denied');
    }
  };

  const handleContinue = () => {
    const checkInTime = `${String(hour).padStart(2, '0')}:${minute} ${period}`;
    setOnboardingField('checkInTime', checkInTime);
    setOnboardingField('notificationsEnabled', notifEnabled);
    router.push('/(onboarding)/step-6');
  };

  return (
    <OnboardingStep
      step={5}
      title="Daily check-in"
      subtitle="Set a reminder so you never miss logging your health."
      illustrationIcon={Clock}
      illustrationColor="#A9334D"
      onBack={() => router.back()}
      onCta={handleContinue}
    >
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Clock size={18} color="#09332C" strokeWidth={1.8} />
          <Text style={styles.cardTitle}>Reminder time</Text>
        </View>
        <Text style={styles.cardSubtitle}>When should we remind you to log your health today?</Text>

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
            Reminder set for <Text style={styles.previewTime}>{String(hour).padStart(2, '0')}:{minute} {period}</Text>
          </Text>
        </View>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 80, delay: 100 }}
        style={styles.card}
      >
        <View style={styles.notifRow}>
          <View style={[styles.notifIcon, notifEnabled && styles.notifIconEnabled]}>
            {notifEnabled
              ? <Bell size={20} color="#09332C" strokeWidth={1.8} />
              : <BellOff size={20} color="rgba(9,51,44,0.4)" strokeWidth={1.8} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Enable notifications</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              Get daily reminders, streak alerts, and medication prompts.
            </Text>
          </View>
          <Pressable
            style={[styles.toggle, notifEnabled && styles.toggleEnabled]}
            onPress={toggleNotifications}
          >
            <MotiView
              animate={{ translateX: notifEnabled ? 20 : 2 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120 }}
              style={styles.toggleThumb}
            />
          </Pressable>
        </View>

        {notifStatus === 'denied' && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Text style={styles.deniedText}>
              Notifications were denied. You can enable them later in Settings.
            </Text>
          </MotiView>
        )}
      </MotiView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
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
  cardSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(9,51,44,0.5)',
    lineHeight: 18,
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
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(9,51,44,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconEnabled: {
    backgroundColor: 'rgba(9,51,44,0.1)',
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(9,51,44,0.15)',
    justifyContent: 'center',
  },
  toggleEnabled: { backgroundColor: '#A9334D' },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  deniedText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 17,
  },
});
