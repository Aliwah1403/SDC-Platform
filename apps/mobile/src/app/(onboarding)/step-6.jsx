import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Droplets, X } from "lucide-react-native";
import OnboardingStep from "@/components/OnboardingStep";
import { useAppStore } from "@/store/appStore";

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "I don't know"];

const PRESET_ALLERGIES = [
  "Penicillin",
  "NSAIDs",
  "Aspirin",
  "Latex",
  "Codeine",
  "Sulfa drugs",
];

export default function Step6() {
  const { setOnboardingField, updateCrisisPlan } = useAppStore();

  const [bloodType, setBloodType] = useState(null);
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [customAllergies, setCustomAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState("");

  const togglePreset = (preset) => {
    setSelectedPresets((prev) =>
      prev.includes(preset) ? prev.filter((p) => p !== preset) : [...prev, preset]
    );
  };

  const addCustomAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !customAllergies.includes(trimmed) && !selectedPresets.includes(trimmed)) {
      setCustomAllergies((prev) => [...prev, trimmed]);
    }
    setAllergyInput("");
  };

  const removeCustomAllergy = (item) =>
    setCustomAllergies((prev) => prev.filter((a) => a !== item));

  const handleContinue = () => {
    const allAllergies = [...selectedPresets, ...customAllergies];
    setOnboardingField("bloodType", bloodType);
    setOnboardingField("allergies", allAllergies);
    // Also write to crisisPlan so this data persists after onboardingData is reset
    updateCrisisPlan({ bloodType, allergies: allAllergies });
    router.push("/(onboarding)/step-7");
  };

  const handleSkip = () => {
    router.push("/(onboarding)/step-7");
  };

  return (
    <OnboardingStep
      step={6}
      title="Your medical profile"
      subtitle="This helps your care team act fast in an emergency — especially when you can't speak for yourself."
      illustrationIcon={Droplets}
      illustrationColor="#A9334D"
      onBack={() => router.back()}
      skippable
      onSkip={handleSkip}
      onCta={handleContinue}
      ctaLabel="Save & Next"
    >
      {/* Blood Type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Blood Type</Text>
        <Text style={styles.sectionHint}>
          Knowing your blood type can save critical time in an emergency.
        </Text>
        <View style={styles.chipGrid}>
          {BLOOD_TYPES.map((bt) => {
            const selected = bloodType === bt;
            return (
              <Pressable
                key={bt}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && !selected && { opacity: 0.7 },
                ]}
                onPress={() => setBloodType(bt === bloodType ? null : bt)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {bt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Allergies */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Known Allergies</Text>
        <Text style={styles.sectionHint}>
          Select any medications or substances you're allergic to.
        </Text>

        {/* Preset allergy chips */}
        <View style={styles.allergyChips}>
          {PRESET_ALLERGIES.map((preset) => {
            const selected = selectedPresets.includes(preset);
            return (
              <Pressable
                key={preset}
                style={({ pressed }) => [
                  styles.allergyChip,
                  selected && styles.allergyChipSelected,
                  pressed && !selected && { opacity: 0.7 },
                ]}
                onPress={() => togglePreset(preset)}
              >
                <Text
                  style={[
                    styles.allergyChipText,
                    selected && styles.allergyChipTextSelected,
                  ]}
                >
                  {preset}
                </Text>
                {selected && (
                  <X size={12} color="#FFFFFF" strokeWidth={2.5} style={styles.allergyChipX} />
                )}
              </Pressable>
            );
          })}

          {/* Custom allergy chips */}
          {customAllergies.map((allergy) => (
            <Pressable
              key={allergy}
              style={[styles.allergyChip, styles.allergyChipSelected]}
              onPress={() => removeCustomAllergy(allergy)}
            >
              <Text style={styles.allergyChipTextSelected}>{allergy}</Text>
              <X size={12} color="#FFFFFF" strokeWidth={2.5} style={styles.allergyChipX} />
            </Pressable>
          ))}
        </View>

        {/* Custom allergy input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.allergyInput}
            placeholder="Add another allergy…"
            placeholderTextColor="rgba(9,51,44,0.35)"
            value={allergyInput}
            onChangeText={setAllergyInput}
            onSubmitEditing={addCustomAllergy}
            returnKeyType="done"
            autoCapitalize="words"
          />
          {allergyInput.trim().length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.addBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={addCustomAllergy}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          )}
        </View>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 16,
    color: "#09332C",
  },
  sectionHint: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.55)",
    lineHeight: 19,
    marginBottom: 4,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    backgroundColor: "#FFFFFF",
  },
  chipSelected: {
    backgroundColor: "#A9334D",
    borderColor: "#A9334D",
  },
  chipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#09332C",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontFamily: "Geist_600SemiBold",
  },
  allergyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  allergyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    backgroundColor: "#FFFFFF",
  },
  allergyChipSelected: {
    backgroundColor: "#A9334D",
    borderColor: "#A9334D",
  },
  allergyChipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#09332C",
  },
  allergyChipTextSelected: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#FFFFFF",
  },
  allergyChipX: {
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  allergyInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#09332C",
  },
  addBtn: {
    backgroundColor: "#09332C",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 14,
    color: "#F8E9E7",
  },
});
