import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { Weight } from 'lucide-react-native';
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

export default function Step4() {
  const { setOnboardingField } = useAppStore();
  const [weightUnit, setWeightUnit] = useState('kg');
  const [weight, setWeight] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  const handleSkip = () => router.push('/(onboarding)/step-5');

  const handleContinue = () => {
    if (weight) {
      const w = parseFloat(weight);
      const weightInKg = weightUnit === 'lb' ? Math.round(w * 0.453592 * 10) / 10 : w;
      setOnboardingField('weight', weightInKg);
    }
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
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconRow}>
            <Weight size={18} color="#09332C" strokeWidth={1.8} />
            <Text style={styles.cardTitle}>Weight</Text>
          </View>
          <UnitToggle options={['kg', 'lb']} selected={weightUnit} onSelect={setWeightUnit} />
        </View>
        <View style={[styles.inputWrapper, focusedField === 'weight' && styles.inputFocused]}>
          <TextInput
            style={styles.input}
            placeholder={weightUnit === 'kg' ? 'e.g. 65' : 'e.g. 143'}
            placeholderTextColor="rgba(9,51,44,0.35)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            onFocus={() => setFocusedField('weight')}
            onBlur={() => setFocusedField(null)}
          />
          <Text style={styles.unitLabel}>{weightUnit}</Text>
        </View>
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
  privacyNote: { fontFamily: 'Geist_400Regular', fontSize: 12, color: 'rgba(9,51,44,0.4)', textAlign: 'center', lineHeight: 17 },
});
