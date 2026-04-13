import React, { useRef, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  ChevronLeft,
  Edit3,
  Phone,
  ChevronDown,
  ShieldAlert,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useUpdateProfileMutation } from "@/hooks/queries/useProfileQuery";
import { CheckboxChip } from "@/components/LogSymptoms/CheckboxChip";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { fonts } from "@/utils/fonts";

const HEADER_GRADIENT = ["#781D11", "#A9334D", "#09332C"];

const SCD_TYPE_LABELS = {
  HbSS: "HbSS — Sickle Cell Anaemia",
  HbSC: "HbSC — Sickle-Haemoglobin C",
  HbSB0: "HbS-β⁰ Thalassaemia",
  HbSB_plus: "HbS-β⁺ Thalassaemia",
  HbSD: "HbSD",
  HbSE: "HbSE",
  unsure: "Not sure / undiagnosed",
};

const ESCALATION_TIERS = [
  {
    step: 1,
    label: "MILD",
    painRange: "Pain 1–4",
    color: "#A9334D",
    bg: "rgba(169,51,77,0.05)",
    border: "#A9334D",
    actions: [
      "Rest in a comfortable, warm position",
      "Increase fluid intake — aim for 2–3 litres today",
      "Take prescribed oral pain medication",
      "Apply a heat pack to painful areas",
      "Call your primary emergency contact",
      "Avoid cold temperatures and physical exertion",
    ],
  },
  {
    step: 2,
    label: "MODERATE",
    painRange: "Pain 5–7",
    color: "#781D11",
    bg: "rgba(120,29,17,0.05)",
    border: "#781D11",
    actions: [
      "Proceed to your preferred hospital or A&E",
      "Request IV fluids and IV pain management",
      "Bring this crisis plan and your medication list",
      "Alert your care team contacts now",
      "Do NOT drive yourself — arrange transport",
      "Tell medical staff your SCD type on arrival",
    ],
  },
  {
    step: 3,
    label: "SEVERE",
    painRange: "Pain 8–10+",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.05)",
    border: "#DC2626",
    actions: [
      "Call 999 / 911 immediately",
      "Do not wait — this is a medical emergency",
      "Stay still, stay warm, and breathe steadily",
      "Alert your care team via the Crisis Mode feature",
      "Tell emergency services you have sickle cell disease",
      "Mention any fever, chest pain, or stroke symptoms",
    ],
  },
];

const BLOOD_TYPES = [
  "A+",
  "A−",
  "B+",
  "B−",
  "AB+",
  "AB−",
  "O+",
  "O−",
  "I don't know",
];
const PRESET_ALLERGIES = [
  "Penicillin",
  "NSAIDs",
  "Aspirin",
  "Latex",
  "Codeine",
  "Sulfa drugs",
];

// ── Section heading ─────────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ── Tier row ────────────────────────────────────────────────────────────────────

function TierRow({ tier }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[
        styles.tierRow,
        { borderLeftColor: tier.border, backgroundColor: tier.bg },
      ]}
    >
      <View style={styles.tierHeader}>
        <View style={[styles.tierStepPill, { backgroundColor: tier.color }]}>
          <Text style={styles.tierStepText}>STEP {tier.step}</Text>
        </View>
        <Text style={[styles.tierLabel, { color: tier.color }]}>
          {tier.label}
        </Text>
        <Text style={styles.tierPainRange}>{tier.painRange}</Text>
        <ChevronDown
          size={15}
          color={tier.color}
          strokeWidth={2.5}
          style={{
            marginLeft: "auto",
            transform: [{ rotate: expanded ? "180deg" : "0deg" }],
          }}
        />
      </View>
      {expanded && (
        <View style={styles.tierActions}>
          {tier.actions.map((action, i) => (
            <View key={i} style={styles.tierActionRow}>
              <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
              <Text style={styles.tierActionText}>{action}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────────

export default function CrisisPlanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetRef = useRef(null);

  const crisisPlan = useAppStore((s) => s.crisisPlan);
  const crisisMode = useAppStore((s) => s.crisisMode);
  const updateCrisisPlan = useAppStore((s) => s.updateCrisisPlan);
  // const scdType = useAppStore((s) => s.onboardingData?.scdType);
  const savedFacilities = useAppStore((s) => s.savedFacilities);
  const preferredHospital = savedFacilities[0] ?? null;

  const { data: contacts = [] } = useEmergencyContactsQuery();
  const { data: medications = [] } = useMedicationsQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const { data: profile = [] } = useProfileQuery();

  const scdType = profile?.scdType || null;
  const bloodType = crisisPlan?.bloodType || null;
  const allergies = crisisPlan?.allergies || [];

  const crisisMeds = medications.filter(
    (m) =>
      m.isActive !== false &&
      (m.category === "Supportive" ||
        ["opioid", "analgesic", "nsaid", "pain"].some((kw) =>
          m.name?.toLowerCase().includes(kw),
        )),
  );

  // ── Edit sheet state ─────────────────────────────────────────────
  const [editBloodType, setEditBloodType] = useState(crisisPlan.bloodType);
  const [editPresets, setEditPresets] = useState(
    crisisPlan.allergies.filter((a) => PRESET_ALLERGIES.includes(a)),
  );
  const [editCustom, setEditCustom] = useState(
    crisisPlan.allergies.filter((a) => !PRESET_ALLERGIES.includes(a)),
  );
  const [editAllergyInput, setEditAllergyInput] = useState("");
  const [editNotes, setEditNotes] = useState(crisisPlan.erNotes);

  const toggleEditPreset = (p) =>
    setEditPresets((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const addEditCustom = () => {
    const trimmed = editAllergyInput.trim();
    if (
      trimmed &&
      !editCustom.includes(trimmed) &&
      !editPresets.includes(trimmed)
    ) {
      setEditCustom((prev) => [...prev, trimmed]);
    }
    setEditAllergyInput("");
  };

  const handleSaveEdit = () => {
    const allergies = [...editPresets, ...editCustom];
    updateCrisisPlan({
      bloodType: editBloodType,
      allergies,
      erNotes: editNotes,
    });
    updateProfileMutation.mutate({ bloodType: editBloodType, allergies });
    sheetRef.current?.close();
  };

  const openSheet = () => {
    setEditBloodType(crisisPlan.bloodType);
    setEditPresets(
      crisisPlan.allergies.filter((a) => PRESET_ALLERGIES.includes(a)),
    );
    setEditCustom(
      crisisPlan.allergies.filter((a) => !PRESET_ALLERGIES.includes(a)),
    );
    setEditNotes(crisisPlan.erNotes);
    sheetRef.current?.expand();
  };

  const allAllergies = [...allergies];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 24,
          paddingHorizontal: 20,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.3,
            top: -50,
            right: -30,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: 999,
            backgroundColor: "#09332C",
            opacity: 0.4,
            bottom: -20,
            left: -20,
          }}
        />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <ChevronLeft size={22} color="#F8E9E7" strokeWidth={2.5} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}
            >
              Crisis Plan
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                color: "rgba(248,233,231,0.65)",
                marginTop: 2,
              }}
            >
              Your personalised SCD emergency guide
            </Text>
          </View>
          <Pressable
            onPress={openSheet}
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Edit3 size={18} color="#F8E9E7" strokeWidth={2} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Crisis Mode CTA */}
        <View
          style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}
        >
          <Pressable
            onPress={() => router.push("/crisis-mode")}
            style={({ pressed }) => [
              styles.crisisCta,
              crisisMode.isActive
                ? { backgroundColor: "#DC2626" }
                : { backgroundColor: "#A9334D" },
              pressed && { opacity: 0.9 },
            ]}
          >
            <ShieldAlert
              size={22}
              color="#FFFFFF"
              strokeWidth={2}
              style={{ marginRight: 14 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.crisisCtaTitle}>
                {crisisMode.isActive
                  ? "Crisis Mode Active"
                  : "Activate Crisis Mode"}
              </Text>
              <Text style={styles.crisisCtaSubtitle}>
                {crisisMode.isActive
                  ? "Tap to view your active crisis protocol"
                  : "Step-by-step guidance + care team alerts"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── Medical Information ──────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel label="MEDICAL INFORMATION" />

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>SCD Type</Text>
            <Text style={styles.infoVal}>
              {scdType ? (SCD_TYPE_LABELS[scdType] ?? scdType) : "Not set"}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Blood Type</Text>
            <Text style={[styles.infoVal, !bloodType && styles.infoValEmpty]}>
              {bloodType ?? "Not set"}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
            <Text style={styles.infoKey}>Allergies</Text>
            {allAllergies.length > 0 ? (
              <View style={styles.allergyChips}>
                {allAllergies.map((a) => (
                  <View key={a} style={styles.allergyTag}>
                    <Text style={styles.allergyTagText}>{a}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValEmpty}>None recorded</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Warning Signs ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel label="WARNING SIGNS" />
          <Text style={styles.sectionHint}>
            Recognise these early signs that a crisis may be developing.
          </Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {crisisPlan.warningSigns.map((sign, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{sign}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Escalation Protocol ───────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel label="ESCALATION PROTOCOL" />
          <Text style={styles.sectionHint}>
            Start at Step 1 and only escalate if your condition worsens.
          </Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {ESCALATION_TIERS.map((tier) => (
              <TierRow key={tier.step} tier={tier} />
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Emergency Contacts ─────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel label="EMERGENCY CONTACTS" />
          {contacts.length === 0 ? (
            <Pressable
              onPress={() => router.push("/(tabs)/care/care-team")}
              style={styles.emptyState}
            >
              <Text style={styles.emptyStateText}>No contacts added yet</Text>
              <Text style={styles.emptyStateLink}>
                Add contacts in Care Team →
              </Text>
            </Pressable>
          ) : (
            <View style={{ gap: 0 }}>
              {contacts.map((contact, idx) => (
                <View key={contact.id}>
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                    style={({ pressed }) => [
                      styles.contactRow,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {contact.name
                          ?.split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.relationship ? (
                        <Text style={styles.contactRel}>
                          {contact.relationship}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.callPill}>
                      <Phone size={12} color="#A9334D" strokeWidth={2.5} />
                      <Text style={styles.callPillText}>{contact.phone}</Text>
                    </View>
                  </Pressable>
                  {idx < contacts.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        {/* ── Preferred Hospital ─────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel label="PREFERRED HOSPITAL" />
          {preferredHospital ? (
            <View style={{ gap: 8 }}>
              <Text style={styles.hospitalName}>{preferredHospital.name}</Text>
              {preferredHospital.address ? (
                <Text style={styles.hospitalAddress}>
                  {preferredHospital.address}
                </Text>
              ) : null}
              {preferredHospital.phone ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${preferredHospital.phone}`)
                  }
                  style={({ pressed }) => [
                    styles.callPillLarge,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Phone size={13} color="#A9334D" strokeWidth={2.5} />
                  <Text style={styles.callPillLargeText}>
                    Call {preferredHospital.phone}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/care/facilities")}
              style={styles.emptyState}
            >
              <Text style={styles.emptyStateText}>No hospital saved</Text>
              <Text style={styles.emptyStateLink}>
                Find nearby facilities →
              </Text>
            </Pressable>
          )}
        </View>

        {/* ── Crisis Medications ─────────────────────────────────────── */}
        {crisisMeds.length > 0 && (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <SectionLabel label="CRISIS MEDICATIONS" />
              <View style={{ gap: 0 }}>
                {crisisMeds.map((med, idx) => (
                  <View key={med.id}>
                    <View style={styles.medRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.medName}>{med.name}</Text>
                        {med.dosage ? (
                          <Text style={styles.medDosage}>
                            {med.dosage} · {med.frequency}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {idx < crisisMeds.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ── ER Notes ────────────────────────────────────────────────── */}
        {crisisPlan.erNotes ? (
          <>
            <View style={styles.sectionDivider} />
            <View style={styles.section}>
              <SectionLabel label="NOTES FOR ER STAFF" />
              <Text style={styles.erNotesText}>{crisisPlan.erNotes}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* Edit Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={["85%"]}
        enablePanDownToClose
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sheetTitle}>Edit Crisis Plan</Text>

          <Text style={styles.sheetLabel}>Blood Type</Text>
          <View style={styles.chipWrap}>
            {BLOOD_TYPES.map((bt) => (
              <CheckboxChip
                key={bt}
                label={bt}
                checked={editBloodType === bt}
                onPress={() =>
                  setEditBloodType(editBloodType === bt ? null : bt)
                }
              />
            ))}
          </View>

          <Text style={[styles.sheetLabel, { marginTop: 24 }]}>
            Known Allergies
          </Text>
          <View style={styles.chipWrap}>
            {PRESET_ALLERGIES.map((p) => (
              <CheckboxChip
                key={p}
                label={p}
                checked={editPresets.includes(p)}
                onPress={() => toggleEditPreset(p)}
              />
            ))}
            {editCustom.map((c) => (
              <CheckboxChip
                key={c}
                label={c}
                checked
                onPress={() =>
                  setEditCustom((prev) => prev.filter((x) => x !== c))
                }
              />
            ))}
          </View>
          <View style={styles.sheetInputRow}>
            <TextInput
              style={styles.sheetInput}
              placeholder="Add allergy…"
              placeholderTextColor="rgba(9,51,44,0.35)"
              value={editAllergyInput}
              onChangeText={setEditAllergyInput}
              onSubmitEditing={addEditCustom}
              returnKeyType="done"
              autoCapitalize="words"
            />
            {editAllergyInput.trim().length > 0 && (
              <Pressable onPress={addEditCustom} style={styles.sheetAddBtn}>
                <Text style={styles.sheetAddBtnText}>Add</Text>
              </Pressable>
            )}
          </View>

          <Text style={[styles.sheetLabel, { marginTop: 20 }]}>
            Notes for ER Staff
          </Text>
          <Text style={styles.sheetHint}>
            Any information that could help emergency staff treat you quickly —
            e.g. past reactions, preferred pain protocols.
          </Text>
          <TextInput
            style={styles.sheetTextarea}
            placeholder="e.g. 'Previous ACS episode in 2023. Best response to morphine IV.'"
            placeholderTextColor="rgba(9,51,44,0.35)"
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Pressable
            onPress={handleSaveEdit}
            style={({ pressed }) => [
              styles.sheetSaveBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crisisCta: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  crisisCtaTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  crisisCtaSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  // ── Sections ──────────────────────────────────────────────────────
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "rgba(9,51,44,0.4)",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionHint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.55)",
    lineHeight: 19,
    marginTop: -6,
    marginBottom: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(9,51,44,0.07)",
    marginHorizontal: 20,
  },
  // ── Info rows ──────────────────────────────────────────────────────
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 16,
  },
  infoKey: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "rgba(9,51,44,0.55)",
    flexShrink: 0,
  },
  infoVal: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
    textAlign: "right",
    flex: 1,
  },
  infoValEmpty: {
    fontFamily: fonts.regular,
    color: "rgba(9,51,44,0.35)",
    textAlign: "right",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(9,51,44,0.06)",
  },
  allergyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
    justifyContent: "flex-end",
  },
  allergyTag: {
    backgroundColor: "rgba(169,51,77,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  allergyTagText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    textTransform: "capitalize",
    color: "#A9334D",
  },
  // ── Warning signs ──────────────────────────────────────────────────
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#A9334D",
    marginTop: 8,
    flexShrink: 0,
  },
  bulletText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.75)",
    flex: 1,
    lineHeight: 20,
  },
  // ── Escalation tiers ───────────────────────────────────────────────
  tierRow: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 14,
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierStepPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tierStepText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tierLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  tierPainRange: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.45)",
  },
  tierActions: {
    marginTop: 12,
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(9,51,44,0.06)",
  },
  tierActionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tierDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
    flexShrink: 0,
  },
  tierActionText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.75)",
    flex: 1,
    lineHeight: 19,
  },
  // ── Contacts ────────────────────────────────────────────────────────
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#09332C",
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#F8E9E7",
  },
  contactName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
  },
  contactRel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.5)",
    marginTop: 1,
  },
  callPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(169,51,77,0.08)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  callPillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#A9334D",
  },
  // ── Hospital ────────────────────────────────────────────────────────
  hospitalName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: "#09332C",
  },
  hospitalAddress: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.55)",
    lineHeight: 18,
  },
  callPillLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(169,51,77,0.08)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  callPillLargeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#A9334D",
  },
  // ── Medications ────────────────────────────────────────────────────
  medRow: {
    paddingVertical: 10,
  },
  medName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    textTransform: "capitalize",
    color: "#09332C",
  },
  medDosage: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.5)",
    marginTop: 2,
  },
  // ── ER Notes ───────────────────────────────────────────────────────
  erNotesText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.75)",
    lineHeight: 22,
  },
  // ── Empty states ───────────────────────────────────────────────────
  emptyState: {
    paddingVertical: 8,
    gap: 4,
  },
  emptyStateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.4)",
  },
  emptyStateLink: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#A9334D",
  },
  // ── Bottom sheet ───────────────────────────────────────────────────
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
  },
  sheetHandle: {
    backgroundColor: "rgba(9,51,44,0.15)",
    width: 40,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 48,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#09332C",
    marginBottom: 20,
  },
  sheetLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
    marginBottom: 10,
  },
  sheetHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.5)",
    lineHeight: 17,
    marginBottom: 10,
    marginTop: -6,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sheetInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  sheetInput: {
    flex: 1,
    backgroundColor: "#F8F4F0",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#09332C",
  },
  sheetAddBtn: {
    backgroundColor: "#09332C",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sheetAddBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#F8E9E7",
  },
  sheetTextarea: {
    backgroundColor: "#F8F4F0",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#09332C",
    minHeight: 100,
  },
  sheetSaveBtn: {
    backgroundColor: "#A9334D",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  sheetSaveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#FFFFFF",
  },
});
