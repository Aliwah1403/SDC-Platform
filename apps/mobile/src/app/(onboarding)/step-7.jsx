import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import * as Contacts from "expo-contacts";
import PhoneInput from "react-native-phone-number-input";
import {
  Plus,
  Trash2,
  Shield,
  Search,
  X,
  BookUser,
  PenLine,
} from "lucide-react-native";
import OnboardingStep from "@/components/OnboardingStep";
import { useAppStore } from "@/store/appStore";
import { DEFAULT_PHONE_COUNTRY, countryFlagEmoji, parsePhoneForInput } from "@/utils/phoneNumbers";

const RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Partner",
  "Friend",
  "Carer",
  "Doctor",
  "Other",
];
const CONTACT_DETAIL_FIELDS = [
  Contacts.ContactField.FULL_NAME,
  Contacts.ContactField.GIVEN_NAME,
  Contacts.ContactField.FAMILY_NAME,
  Contacts.ContactField.PHONES,
];

const emptyManual = () => ({
  name: "",
  phone: "", // formatted international number (+441234567890)
  phoneInputValue: "",
  phoneCountryCode: DEFAULT_PHONE_COUNTRY,
  phoneCallingCode: "44",
  phoneInputKey: 0,
  relationship: "",
  source: "manual",
});

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

async function normalizePickedContact(contact) {
  if (!contact) return null;

  const details =
    typeof contact.getDetails === "function"
      ? await contact.getDetails(CONTACT_DETAIL_FIELDS)
      : contact;
  const name =
    details.fullName ||
    details.name ||
    [details.givenName ?? details.firstName, details.familyName ?? details.lastName]
      .filter(Boolean)
      .join(" ") ||
    "";
  const phones = details.phones ?? details.phoneNumbers ?? [];
  const phoneNumbers = phones
    .map((phone) => ({ number: phone.number }))
    .filter((phone) => !!phone.number);

  return {
    ...details,
    name,
    phoneNumbers,
  };
}

function ContactPhoneInput({ contact, index, setFocusedField, updateContact }) {
  const phoneInputRef = useRef(null);
  const phoneCountryCode = contact.phoneCountryCode ?? DEFAULT_PHONE_COUNTRY;
  const phoneCallingCode = contact.phoneCallingCode ?? "44";
  const phoneInputValue = contact.phoneInputValue ?? "";

  useEffect(() => {
    phoneInputRef.current?.setState?.({
      countryCode: phoneCountryCode,
      code: phoneCallingCode,
      number: phoneInputValue,
    });
  }, [phoneCallingCode, phoneCountryCode, phoneInputValue]);

  return (
    <PhoneInput
      ref={phoneInputRef}
      key={`onboarding-phone-${index}-${contact.phoneInputKey ?? 0}-${phoneCountryCode}`}
      defaultCode={phoneCountryCode}
      layout="first"
      placeholder="Phone number"
      value={phoneInputValue}
      flagSize={20}
      onChangeText={(text) =>
        updateContact(index, "phoneInputValue", text)
      }
      onChangeFormattedText={(text) =>
        updateContact(index, "phone", text)
      }
      onChangeCountry={(country) => {
        updateContact(index, "phoneCountryCode", country.cca2 ?? DEFAULT_PHONE_COUNTRY);
        updateContact(index, "phoneCallingCode", country.callingCode?.[0] ?? phoneCallingCode);
      }}
      containerStyle={styles.phoneContainer}
      textContainerStyle={styles.phoneTextContainer}
      textInputStyle={styles.phoneTextInput}
      codeTextStyle={styles.phoneCodeText}
      flagButtonStyle={styles.phoneFlagBtn}
      textInputProps={{
        placeholderTextColor: "rgba(9,51,44,0.35)",
        keyboardType: "phone-pad",
        onFocus: () => setFocusedField(`phone-${index}`),
        onBlur: () => setFocusedField(null),
      }}
      countryPickerProps={{
        withFilter: true,
        withFlag: true,
        withFlagButton: true,
        withEmoji: true,
        withCallingCodeButton: true,
        withAlphaFilter: true,
        renderFlagButton: () => (
          <Text style={styles.phoneFlagEmoji}>
            {countryFlagEmoji(phoneCountryCode)}
          </Text>
        ),
      }}
    />
  );
}

export default function Step7() {
  const { setOnboardingField, setOnboardingStep } = useAppStore();

  const [contacts, setContacts] = useState([]);
  const [isManual, setIsManual] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Android contacts modal
  const [allContacts, setAllContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPickerTarget, setContactPickerTarget] = useState(null);
  const [contactSearch, setContactSearch] = useState("");
  const contactSearchRef = useRef(null);

  // ── Contact picker (from phone) ─────────────────────────────
  const ensureManualContactSlot = () => {
    setIsManual(true);
    if (contacts.length === 0) setContacts([emptyManual()]);
  };

  const showContactsUnavailableAlert = (canOpenSettings = false) => {
    const actions = [
      {
        text: "Add manually",
        onPress: ensureManualContactSlot,
      },
    ];

    if (canOpenSettings) {
      actions.unshift({
        text: "Open Settings",
        onPress: () => Linking.openSettings(),
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });

    Alert.alert(
      "Contacts unavailable",
      "Hemo could not open your phone contacts. You can allow contacts access in Settings or add this contact manually.",
      actions,
    );
  };

  const addPickedContact = (contact, targetIndex) => {
    const resolvedName =
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      "";
    const phone = contact.phoneNumbers?.[0]?.number || "";
    const parsedPhone = parsePhoneForInput(phone);
    const slot = {
      name: resolvedName,
      phone: parsedPhone.formattedNumber,
      phoneInputValue: parsedPhone.nationalNumber,
      phoneCountryCode: parsedPhone.countryCode,
      phoneCallingCode: parsedPhone.callingCode,
      phoneInputKey: Date.now(),
      relationship: "",
      source: "picker",
    };
    setContacts((prev) => {
      const updated = [...prev];
      if (targetIndex >= updated.length) return [...updated, slot];
      updated[targetIndex] = slot;
      return updated;
    });
  };

  const openContactList = async (targetIndex) => {
    setIsLoading(true);
    try {
      const permission = await Contacts.requestPermissionsAsync();
      if (permission.status !== "granted") {
        ensureManualContactSlot();
        showContactsUnavailableAlert(permission.canAskAgain === false);
        return;
      }

      const data = await Contacts.Contact.getAllDetails(CONTACT_DETAIL_FIELDS);
      const contactsWithPhones = data
        .map((contact) => ({
          id: contact.id,
          name:
            contact.fullName ||
            [contact.givenName, contact.familyName].filter(Boolean).join(" ") ||
            "",
          phoneNumbers: (contact.phones ?? [])
            .map((phone) => ({ number: phone.number }))
            .filter((phone) => !!phone.number),
        }))
        .filter(
          (c) => c.name && c.phoneNumbers?.length > 0,
        );

      setAllContacts(contactsWithPhones);
      setContactPickerTarget(targetIndex);
      setContactSearch("");
      setShowContactModal(true);
      setTimeout(() => contactSearchRef.current?.focus(), 300);
    } catch (error) {
      console.warn("[contacts] Failed to load phone contacts", error);
      ensureManualContactSlot();
      showContactsUnavailableAlert();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickContact = async (targetIndex) => {
    if (Platform.OS === "ios" && Contacts.Contact?.presentPicker) {
      try {
        const contact = await Contacts.Contact.presentPicker();
        const normalizedContact = await normalizePickedContact(contact);
        if (normalizedContact) addPickedContact(normalizedContact, targetIndex);
      } catch (error) {
        console.warn("[contacts] Native contact picker failed", error);
        await openContactList(targetIndex);
      }
      return;
    }

    await openContactList(targetIndex);
  };

  const selectFromContactModal = (contact) => {
    addPickedContact(contact, contactPickerTarget ?? contacts.length);
    setShowContactModal(false);
    setContactPickerTarget(null);
  };

  // ── Contact list helpers ────────────────────────────────────
  const removeContact = (index) =>
    setContacts((prev) => prev.filter((_, i) => i !== index));

  const updateContact = (index, field, value) =>
    setContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

  const handleAddAnother = () => {
    if (isManual) setContacts((prev) => [...prev, emptyManual()]);
    else handlePickContact(contacts.length);
  };

  // ── Save ───────────────────────────────────────────────────
  const isValid =
    contacts.length > 0 &&
    !!contacts[0]?.name?.trim() &&
    !!contacts[0]?.phone?.trim();

  const handleContinue = () => {
    const valid = contacts
      .filter((c) => c.name?.trim() && c.phone?.trim())
      .map(({ name, phone, relationship }) => ({ name, phone, relationship }));
    setOnboardingField("emergencyContacts", valid);
    setOnboardingStep(7);
    router.push("/(onboarding)/step-8");
  };

  const filteredContacts = allContacts
    .filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
    .slice(0, 60);

  const showingCards = contacts.length > 0 || isManual;

  return (
    <OnboardingStep
      step={7}
      title="Emergency contact"
      subtitle="In a crisis, who should we call? At least one contact is required."
      illustrationIcon={Shield}
      illustrationColor="#781D11"
      onBack={() => router.back()}
      onCta={handleContinue}
      ctaDisabled={!isValid}
      ctaLabel="Save & Next"
    >
      {/* ── Gate ─────────────────────────────────────────────── */}
      {!showingCards && (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 16, stiffness: 80 }}
          style={styles.gateCard}
        >
          <View style={styles.gateIconWrap}>
            <BookUser size={32} color="#A9334D" strokeWidth={1.6} />
          </View>
          <Text style={styles.gateTitle}>Import from Contacts</Text>
          <Text style={styles.gateBody}>
            Select someone from your phone's contact book — their name and
            number will be filled in automatically.
          </Text>

          {isLoading ? (
            <ActivityIndicator color="#A9334D" style={{ marginTop: 8 }} />
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.accessBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => handlePickContact(0)}
            >
              <BookUser size={18} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.accessBtnText}>Select a Contact</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              setIsManual(true);
              setContacts([emptyManual()]);
            }}
            hitSlop={8}
          >
            <Text style={styles.manualLink}>Add manually instead</Text>
          </Pressable>
        </MotiView>
      )}

      {/* ── Contact cards ─────────────────────────────────────── */}
      {contacts.map((contact, index) => (
        <MotiView
          key={index}
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: "spring",
            damping: 16,
            stiffness: 80,
            delay: index * 60,
          }}
          style={styles.contactCard}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>
              {index === 0 ? "Primary contact" : `Contact ${index + 1}`}
            </Text>
            {index > 0 && (
              <Pressable onPress={() => removeContact(index)} hitSlop={8}>
                <Trash2 size={16} color="#DC2626" strokeWidth={1.8} />
              </Pressable>
            )}
          </View>

          {contact.source === "picker" ? (
            <View style={styles.pickedRow}>
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>
                  {getInitials(contact.name)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickedName}>{contact.name}</Text>
                <Text style={styles.pickedPhone}>{contact.phone}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.changeBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handlePickContact(index)}
              >
                <PenLine size={14} color="#A9334D" strokeWidth={2} />
                <Text style={styles.changeBtnText}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Name input */}
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === `name-${index}` && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="rgba(9,51,44,0.35)"
                  value={contact.name}
                  onChangeText={(v) => updateContact(index, "name", v)}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField(`name-${index}`)}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Phone input — library handles flag + country code + number */}
              <ContactPhoneInput
                contact={contact}
                index={index}
                setFocusedField={setFocusedField}
                updateContact={updateContact}
              />
            </>
          )}

          {/* Relationship chips */}
          <Text style={styles.relLabel}>Relationship</Text>
          <View style={styles.relChips}>
            {RELATIONSHIPS.map((rel) => {
              const selected = contact.relationship === rel;
              return (
                <Pressable
                  key={rel}
                  style={({ pressed }) => [
                    styles.relChip,
                    selected && styles.relChipSelected,
                    pressed && !selected && { opacity: 0.7 },
                  ]}
                  onPress={() => updateContact(index, "relationship", rel)}
                >
                  <Text
                    style={[
                      styles.relChipText,
                      selected && styles.relChipTextSelected,
                    ]}
                  >
                    {rel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </MotiView>
      ))}

      {/* ── Add another ───────────────────────────────────────── */}
      {showingCards && contacts.length < 3 && (
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={handleAddAnother}
        >
          <Plus size={16} color="#1A1A1A" strokeWidth={2} />
          <Text style={styles.addBtnText}>Add another contact</Text>
        </Pressable>
      )}

      {/* ── Android contacts modal ────────────────────────────── */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a contact</Text>
              <Pressable onPress={() => setShowContactModal(false)} hitSlop={8}>
                <X size={22} color="#1A1A1A" strokeWidth={2} />
              </Pressable>
            </View>

            <View style={styles.searchWrapper}>
              <Search size={17} color="rgba(9,51,44,0.4)" strokeWidth={1.8} />
              <TextInput
                ref={contactSearchRef}
                style={styles.searchInput}
                placeholder="Search contacts"
                placeholderTextColor="rgba(9,51,44,0.35)"
                value={contactSearch}
                onChangeText={setContactSearch}
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredContacts}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.contactRow,
                    pressed && { backgroundColor: "rgba(169,51,77,0.04)" },
                  ]}
                  onPress={() => selectFromContactModal(item)}
                >
                  <View style={styles.rowInitials}>
                    <Text style={styles.rowInitialsText}>
                      {getInitials(item.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowPhone} numberOfLines={1}>
                      {item.phoneNumbers[0]?.number}
                    </Text>
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {contactSearch
                      ? "No contacts match your search."
                      : "No contacts with phone numbers found."}
                  </Text>
                </View>
              }
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  gateCard: {
    borderRadius: 18,
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
  },
  gateIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(169,51,77,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gateTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 17,
    color: "#1A1A1A",
    textAlign: "center",
  },
  gateBody: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "rgba(9,51,44,0.6)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  accessBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#A9334D",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  accessBtnText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  manualLink: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
    textDecorationLine: "underline",
    marginTop: 2,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  pickedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8F4F0",
    borderRadius: 12,
    padding: 12,
  },
  initialsCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontFamily: "Geist_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  pickedName: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 15,
    color: "#1A1A1A",
  },
  pickedPhone: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
    marginTop: 1,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(169,51,77,0.08)",
    borderRadius: 8,
  },
  changeBtnText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#A9334D",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  inputFocused: {
    borderColor: "#A9334D",
    backgroundColor: "rgba(169,51,77,0.04)",
  },
  input: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#1A1A1A",
    padding: 0,
    margin: 0,
  },
  // PhoneInput library styling
  phoneContainer: {
    width: "100%",
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
    height: 50,
  },
  phoneTextContainer: {
    backgroundColor: "#F8F4F0",
    borderRadius: 10,
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#1A1A1A",
    height: 50,
  },
  phoneCodeText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 14,
    color: "#1A1A1A",
  },
  phoneFlagBtn: {
    backgroundColor: "transparent",
  },
  phoneFlagEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  relLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "rgba(9,51,44,0.55)",
    marginBottom: -4,
  },
  relChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  relChip: {
    backgroundColor: "#F8F4F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.1)",
  },
  relChipSelected: {
    backgroundColor: "#A9334D",
    borderColor: "#A9334D",
  },
  relChipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#1A1A1A",
  },
  relChipTextSelected: {
    color: "#FFFFFF",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(9,51,44,0.05)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.1)",
    borderStyle: "dashed",
    justifyContent: "center",
    marginTop: 4,
  },
  addBtnText: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#1A1A1A",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(9,51,44,0.07)",
  },
  modalTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 17,
    color: "#1A1A1A",
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F0EBE5",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#1A1A1A",
    padding: 0,
    margin: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(9,51,44,0.06)",
    marginLeft: 62,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  rowInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#A9334D",
    alignItems: "center",
    justifyContent: "center",
  },
  rowInitialsText: {
    fontFamily: "Geist_700Bold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  rowName: {
    fontFamily: "Geist_500Medium",
    fontSize: 15,
    color: "#1A1A1A",
  },
  rowPhone: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
    marginTop: 1,
  },
  emptyState: {
    paddingTop: 48,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "rgba(9,51,44,0.45)",
    textAlign: "center",
  },
});
