import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Picker } from '@react-native-picker/picker';
import { PenLine, Ruler } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const CM_MIN = 100;
const CM_MAX = 250;
const IN_MIN = 36;  // 3'0"
const IN_MAX = 102; // 8'6"

const cmItems = Array.from({ length: CM_MAX - CM_MIN + 1 }, (_, i) => {
  const val = i + CM_MIN;
  return { label: `${val} cm`, value: val };
});

const ftItems = Array.from({ length: 6 }, (_, i) => {
  const val = i + 3; // 3–8 ft
  return { label: `${val}'`, value: val };
});

const inItems = Array.from({ length: 12 }, (_, i) => ({
  label: `${i}"`,
  value: i,
}));

function SegmentedControl({ options, selected, onSelect }) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.segmentBtn, selected === opt && styles.segmentBtnActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.segmentText, selected === opt && styles.segmentTextActive]}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Step3() {
  const { setOnboardingField } = useAppStore();
  const [unit, setUnit] = useState('Metric');
  const [editing, setEditing] = useState(false);
  const [cmValue, setCmValue] = useState(170);
  const [totalInches, setTotalInches] = useState(67); // 5'7"

  const displayValue =
    unit === 'Metric'
      ? `${cmValue} cm`
      : `${Math.floor(totalInches / 12)}' ${totalInches % 12}"`;

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === 'Imperial') {
      setTotalInches(Math.min(IN_MAX, Math.max(IN_MIN, Math.round(cmValue / 2.54))));
    } else {
      setCmValue(Math.min(CM_MAX, Math.max(CM_MIN, Math.round(totalInches * 2.54))));
    }
    setUnit(newUnit);
  };

  const handleSkip = () => router.push('/(onboarding)/step-4');

  const handleContinue = () => {
    const heightInCm =
      unit === 'Metric' ? cmValue : Math.round(totalInches * 2.54);
    setOnboardingField('height', heightInCm);
    router.push('/(onboarding)/step-4');
  };

  return (
    <OnboardingStep
      step={3}
      title="How tall are you?"
      subtitle="Optional — helps personalise your health insights."
      illustrationIcon={Ruler}
      illustrationColor="#781D11"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel="Save & Next"
    >
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 80 }}
        style={styles.content}
      >
        <SegmentedControl
          options={['Metric', 'Imperial']}
          selected={unit}
          onSelect={handleUnitSwitch}
        />

        <Pressable style={styles.valueCard} onPress={() => setEditing((e) => !e)}>
          <Text style={styles.valueText}>{displayValue}</Text>
          {!editing && (
            <View style={styles.tapHintRow}>
              <Text style={styles.tapHintText}>Tap to change</Text>
              <PenLine size={14} color="rgba(9,51,44,0.35)" strokeWidth={1.8} />
            </View>
          )}
        </Pressable>

        {editing && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 100 }}
            style={styles.pickerWrapper}
          >
            {unit === 'Metric' ? (
              <Picker
                selectedValue={cmValue}
                onValueChange={setCmValue}
                style={{ height: 216 }}
                itemStyle={{ fontFamily: 'Geist_500Medium', fontSize: 20, color: '#09332C' }}
              >
                {cmItems.map((item) => (
                  <Picker.Item key={item.value} label={item.label} value={item.value} />
                ))}
              </Picker>
            ) : (
              <View style={styles.imperialRow}>
                <Picker
                  selectedValue={Math.floor(totalInches / 12)}
                  onValueChange={(ft) => setTotalInches(ft * 12 + (totalInches % 12))}
                  style={styles.imperialPicker}
                  itemStyle={{ fontFamily: 'Geist_500Medium', fontSize: 20, color: '#09332C' }}
                >
                  {ftItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
                <Picker
                  selectedValue={totalInches % 12}
                  onValueChange={(inches) => setTotalInches(Math.floor(totalInches / 12) * 12 + inches)}
                  style={styles.imperialPicker}
                  itemStyle={{ fontFamily: 'Geist_500Medium', fontSize: 20, color: '#09332C' }}
                >
                  {inItems.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>
            )}
          </MotiView>
        )}

        <Text style={styles.privacyNote}>
          Your measurements are stored locally and never shared without your permission.
        </Text>
      </MotiView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(9,51,44,0.07)',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: 'rgba(9,51,44,0.5)',
  },
  segmentTextActive: {
    color: '#09332C',
    fontFamily: 'Geist_600SemiBold',
  },
  valueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 36,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    gap: 10,
  },
  valueText: {
    fontFamily: 'Geist_800ExtraBold',
    fontSize: 60,
    color: '#09332C',
    letterSpacing: -2,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapHintText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: 'rgba(9,51,44,0.35)',
  },
  imperialRow: {
    flexDirection: 'row',
  },
  imperialPicker: {
    flex: 1,
    height: 216,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.08)',
    overflow: 'hidden',
  },
  privacyNote: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 4,
  },
});
