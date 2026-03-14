import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { CheckCircle2, HelpCircle } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_SIZE = (SCREEN_WIDTH - 48 - 20) / 3;

const SCD_TYPES = [
  {
    key: 'HbSS',
    label: 'HbSS',
    subtitle: 'Sickle Cell Anaemia',
    desc: 'The most common and often most severe kind. People inherit two sickle cell genes ("S"), one from each parent. They typically experience more frequent and severe pain crises.',
  },
  {
    key: 'HbSC',
    label: 'HbSC',
    subtitle: 'Sickle-Haemoglobin C',
    desc: 'One sickle gene and one haemoglobin C gene. Usually milder than HbSS, but can still cause complications like eye problems and avascular necrosis.',
  },
  {
    key: 'HbSB0',
    label: 'HbS-β⁰',
    subtitle: 'Sickle-Beta Zero Thalassaemia',
    desc: 'One sickle gene and a beta-zero thalassaemia gene. Severity is similar to HbSS with frequent pain crises and anaemia.',
  },
  {
    key: 'HbSB+',
    label: 'HbS-β⁺',
    subtitle: 'Sickle-Beta Plus Thalassaemia',
    desc: 'One sickle gene and a beta-plus thalassaemia gene. Generally milder than HbSS with less frequent complications.',
  },
  {
    key: 'HbSD',
    label: 'HbSD',
    subtitle: 'Sickle-Haemoglobin D',
    desc: 'One sickle gene and one haemoglobin D gene. Severity varies — moderate episodes are common but often less intense than HbSS.',
  },
  {
    key: 'HbSE',
    label: 'HbSE',
    subtitle: 'Sickle-Haemoglobin E',
    desc: 'One sickle gene and one haemoglobin E gene. Generally the mildest form, often with minimal day-to-day symptoms.',
  },
];

export default function Step3() {
  const { setOnboardingField } = useAppStore();
  const [scdType, setScdType] = useState(null);

  const selected = SCD_TYPES.find((t) => t.key === scdType) ?? null;
  const isUnsure = scdType === 'unsure';

  const handleNext = () => {
    setOnboardingField('scdType', scdType);
    router.push('/(onboarding)/step-4');
  };

  return (
    <OnboardingStep
      step={3}
      title="What type of sickle cell do you have?"
      subtitle="Tap a type to learn more. Choose the one that matches your diagnosis."
      illustrationColor="#A9334D"
      onBack={() => router.back()}
      onCta={handleNext}
      ctaDisabled={!scdType}
    >
      {/* 3×2 type grid */}
      <View style={styles.grid}>
        {SCD_TYPES.map((type) => {
          const isSelected = scdType === type.key;
          return (
            <Pressable
              key={type.key}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && !isSelected && { opacity: 0.7 },
              ]}
              onPress={() => setScdType(isSelected ? null : type.key)}
            >
              <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* "I'm not sure" option */}
      <Pressable
        style={({ pressed }) => [styles.unsureRow, pressed && { opacity: 0.7 }]}
        onPress={() => setScdType(isUnsure ? null : 'unsure')}
      >
        {isUnsure
          ? <CheckCircle2 size={16} color="#A9334D" strokeWidth={2} />
          : <HelpCircle size={16} color="rgba(9,51,44,0.35)" strokeWidth={1.8} />
        }
        <Text style={[styles.unsureText, isUnsure && styles.unsureTextSelected]}>
          I'm not sure
        </Text>
      </Pressable>

      {/* Inline description — blends with background */}
      {(selected || isUnsure) && (
        <MotiView
          key={scdType}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 90 }}
          style={styles.descSection}
        >
          <View style={styles.descDivider} />
          <Text style={styles.descType}>
            {isUnsure ? 'No problem' : selected.label}
          </Text>
          <Text style={styles.descSubtitle}>
            {isUnsure ? 'You can update this later' : selected.subtitle}
          </Text>
          <Text style={styles.descBody}>
            {isUnsure
              ? 'Your type is usually on your diagnosis letter or medical records. Ask your haematologist or GP, or update it later in your profile.'
              : selected.desc
            }
          </Text>
        </MotiView>
      )}
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE * 0.72,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    backgroundColor: '#A9334D',
    borderColor: '#A9334D',
  },
  cardLabel: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: '#09332C',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: '#FFFFFF',
  },
  unsureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 14,
    marginBottom: 4,
  },
  unsureText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: 'rgba(9,51,44,0.4)',
  },
  unsureTextSelected: {
    color: '#A9334D',
    fontFamily: 'Geist_600SemiBold',
  },
  descSection: {
    paddingTop: 40,
    gap: 6,
  },
  descDivider: {
    height: 1,
    backgroundColor: 'rgba(9,51,44,0.08)',
    marginBottom: 10,
  },
  descType: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: '#09332C',
    letterSpacing: -0.4,
  },
  descSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: 'rgba(9,51,44,0.45)',
    marginBottom: 4,
  },
  descBody: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: 'rgba(9,51,44,0.6)',
    lineHeight: 21,
  },
});
