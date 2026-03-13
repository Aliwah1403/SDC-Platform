import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Info } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const SCD_TYPES = [
  { key: 'HbSS', label: 'HbSS (Sickle Cell Anaemia)', desc: 'The most common form. Two copies of the sickle gene — typically the most severe.' },
  { key: 'HbSC', label: 'HbSC', desc: 'One sickle gene + one haemoglobin C gene. Usually milder than HbSS.' },
  { key: 'HbSB0', label: 'HbS-β⁰ Thalassaemia', desc: 'Severity similar to HbSS. One sickle gene + beta-zero thalassaemia gene.' },
  { key: 'HbSB+', label: 'HbS-β⁺ Thalassaemia', desc: 'Usually milder. One sickle gene + beta-plus thalassaemia gene.' },
  { key: 'HbSD', label: 'HbSD', desc: 'One sickle gene and one haemoglobin D gene.' },
  { key: 'HbSE', label: 'HbSE', desc: 'Generally mild. One sickle gene and one haemoglobin E gene.' },
  { key: 'unsure', label: "I'm not sure", desc: 'No problem — you can update this later after speaking with your doctor.' },
];

export default function Step3() {
  const { setOnboardingField } = useAppStore();
  const [scdType, setScdType] = useState(null);
  const [expandedType, setExpandedType] = useState(null);

  const handleNext = () => {
    setOnboardingField('scdType', scdType);
    router.push('/(onboarding)/step-4');
  };

  return (
    <OnboardingStep
      step={3}
      title="Which type of sickle cell do you have?"
      subtitle="This helps us tailor your health tracking and insights."
      illustrationIcon={Heart}
      illustrationColor="#F0531C"
      onBack={() => router.back()}
      onCta={handleNext}
      ctaDisabled={!scdType}
    >
      <View style={styles.typeList}>
        {SCD_TYPES.map((type) => {
          const isSelected = scdType === type.key;
          const isExpanded = expandedType === type.key;
          return (
            <Pressable
              key={type.key}
              style={({ pressed }) => [
                styles.typeRow,
                isSelected && styles.typeRowSelected,
                pressed && !isSelected && { opacity: 0.75 },
              ]}
              onPress={() => setScdType(type.key)}
            >
              <View style={styles.typeRowInner}>
                {/* Radio dot */}
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.typeLabel, isSelected && styles.typeLabelSelected]}>
                  {type.label}
                </Text>
                <Pressable
                  onPress={() => setExpandedType(isExpanded ? null : type.key)}
                  hitSlop={8}
                >
                  <Info
                    size={15}
                    color={isSelected ? '#F0531C' : 'rgba(9,51,44,0.3)'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
              {isExpanded && (
                <Text style={[styles.typeDesc, isSelected && styles.typeDescSelected]}>
                  {type.desc}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Tap ⓘ on any type to learn more.</Text>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  typeList: {
    gap: 8,
    marginBottom: 12,
  },
  typeRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    padding: 14,
    gap: 8,
  },
  typeRowSelected: {
    borderColor: '#F0531C',
    backgroundColor: 'rgba(240,83,28,0.04)',
  },
  typeRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(9,51,44,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#F0531C',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0531C',
  },
  typeLabel: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#09332C',
    flex: 1,
  },
  typeLabelSelected: {
    color: '#09332C',
    fontFamily: 'Geist_600SemiBold',
  },
  typeDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: 'rgba(9,51,44,0.55)',
    lineHeight: 18,
    paddingLeft: 32,
  },
  typeDescSelected: {
    color: 'rgba(9,51,44,0.65)',
  },
  hint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    textAlign: 'center',
  },
});
