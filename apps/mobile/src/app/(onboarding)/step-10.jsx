import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Check, Pill } from 'lucide-react-native';
import OnboardingStep from '@/components/OnboardingStep';
import { useAppStore } from '@/store/appStore';
import { SCD_MEDICATIONS, SCD_CATEGORIES as CATEGORIES } from '@/utils/scdDrugs';

export default function Step10() {
  const { setOnboardingField } = useAppStore();
  const [selectedIds, setSelectedIds] = useState(new Set());

  const toggleDrug = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSkip = () => router.push('/(onboarding)/complete');

  const handleContinue = () => {
    const selected = SCD_MEDICATIONS.filter((d) => selectedIds.has(d.id)).map((d) => ({
      name: d.name,
      dosage: '',
      frequency: '',
    }));
    if (selected.length) setOnboardingField('medications', selected);
    router.push('/(onboarding)/complete');
  };

  const selectedCount = selectedIds.size;

  return (
    <OnboardingStep
      step={10}
      title="Current medications"
      subtitle="Select the medications you currently take. You can add dosages and schedules in the Care Hub."
      illustrationIcon={Pill}
      illustrationColor="#781D11"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel={selectedCount > 0 ? 'Save & Finish' : 'Skip'}
    >
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 16, stiffness: 80 }}
        style={styles.container}
      >
        {selectedCount > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, stiffness: 120 }}
            style={styles.badge}
          >
            <Text style={styles.badgeText}>{selectedCount} selected</Text>
          </MotiView>
        )}

        {CATEGORIES.map((category) => {
          const drugs = SCD_MEDICATIONS.filter((d) => d.category === category);
          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionLabel}>{category}</Text>
              <View style={styles.chipGrid}>
                {drugs.map((drug, i) => {
                  const isSelected = selectedIds.has(drug.id);
                  return (
                    <MotiView
                      key={drug.id}
                      from={{ opacity: 0, translateY: 6 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'spring', damping: 16, stiffness: 80, delay: i * 40 }}
                      style={styles.chipWrapper}
                    >
                      <Pressable
                        style={({ pressed }) => [
                          styles.chip,
                          isSelected && styles.chipSelected,
                          pressed && { opacity: 0.75 },
                        ]}
                        onPress={() => toggleDrug(drug.id)}
                      >
                        <View style={styles.chipTop}>
                          {isSelected && (
                            <View style={styles.checkCircle}>
                              <Check size={10} color="#FFFFFF" strokeWidth={2.5} />
                            </View>
                          )}
                          <Text style={[styles.chipName, isSelected && styles.chipNameSelected]} numberOfLines={2}>
                            {drug.name}
                          </Text>
                        </View>
                        {drug.subtitle && (
                          <Text style={[styles.chipSubtitle, isSelected && styles.chipSubtitleSelected]} numberOfLines={1}>
                            {drug.subtitle}
                          </Text>
                        )}
                      </Pressable>
                    </MotiView>
                  );
                })}
              </View>
            </View>
          );
        })}

        <Text style={styles.hint}>
          Dosages and frequency can be configured in the Care Hub after setup.
        </Text>
      </MotiView>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A9334D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: 'rgba(9,51,44,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipWrapper: {
    width: '48%',
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(9,51,44,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 3,
  },
  chipSelected: {
    backgroundColor: '#A9334D',
    borderColor: '#A9334D',
  },
  chipTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  chipName: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#09332C',
    flexShrink: 1,
  },
  chipNameSelected: {
    color: '#FFFFFF',
    fontFamily: 'Geist_600SemiBold',
  },
  chipSubtitle: {
    fontFamily: 'Geist_400Regular',
    fontSize: 11,
    color: 'rgba(9,51,44,0.45)',
  },
  chipSubtitleSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  hint: {
    fontFamily: 'Geist_400Regular',
    fontSize: 12,
    color: 'rgba(9,51,44,0.4)',
    textAlign: 'center',
    lineHeight: 17,
  },
});
