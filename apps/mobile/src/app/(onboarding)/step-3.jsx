import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { Ruler } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

function UnitToggle({ options, selected, onSelect }) {
  return (
    <View style={styles.unitToggle}>
      {options.map((opt) => (
        <Pressable key={opt} style={[styles.unitBtn, selected === opt && styles.unitBtnActive]} onPress={() => onSelect(opt)}>
          <Text style={[styles.unitBtnText, selected === opt && styles.unitBtnTextActive]}>{opt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Step3() {
  const { setOnboardingField } = useAppStore();
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSkip = () => router.push('/(onboarding)/step-4');

  const handleContinue = () => {
    let heightInCm = null;
    if (heightUnit === 'cm' && heightCm) {
      heightInCm = parseFloat(heightCm);
    } else if (heightUnit === 'ft' && (heightFt || heightIn)) {
      heightInCm = Math.round((parseFloat(heightFt) || 0) * 30.48 + (parseFloat(heightIn) || 0) * 2.54);
    }
    if (heightInCm !== null) setOnboardingField('height', heightInCm);
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
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconRow}>
            <Ruler size={18} color="#09332C" strokeWidth={1.8} />
            <Text style={styles.cardTitle}>Height</Text>
          </View>
          <UnitToggle options={['cm', 'ft']} selected={heightUnit} onSelect={setHeightUnit} />
        </View>
        {heightUnit === 'cm' ? (
          <View style={[styles.inputWrapper, focusedField === 'height-cm' && styles.inputFocused]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. 170"
              placeholderTextColor="rgba(9,51,44,0.35)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              onFocus={() => setFocusedField('height-cm')}
              onBlur={() => setFocusedField(null)}
            />
            <Text style={styles.unitLabel}>cm</Text>
          </View>
        ) : (
          <View style={styles.ftRow}>
            <View style={[styles.inputWrapper, { flex: 1 }, focusedField === 'height-ft' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="5"
                placeholderTextColor="rgba(9,51,44,0.35)"
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="numeric"
                onFocus={() => setFocusedField('height-ft')}
                onBlur={() => setFocusedField(null)}
              />
              <Text style={styles.unitLabel}>ft</Text>
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }, focusedField === 'height-in' && styles.inputFocused]}>
              <TextInput
                style={styles.input}
                placeholder="8"
                placeholderTextColor="rgba(9,51,44,0.35)"
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="numeric"
                onFocus={() => setFocusedField('height-in')}
                onBlur={() => setFocusedField(null)}
              />
              <Text style={styles.unitLabel}>in</Text>
            </View>
          </View>
        )}
      </MotiView>
      <Text style={styles.privacyNote}>Your measurements are stored locally and never shared without your permission.</Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Geist_600SemiBold', fontSize: 15, color: '#09332C' },
  unitToggle: { flexDirection: 'row', backgroundColor: '#F8F4F0', borderRadius: 8, padding: 2 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  unitBtnActive: { backgroundColor: '#A9334D' },
  unitBtnText: { fontFamily: 'Geist_500Medium', fontSize: 13, color: 'rgba(9,51,44,0.55)' },
  unitBtnTextActive: { color: '#FFFFFF' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F4F0', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  inputFocused: { borderColor: '#A9334D', backgroundColor: 'rgba(169,51,77,0.04)' },
  input: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 16, color: '#09332C', padding: 0, margin: 0 },
  unitLabel: { fontFamily: 'Geist_500Medium', fontSize: 14, color: 'rgba(9,51,44,0.4)' },
  ftRow: { flexDirection: 'row', gap: 8 },
  privacyNote: { fontFamily: 'Geist_400Regular', fontSize: 12, color: 'rgba(9,51,44,0.4)', textAlign: 'center', lineHeight: 17 },
});
