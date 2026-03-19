import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { X, Camera } from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import { SCD_MEDICATIONS, SCD_CATEGORIES } from "@/utils/scdDrugs";

const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  dark: "#09332C",
  muted: "#9CA3AF",
  accent: "#A9334D",
  danger: "#DC2626",
  inputBorder: "#E5E7EB",
};

const FREQUENCIES = ["Daily", "Twice daily", "Three times daily", "Weekly", "As needed"];
const TIMES = [
  { label: "Morning", value: "8:00 AM" },
  { label: "Afternoon", value: "12:00 PM" },
  { label: "Evening", value: "6:00 PM" },
  { label: "Night", value: "10:00 PM" },
];

function FieldLabel({ children, optional }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark }}>{children}</Text>
      {optional && (
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginLeft: 6 }}>
          optional
        </Text>
      )}
    </View>
  );
}

function ChipRow({ options, selected, onSelect, getLabel }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const val = typeof opt === "string" ? opt : opt.value;
        const label = getLabel ? getLabel(opt) : opt;
        const active = selected === val;
        return (
          <TouchableOpacity
            key={val}
            onPress={() => onSelect(val)}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: active ? C.accent : C.card,
              borderWidth: 1,
              borderColor: active ? C.accent : C.border,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: active ? "#fff" : C.dark,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { medicationId } = useLocalSearchParams();
  const { medications, addMedication, updateMedication, deleteMedication } = useAppStore();

  const existing = medicationId ? medications.find((m) => m.id === medicationId) : null;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [dosage, setDosage] = useState(existing?.dosage ?? "");
  const [frequency, setFrequency] = useState(existing?.frequency ?? "Daily");
  const [time, setTime] = useState(existing?.time ?? "8:00 AM");
  const [prescribedBy, setPrescribedBy] = useState(existing?.prescribedBy ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [category, setCategory] = useState(existing?.category ?? "Supportive");

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a medication name.");
      return;
    }
    const med = { name: name.trim(), dosage, frequency, time, prescribedBy, notes, category, nextDose: time };
    if (isEditing) {
      updateMedication(medicationId, med);
    } else {
      addMedication(med);
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Medication",
      `Remove ${name} from your medications?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMedication(medicationId);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: C.card,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: C.dark, flex: 1 }}>
          {isEditing ? "Edit Medication" : "Add Medication"}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.6}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={C.dark} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel>Medication Name</FieldLabel>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Hydroxyurea"
              placeholderTextColor={C.muted}
              style={{
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.inputBorder,
                borderRadius: 12,
                padding: 14,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: C.dark,
                marginBottom: 12,
              }}
            />
            {/* Quick-pick SCD drugs */}
            {SCD_CATEGORIES.map((cat) => (
              <View key={cat} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: C.muted, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
                  {cat}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {SCD_MEDICATIONS.filter((d) => d.category === cat).map((drug) => (
                    <TouchableOpacity
                      key={drug.id}
                      onPress={() => { setName(drug.name); setCategory(drug.category); }}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        backgroundColor: name === drug.name ? C.accent : C.card,
                        borderWidth: 1,
                        borderColor: name === drug.name ? C.accent : C.border,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: name === drug.name ? "#fff" : C.dark }}>
                        {drug.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Dosage */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel optional>Dosage</FieldLabel>
            <TextInput
              value={dosage}
              onChangeText={setDosage}
              placeholder="e.g. 500mg"
              placeholderTextColor={C.muted}
              style={{
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.inputBorder,
                borderRadius: 12,
                padding: 14,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: C.dark,
              }}
            />
          </View>

          {/* Frequency */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel>Frequency</FieldLabel>
            <ChipRow options={FREQUENCIES} selected={frequency} onSelect={setFrequency} />
          </View>

          {/* Time */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel>Time</FieldLabel>
            <ChipRow
              options={TIMES}
              selected={time}
              onSelect={setTime}
              getLabel={(opt) => opt.label}
            />
          </View>

          {/* Prescribed by */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel optional>Prescribed By</FieldLabel>
            <TextInput
              value={prescribedBy}
              onChangeText={setPrescribedBy}
              placeholder="e.g. Dr. Smith"
              placeholderTextColor={C.muted}
              style={{
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.inputBorder,
                borderRadius: 12,
                padding: 14,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: C.dark,
              }}
            />
          </View>

          {/* Notes */}
          <View style={{ marginBottom: 24 }}>
            <FieldLabel optional>Notes</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Take with food"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: C.card,
                borderWidth: 1,
                borderColor: C.inputBorder,
                borderRadius: 12,
                padding: 14,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: C.dark,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Scan placeholder */}
          <TouchableOpacity
            onPress={() => Alert.alert("Scan Pill", "Barcode scan and AI pill identification coming soon.")}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: C.border,
              borderStyle: "dashed",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Camera size={18} color={C.muted} />
            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.muted }}>
              Identify with camera · Coming soon
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            backgroundColor: C.bg,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1,
            borderTopColor: C.border,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            style={{
              backgroundColor: C.accent,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: isEditing ? 12 : 0,
            }}
          >
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#fff" }}>
              {isEditing ? "Save Changes" : "Save Medication"}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={{ alignItems: "center", paddingVertical: 8 }}>
              <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.danger }}>
                Delete Medication
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
