import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Building2, MapPin, Search } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const MOCK_SUGGESTIONS = [
  'University College Hospital, London',
  "King's College Hospital, London",
  "Guy's and St Thomas' NHS Foundation Trust",
  "Birmingham Children's Hospital",
  "Royal Manchester Children's Hospital",
  "Bristol Royal Hospital for Children",
  "Sheffield Children's NHS Foundation Trust",
  'Leeds General Infirmary',
];

export default function Step8() {
  const { setOnboardingField } = useAppStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [focused, setFocused] = useState(false);

  const suggestions = query.length > 1
    ? MOCK_SUGGESTIONS.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (hospital) => {
    setSelected(hospital);
    setQuery(hospital);
    setFocused(false);
  };

  const handleSkip = () => router.push('/(onboarding)/step-9');

  const handleContinue = () => {
    if (selected || query.trim()) setOnboardingField('preferredHospital', selected || query.trim());
    router.push('/(onboarding)/step-9');
  };

  return (
    <OnboardingStep
      step={8}
      title="Your hospital"
      subtitle="Set your preferred hospital or specialist centre for quick access in the app."
      illustrationIcon={Building2}
      illustrationColor="#A9334D"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel={selected || query.trim() ? 'Save & Next' : 'Skip'}
    >
      <View style={[styles.inputWrapper, focused && styles.inputFocused]}>
        <Search size={18} color={focused ? '#A9334D' : 'rgba(9,51,44,0.35)'} strokeWidth={1.8} />
        <TextInput
          style={styles.input}
          placeholder="Search hospital or clinic name"
          placeholderTextColor="rgba(9,51,44,0.35)"
          value={query}
          onChangeText={(v) => { setQuery(v); setSelected(''); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCorrect={false}
        />
      </View>

      {suggestions.length > 0 && focused && (
        <View style={styles.suggestions}>
          {suggestions.map((s) => (
            <Pressable key={s} style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: 'rgba(9,51,44,0.06)' }]} onPress={() => handleSelect(s)}>
              <MapPin size={14} color="rgba(9,51,44,0.4)" strokeWidth={1.8} />
              <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {selected ? (
        <View style={styles.selectedCard}>
          <Building2 size={20} color="#A9334D" strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selectedLabel}>Preferred hospital set</Text>
            <Text style={styles.selectedName}>{selected}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>Can't find your hospital? Type the full name and tap "Save & Next" — you can search from a map later in the Care Hub.</Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.1)', paddingHorizontal: 16, paddingVertical: 14, gap: 12, marginBottom: 12 },
  inputFocused: { borderColor: '#A9334D', backgroundColor: 'rgba(169,51,77,0.04)' },
  input: { flex: 1, fontFamily: 'Geist_400Regular', fontSize: 15, color: '#09332C', padding: 0, margin: 0 },
  suggestions: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.1)', overflow: 'hidden', marginBottom: 12 },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(9,51,44,0.06)' },
  suggestionText: { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#09332C', flex: 1 },
  selectedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(169,51,77,0.06)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(169,51,77,0.18)', padding: 14, marginBottom: 12 },
  selectedLabel: { fontFamily: 'Geist_500Medium', fontSize: 12, color: '#A9334D', marginBottom: 2 },
  selectedName: { fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#09332C', lineHeight: 18 },
  infoCard: { backgroundColor: 'rgba(9,51,44,0.04)', borderRadius: 10, padding: 14 },
  infoText: { fontFamily: 'Geist_400Regular', fontSize: 13, color: 'rgba(9,51,44,0.55)', lineHeight: 18 },
});
