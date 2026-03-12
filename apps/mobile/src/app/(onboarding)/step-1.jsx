import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Info } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const SCD_TYPES = [
  { key: 'HbSS', label: 'HbSS (Sickle Cell Anaemia)', desc: 'The most common and typically most severe form. Two copies of the sickle gene.' },
  { key: 'HbSC', label: 'HbSC', desc: 'One sickle gene and one haemoglobin C gene. Usually milder than HbSS.' },
  { key: 'HbSB0', label: 'HbS-β⁰ Thalassaemia', desc: 'One sickle gene and one beta-zero thalassaemia gene. Severity similar to HbSS.' },
  { key: 'HbSB+', label: 'HbS-β⁺ Thalassaemia', desc: 'One sickle gene and one beta-plus thalassaemia gene. Usually milder.' },
  { key: 'HbSD', label: 'HbSD', desc: 'One sickle gene and one haemoglobin D gene.' },
  { key: 'HbSE', label: 'HbSE', desc: 'One sickle gene and one haemoglobin E gene. Generally mild.' },
  { key: 'unsure', label: "I'm not sure", desc: 'You can update this later once you have more information from your doctor.' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function Step1() {
  const { setOnboardingField } = useAppStore();

  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(0);
  const [year, setYear] = useState(1990);
  const [scdType, setScdType] = useState(null);
  const [expandedType, setExpandedType] = useState(null);

  const handleContinue = () => {
    const dob = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setOnboardingField('dob', dob);
    setOnboardingField('scdType', scdType);
    router.push('/(onboarding)/step-2');
  };

  return (
    <OnboardingStep
      step={1}
      title="About you"
      subtitle="Your date of birth and SCD type help us personalise your experience."
      onCta={handleContinue}
      ctaDisabled={!scdType}
    >
      {/* Date of Birth */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Date of birth</Text>
        <View style={styles.pickerRow}>
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Day</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={day}
                onValueChange={setDay}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {DAYS.map((d) => (
                  <Picker.Item key={d} label={String(d)} value={d} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.pickerWrapper, { flex: 2 }]}>
            <Text style={styles.pickerLabel}>Month</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={month}
                onValueChange={setMonth}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {MONTHS.map((m, i) => (
                  <Picker.Item key={m} label={m} value={i} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Year</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={year}
                onValueChange={setYear}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {YEARS.map((y) => (
                  <Picker.Item key={y} label={String(y)} value={y} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* SCD Type */}
      <View style={[styles.section, { marginTop: 24 }]}>
        <Text style={styles.sectionLabel}>SCD type</Text>
        <View style={styles.typeGrid}>
          {SCD_TYPES.map((type) => {
            const isSelected = scdType === type.key;
            const isExpanded = expandedType === type.key;
            return (
              <Pressable
                key={type.key}
                style={({ pressed }) => [
                  styles.typeChip,
                  isSelected && styles.typeChipSelected,
                  pressed && !isSelected && { opacity: 0.7 },
                ]}
                onPress={() => setScdType(type.key)}
                onLongPress={() => setExpandedType(isExpanded ? null : type.key)}
              >
                <View style={styles.typeChipRow}>
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextSelected]}>
                    {type.label}
                  </Text>
                  <Pressable onPress={() => setExpandedType(isExpanded ? null : type.key)} hitSlop={6}>
                    <Info size={14} color={isSelected ? '#FFFFFF' : 'rgba(9,51,44,0.35)'} strokeWidth={2} />
                  </Pressable>
                </View>
                {isExpanded && (
                  <Text style={[styles.typeChipDesc, isSelected && styles.typeChipDescSelected]}>
                    {type.desc}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hintText}>Tap the ⓘ icon on any type to learn more.</Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  section: {},
  sectionLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: 'rgba(9,51,44,0.65)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    marginBottom: 4,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    overflow: 'hidden',
    height: 120,
  },
  picker: {
    color: '#09332C',
    height: 120,
  },
  pickerItem: {
    fontFamily: 'Geist_400Regular',
    fontSize: 15,
    color: '#09332C',
    height: 120,
  },
  typeGrid: {
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    padding: 14,
  },
  typeChipSelected: {
    backgroundColor: '#09332C',
    borderColor: '#09332C',
  },
  typeChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeChipText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 15,
    color: '#09332C',
    flex: 1,
  },
  typeChipTextSelected: {
    color: '#FFFFFF',
  },
  typeChipDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(9,51,44,0.6)',
    lineHeight: 18,
    marginTop: 8,
  },
  typeChipDescSelected: {
    color: 'rgba(248,233,231,0.75)',
  },
  hintText: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    marginTop: 8,
  },
});
