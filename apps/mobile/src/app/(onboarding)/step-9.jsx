import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MotiView } from 'moti';
import { Pill, Plus, Trash2, ChevronDown } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every other day', 'Weekly', 'As needed'];

const emptyMedication = () => ({ name: '', dosage: '', frequency: '' });

export default function Step9() {
  const { setOnboardingField } = useAppStore();
  const [medications, setMedications] = useState([emptyMedication()]);
  const [focusedField, setFocusedField] = useState(null);
  const [openFreqIndex, setOpenFreqIndex] = useState(null);

  const updateMed = (index, field, value) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMed = () => {
    if (medications.length < 3) setMedications((prev) => [...prev, emptyMedication()]);
  };

  const removeMed = (index) => {
    if (medications.length === 1) return;
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSkip = () => router.push('/(onboarding)/complete');

  const handleContinue = () => {
    const validMeds = medications.filter((m) => m.name.trim());
    if (validMeds.length) setOnboardingField('medications', validMeds);
    router.push('/(onboarding)/complete');
  };

  return (
    <OnboardingStep
      step={9}
      title="Current medications"
      subtitle="Add medications you take for sickle cell. You can manage these fully in the Care Hub."
      illustrationIcon={Pill}
      illustrationColor="#781D11"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel={medications.some((m) => m.name.trim()) ? 'Save & Finish' : 'Skip'}
    >
      {medications.map((med, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, stiffness: 80, delay: index * 60 }}
          style={styles.medCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Pill size={16} color="#09332C" strokeWidth={1.8} />
              <Text style={styles.cardLabel}>{index === 0 ? 'Medication' : `Medication ${index + 1}`}</Text>
            </View>
            {index > 0 && (
              <Pressable onPress={() => removeMed(index)} hitSlop={8}>
                <Trash2 size={15} color="#DC2626" strokeWidth={1.8} />
              </Pressable>
            )}
          </View>

          <View style={[styles.inputWrapper, focusedField === `name-${index}` && styles.inputFocused]}>
            <TextInput style={styles.input} placeholder="Drug name (e.g. Hydroxyurea)" placeholderTextColor="rgba(9,51,44,0.35)" value={med.name} onChangeText={(v) => updateMed(index, 'name', v)} onFocus={() => setFocusedField(`name-${index}`)} onBlur={() => setFocusedField(null)} />
          </View>

          <View style={[styles.inputWrapper, focusedField === `dosage-${index}` && styles.inputFocused]}>
            <TextInput style={styles.input} placeholder="Dosage (e.g. 500mg)" placeholderTextColor="rgba(9,51,44,0.35)" value={med.dosage} onChangeText={(v) => updateMed(index, 'dosage', v)} onFocus={() => setFocusedField(`dosage-${index}`)} onBlur={() => setFocusedField(null)} />
          </View>

          <Pressable style={styles.freqSelector} onPress={() => setOpenFreqIndex(openFreqIndex === index ? null : index)}>
            <Text style={[styles.freqText, !med.frequency && styles.freqPlaceholder]}>{med.frequency || 'Frequency'}</Text>
            <ChevronDown size={16} color="rgba(9,51,44,0.4)" strokeWidth={2} style={{ transform: [{ rotate: openFreqIndex === index ? '180deg' : '0deg' }] }} />
          </Pressable>

          {openFreqIndex === index && (
            <MotiView from={{ opacity: 0, translateY: -4 }} animate={{ opacity: 1, translateY: 0 }} style={styles.freqDropdown}>
              {FREQUENCIES.map((freq) => (
                <Pressable key={freq} style={({ pressed }) => [styles.freqOption, med.frequency === freq && styles.freqOptionSelected, pressed && { backgroundColor: 'rgba(9,51,44,0.05)' }]} onPress={() => { updateMed(index, 'frequency', freq); setOpenFreqIndex(null); }}>
                  <Text style={[styles.freqOptionText, med.frequency === freq && styles.freqOptionTextSelected]}>{freq}</Text>
                </Pressable>
              ))}
            </MotiView>
          )}
        </MotiView>
      ))}

      {medications.length < 3 && (
        <Pressable style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]} onPress={addMed}>
          <Plus size={16} color="#09332C" strokeWidth={2} />
          <Text style={styles.addBtnText}>Add another medication</Text>
        </Pressable>
      )}

      <Text style={styles.hint}>Up to 3 medications in onboarding. Add more from the Care Hub after setup.</Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  medCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardLabel: { fontFamily: 'Geist_600SemiBold', fontSize: 13, color: '#09332C' },
  inputWrapper: { backgroundColor: '#F8F4F0', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', paddingHorizontal: 14, paddingVertical: 11 },
  inputFocused: { borderColor: '#A9334D', backgroundColor: 'rgba(169,51,77,0.04)' },
  input: { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#09332C', padding: 0, margin: 0 },
  freqSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F4F0', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', paddingHorizontal: 14, paddingVertical: 11 },
  freqText: { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#09332C' },
  freqPlaceholder: { color: 'rgba(9,51,44,0.35)' },
  freqDropdown: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.1)', overflow: 'hidden', marginTop: -6 },
  freqOption: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(9,51,44,0.06)' },
  freqOptionSelected: { backgroundColor: 'rgba(169,51,77,0.08)' },
  freqOptionText: { fontFamily: 'Geist_400Regular', fontSize: 14, color: '#09332C' },
  freqOptionTextSelected: { fontFamily: 'Geist_600SemiBold', color: '#A9334D' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: 'rgba(9,51,44,0.04)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(9,51,44,0.08)', borderStyle: 'dashed', justifyContent: 'center', marginBottom: 12 },
  addBtnText: { fontFamily: 'Geist_500Medium', fontSize: 14, color: '#09332C' },
  hint: { fontFamily: 'Geist_400Regular', fontSize: 12, color: 'rgba(9,51,44,0.4)', textAlign: 'center' },
});
