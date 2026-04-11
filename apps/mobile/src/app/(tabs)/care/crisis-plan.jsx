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
  AlertTriangle,
  Heart,
  Phone,
  Building2,
  Pill,
  Droplets,
  X,
  ChevronRight,
  Activity,
  ShieldAlert,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
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
    bg: "rgba(248,233,231,0.6)",
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
    color: "#A9334D",
    bg: "rgba(169,51,77,0.07)",
    border: "#A9334D",
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
    bg: "rgba(220,38,38,0.07)",
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

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "I don't know"];
const PRESET_ALLERGIES = ["Penicillin", "NSAIDs", "Aspirin", "Latex", "Codeine", "Sulfa drugs"];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconColor, title, children }) {
  return (
    <View style={[styles.card, CARD_SHADOW]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBg, { backgroundColor: `${iconColor}15` }]}>
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function TierRow({ tier }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={[styles.tierRow, { borderLeftColor: tier.border, backgroundColor: tier.bg }]}
    >
      <View style={styles.tierHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.tierLabelRow}>
            <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
              <Text style={styles.tierBadgeText}>STEP {tier.step}</Text>
            </View>
            <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
            <Text style={styles.tierPainRange}>{tier.painRange}</Text>
          </View>
        </View>
        <ChevronRight
          size={16}
          color={tier.color}
          strokeWidth={2}
          style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
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
  const scdType = useAppStore((s) => s.onboardingData?.scdType);
  const savedFacilities = useAppStore((s) => s.savedFacilities);
  const preferredHospital = savedFacilities[0] ?? null;

  const { data: contacts = [] } = useEmergencyContactsQuery();
  const { data: medications = [] } = useMedicationsQuery();

  // Filter pain-relevant medications (Supportive category or opioids/analgesics)
  const crisisMeds = medications.filter(
    (m) =>
      m.isActive !== false &&
      (m.category === "Supportive" ||
        ["opioid", "analgesic", "nsaid", "pain"].some((kw) =>
          m.name?.toLowerCase().includes(kw)
        ))
  );

  // ── Edit sheet state ─────────────────────────────────────────────
  const [editBloodType, setEditBloodType] = useState(crisisPlan.bloodType);
  const [editPresets, setEditPresets] = useState(
    crisisPlan.allergies.filter((a) => PRESET_ALLERGIES.includes(a))
  );
  const [editCustom, setEditCustom] = useState(
    crisisPlan.allergies.filter((a) => !PRESET_ALLERGIES.includes(a))
  );
  const [editAllergyInput, setEditAllergyInput] = useState("");
  const [editNotes, setEditNotes] = useState(crisisPlan.erNotes);

  const toggleEditPreset = (p) =>
    setEditPresets((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const addEditCustom = () => {
    const trimmed = editAllergyInput.trim();
    if (trimmed && !editCustom.includes(trimmed) && !editPresets.includes(trimmed)) {
      setEditCustom((prev) => [...prev, trimmed]);
    }
    setEditAllergyInput("");
  };

  const handleSaveEdit = () => {
    updateCrisisPlan({
      bloodType: editBloodType,
      allergies: [...editPresets, ...editCustom],
      erNotes: editNotes,
    });
    sheetRef.current?.close();
  };

  const openSheet = () => {
    // Re-sync edit state from store before opening
    setEditBloodType(crisisPlan.bloodType);
    setEditPresets(crisisPlan.allergies.filter((a) => PRESET_ALLERGIES.includes(a)));
    setEditCustom(crisisPlan.allergies.filter((a) => !PRESET_ALLERGIES.includes(a)));
    setEditNotes(crisisPlan.erNotes);
    sheetRef.current?.expand();
  };

  const allAllergies = [...crisisPlan.allergies];

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingBottom: 24, paddingHorizontal: 20, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", width: 160, height: 160, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.3, top: -50, right: -30 }} />
        <View style={{ position: "absolute", width: 100, height: 100, borderRadius: 999, backgroundColor: "#09332C", opacity: 0.4, bottom: -20, left: -20 }} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <ChevronLeft size={22} color="#F8E9E7" strokeWidth={2.5} />
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: "#F8E9E7" }}>Crisis Plan</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(248,233,231,0.65)", marginTop: 2 }}>
              Your personalised SCD emergency guide
            </Text>
          </View>
          <Pressable
            onPress={openSheet}
            style={({ pressed }) => [styles.editHeaderBtn, pressed && { opacity: 0.7 }]}
          >
            <Edit3 size={18} color="#F8E9E7" strokeWidth={2} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Crisis Mode CTA */}
        <Pressable
          onPress={() => router.push("/crisis-mode")}
          style={({ pressed }) => [
            styles.crisisCta,
            crisisMode.isActive ? styles.crisisCtaActive : styles.crisisCtaDefault,
            pressed && { opacity: 0.9 },
          ]}
        >
          <ShieldAlert
            size={24}
            color="#FFFFFF"
            strokeWidth={2}
            style={{ marginRight: 14 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.crisisCtaTitle}>
              {crisisMode.isActive ? "Crisis Mode Active" : "Activate Crisis Mode"}
            </Text>
            <Text style={styles.crisisCtaSubtitle}>
              {crisisMode.isActive
                ? "Tap to view your active crisis protocol"
                : "Step-by-step guidance + care team alerts"}
            </Text>
          </View>
          <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>

        {/* Medical Info */}
        <SectionCard icon={Droplets} iconColor="#A9334D" title="Medical Information">
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>SCD Type</Text>
              <Text style={styles.infoValue}>
                {scdType ? (SCD_TYPE_LABELS[scdType] ?? scdType) : "Not set"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Blood Type</Text>
              <Text style={[styles.infoValue, !crisisPlan.bloodType && styles.infoValueEmpty]}>
                {crisisPlan.bloodType ?? "Not set — tap Edit to add"}
              </Text>
            </View>
            {allAllergies.length > 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Known Allergies</Text>
                <View style={styles.allergyChips}>
                  {allAllergies.map((a) => (
                    <View key={a} style={styles.allergyTag}>
                      <Text style={styles.allergyTagText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {allAllergies.length === 0 && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Known Allergies</Text>
                <Text style={styles.infoValueEmpty}>None recorded — tap Edit to add</Text>
              </View>
            )}
          </View>
        </SectionCard>

        {/* Warning Signs */}
        <SectionCard icon={AlertTriangle} iconColor="#DC2626" title="Warning Signs">
          <Text style={styles.cardSubtext}>
            Recognise these early signs that a crisis may be developing:
          </Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            {crisisPlan.warningSigns.map((sign, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: "#DC2626" }]} />
                <Text style={styles.bulletText}>{sign}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Escalation Protocol */}
        <SectionCard icon={Activity} iconColor="#09332C" title="Escalation Protocol">
          <Text style={styles.cardSubtext}>
            Tap each step to see what actions to take. Follow the protocol from Step 1, escalating only if needed.
          </Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {ESCALATION_TIERS.map((tier) => (
              <TierRow key={tier.step} tier={tier} />
            ))}
          </View>
        </SectionCard>

        {/* Emergency Contacts */}
        <SectionCard icon={Phone} iconColor="#A9334D" title="Emergency Contacts">
          {contacts.length === 0 ? (
            <Pressable
              onPress={() => router.push("/(tabs)/care/care-team")}
              style={styles.emptyState}
            >
              <Text style={styles.emptyStateText}>No contacts added yet</Text>
              <Text style={styles.emptyStateLink}>Add contacts in Care Team →</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 10, marginTop: 4 }}>
              {contacts.map((contact) => (
                <Pressable
                  key={contact.id}
                  onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.75 }]}
                >
                  <View style={styles.contactInitials}>
                    <Text style={styles.contactInitialsText}>
                      {contact.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.relationship ? (
                      <Text style={styles.contactRel}>{contact.relationship}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Phone size={14} color="#A9334D" strokeWidth={2} style={{ marginLeft: 6 }} />
                </Pressable>
              ))}
            </View>
          )}
        </SectionCard>

        {/* Preferred Hospital */}
        <SectionCard icon={Building2} iconColor="#09332C" title="Preferred Hospital">
          {preferredHospital ? (
            <View style={{ gap: 10, marginTop: 4 }}>
              <View style={styles.hospitalRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hospitalName}>{preferredHospital.name}</Text>
                  {preferredHospital.address ? (
                    <Text style={styles.hospitalAddress}>{preferredHospital.address}</Text>
                  ) : null}
                </View>
              </View>
              {preferredHospital.phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${preferredHospital.phone}`)}
                  style={({ pressed }) => [styles.hospitalCallBtn, pressed && { opacity: 0.8 }]}
                >
                  <Phone size={14} color="#A9334D" strokeWidth={2} />
                  <Text style={styles.hospitalCallText}>Call {preferredHospital.phone}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/(tabs)/care/facilities")}
              style={styles.emptyState}
            >
              <Text style={styles.emptyStateText}>No hospital saved</Text>
              <Text style={styles.emptyStateLink}>Find nearby facilities →</Text>
            </Pressable>
          )}
        </SectionCard>

        {/* Crisis Medications */}
        {crisisMeds.length > 0 && (
          <SectionCard icon={Pill} iconColor="#A9334D" title="Crisis Medications">
            <Text style={styles.cardSubtext}>
              Medications that may help manage a pain crisis:
            </Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {crisisMeds.map((med) => (
                <View key={med.id} style={styles.medRow}>
                  <View style={styles.medIconWrap}>
                    <Pill size={14} color="#A9334D" strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.dosage ? (
                      <Text style={styles.medDosage}>{med.dosage} · {med.frequency}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        )}

        {/* ER Notes */}
        {crisisPlan.erNotes ? (
          <SectionCard icon={Heart} iconColor="#781D11" title="Notes for ER Staff">
            <Text style={styles.erNotesText}>{crisisPlan.erNotes}</Text>
          </SectionCard>
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

          {/* Blood Type */}
          <Text style={styles.sheetLabel}>Blood Type</Text>
          <View style={styles.sheetChipRow}>
            {BLOOD_TYPES.map((bt) => {
              const sel = editBloodType === bt;
              return (
                <Pressable
                  key={bt}
                  onPress={() => setEditBloodType(bt === editBloodType ? null : bt)}
                  style={[styles.sheetChip, sel && styles.sheetChipSel]}
                >
                  <Text style={[styles.sheetChipText, sel && styles.sheetChipTextSel]}>{bt}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Allergies */}
          <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Known Allergies</Text>
          <View style={styles.sheetChipRow}>
            {PRESET_ALLERGIES.map((p) => {
              const sel = editPresets.includes(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => toggleEditPreset(p)}
                  style={[styles.sheetAllergyChip, sel && styles.sheetChipSel]}
                >
                  <Text style={[styles.sheetChipText, sel && styles.sheetChipTextSel]}>{p}</Text>
                  {sel && <X size={11} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 4 }} />}
                </Pressable>
              );
            })}
            {editCustom.map((c) => (
              <Pressable
                key={c}
                onPress={() => setEditCustom((prev) => prev.filter((x) => x !== c))}
                style={[styles.sheetAllergyChip, styles.sheetChipSel]}
              >
                <Text style={styles.sheetChipTextSel}>{c}</Text>
                <X size={11} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 4 }} />
              </Pressable>
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

          {/* ER Notes */}
          <Text style={[styles.sheetLabel, { marginTop: 20 }]}>Notes for ER Staff</Text>
          <Text style={styles.sheetHint}>
            Any information that could help emergency staff treat you quickly — e.g. past reactions, preferred pain protocols.
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
            style={({ pressed }) => [styles.sheetSaveBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.sheetSaveBtnText}>Save Changes</Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  editHeaderBtn: {
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
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  crisisCtaDefault: {
    backgroundColor: "#A9334D",
  },
  crisisCtaActive: {
    backgroundColor: "#DC2626",
  },
  crisisCtaTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  crisisCtaSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  cardIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: "#09332C",
  },
  cardSubtext: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(9,51,44,0.6)",
    lineHeight: 19,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: "rgba(9,51,44,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoValue: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: "#09332C",
  },
  infoValueEmpty: {
    color: "rgba(9,51,44,0.4)",
    fontFamily: fonts.regular,
  },
  allergyChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  allergyTag: {
    backgroundColor: "rgba(169,51,77,0.1)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  allergyTagText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: "#A9334D",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  bulletText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.75)",
    flex: 1,
    lineHeight: 20,
  },
  tierRow: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
    overflow: "hidden",
  },
  tierHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tierLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  tierBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  tierBadgeText: {
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
    color: "rgba(9,51,44,0.5)",
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4F0",
    borderRadius: 12,
    padding: 12,
  },
  contactInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#09332C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactInitialsText: {
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
  contactPhone: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#A9334D",
  },
  hospitalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  hospitalName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
  },
  hospitalAddress: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.55)",
    marginTop: 2,
    lineHeight: 17,
  },
  hospitalCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(169,51,77,0.08)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: "flex-start",
  },
  hospitalCallText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#A9334D",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  medIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(169,51,77,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  medName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: "#09332C",
  },
  medDosage: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "rgba(9,51,44,0.5)",
    marginTop: 1,
  },
  erNotesText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(9,51,44,0.75)",
    lineHeight: 21,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 12,
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
  // Sheet styles
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
  sheetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    backgroundColor: "#F8F4F0",
  },
  sheetAllergyChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.12)",
    backgroundColor: "#F8F4F0",
  },
  sheetChipSel: {
    backgroundColor: "#A9334D",
    borderColor: "#A9334D",
  },
  sheetChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#09332C",
  },
  sheetChipTextSel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#FFFFFF",
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
    borderRadius: 16,
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
