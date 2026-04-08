import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Picker } from '@react-native-picker/picker';
import { PenLine, Weight } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const KG_MIN = 20;
const KG_MAX = 250;
const LB_MIN = 44;
const LB_MAX = 551;

const kgItems = Array.from({ length: KG_MAX - KG_MIN + 1 }, (_, i) => {
  const val = i + KG_MIN;
  return { label: `${val} kg`, value: val };
});

const lbItems = Array.from({ length: LB_MAX - LB_MIN + 1 }, (_, i) => {
  const val = i + LB_MIN;
  return { label: `${val} lb`, value: val };
});

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

export default function Step4() {
  const { setOnboardingField } = useAppStore();
  const [unit, setUnit] = useState('Metric');
  const [editing, setEditing] = useState(false);
  const [kgValue, setKgValue] = useState(70);
  const [lbValue, setLbValue] = useState(154);

  const displayValue = unit === 'Metric' ? `${kgValue} kg` : `${lbValue} lb`;

  const handleUnitSwitch = (newUnit) => {
    if (newUnit === 'Imperial') {
      setLbValue(Math.min(LB_MAX, Math.max(LB_MIN, Math.round(kgValue * 2.20462))));
    } else {
      setKgValue(Math.min(KG_MAX, Math.max(KG_MIN, Math.round(lbValue / 2.20462))));
    }
    setUnit(newUnit);
  };

  const handleSkip = () => router.push('/(onboarding)/step-5');

  const handleContinue = () => {
    const weightInKg =
      unit === 'Metric' ? kgValue : Math.round((lbValue / 2.20462) * 10) / 10;
    setOnboardingField('weight', weightInKg);
    router.push('/(onboarding)/step-5');
  };

  return (
    <OnboardingStep
      step={4}
      title="What's your weight?"
      subtitle="Optional — helps personalise your health insights."
      illustrationIcon={Weight}
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
            <Picker
              selectedValue={unit === 'Metric' ? kgValue : lbValue}
              onValueChange={(val) =>
                unit === 'Metric' ? setKgValue(val) : setLbValue(val)
              }
              style={{ height: 216 }}
              itemStyle={{ fontFamily: 'Geist_500Medium', fontSize: 20, color: '#09332C' }}
            >
              {(unit === 'Metric' ? kgItems : lbItems).map((item) => (
                <Picker.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Picker>
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
