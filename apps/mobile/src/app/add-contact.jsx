import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Contacts from "expo-contacts";
import * as ImagePicker from "expo-image-picker";
import PhoneInput from "react-native-phone-number-input";
import {
  X,
  ChevronLeft,
  BookUser,
  PenLine,
  Search,
  Camera,
  Trash2,
  UserPlus,
} from "lucide-react-native";
import {
  useEmergencyContactsQuery,
  useAddEmergencyContactMutation,
  useUpdateEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
} from "@/hooks/queries/useEmergencyContactsQuery";
import { uploadContactPhoto } from "@/services/supabaseQueries";
import { useAuthStore } from "@/utils/auth/store";
import { fonts } from "@/utils/fonts";

const RELATIONSHIPS = [
  "Parent",
  "Sibling",
  "Partner",
  "Friend",
  "Carer",
  "Doctor",
  "Other",
];

const C = {
  bg: "#F8F4F0",
  accent: "#A9334D",
  dark: "#09332C",
  muted: "#9CA3AF",
  border: "rgba(9,51,44,0.1)",
  inputBg: "#F0EBE5",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AddContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { contactId } = useLocalSearchParams();
  const { auth } = useAuthStore();
  const userId = auth?.user?.id;

  const { data: contacts = [] } = useEmergencyContactsQuery();
  const addMutation = useAddEmergencyContactMutation();
  const updateMutation = useUpdateEmergencyContactMutation();
  const deleteMutation = useDeleteEmergencyContactMutation();

  const existing = contactId ? contacts.find((c) => c.id === contactId) : null;
  const isEditing = !!existing;

  // Form state
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [relationship, setRelationship] = useState(
    existing?.relationship ?? "",
  );
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);
  const [photoUri, setPhotoUri] = useState(null); // local URI of newly selected photo
  const [existingPhotoUrl] = useState(existing?.photoUrl ?? null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [relError, setRelError] = useState(false);

  // Contact picker mode (create only)
  const [mode, setMode] = useState(isEditing ? "form" : "gate"); // "gate" | "form"
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Android contact picker modal
  const [allContacts, setAllContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const contactSearchRef = useRef(null);

  const [focusedField, setFocusedField] = useState(null);

  // ── Photo picker ──────────────────────────────────────────────────────────
  const handlePhotoPress = () => {
    const options = ["Take Photo", "Choose from Gallery"];
    if (photoUri || (existingPhotoUrl && !photoRemoved))
      options.push("Remove Photo");
    options.push("Cancel");
    Alert.alert("Contact Photo", undefined, [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission required", "Camera access is needed.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
            setPhotoRemoved(false);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
            setPhotoRemoved(false);
          }
        },
      },
      ...(photoUri || (existingPhotoUrl && !photoRemoved)
        ? [
            {
              text: "Remove Photo",
              style: "destructive",
              onPress: () => {
                setPhotoUri(null);
                setPhotoRemoved(true);
              },
            },
          ]
        : []),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Contact picker ────────────────────────────────────────────────────────
  const applyPickedContact = (contact) => {
    const resolvedName =
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      "";
    const pickedPhone = contact.phoneNumbers?.[0]?.number || "";
    setName(resolvedName);
    setPhone(pickedPhone);
    if (contact.image?.uri) {
      setPhotoUri(contact.image.uri);
      setPhotoRemoved(false);
    }
    setMode("form");
  };

  const handlePickContact = async () => {
    if (Platform.OS === "ios") {
      try {
        const contact = await Contacts.presentContactPickerAsync();
        if (contact) applyPickedContact(contact);
      } catch {
        /* cancelled */
      }
    } else {
      setIsLoadingContacts(true);
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === "granted") {
          const { data } = await Contacts.getContactsAsync({
            fields: [
              Contacts.Fields.Name,
              Contacts.Fields.PhoneNumbers,
              Contacts.Fields.Image,
            ],
          });
          setAllContacts(
            data.filter((c) => c.name && c.phoneNumbers?.length > 0),
          );
          setContactSearch("");
          setShowContactModal(true);
          setTimeout(() => contactSearchRef.current?.focus(), 300);
        } else {
          setMode("form");
        }
      } catch {
        setMode("form");
      } finally {
        setIsLoadingContacts(false);
      }
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const isValid = name.trim().length > 0 && phone.trim().length > 0;

  const handleSave = async () => {
    if (!isValid) return;
    if (!relationship) {
      setRelError(true);
      return;
    }
    setSaving(true);
    try {
      // Upload photo if a new one was selected
      let resolvedPhotoUrl = photoRemoved ? null : (existingPhotoUrl ?? null);
      if (photoUri) {
        const tempId = isEditing ? contactId : `temp-${Date.now()}`;
        resolvedPhotoUrl = await uploadContactPhoto(userId, tempId, photoUri);
      }

      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        relationship: relationship || null,
        isPrimary,
        photoUrl: resolvedPhotoUrl,
      };

      if (isEditing) {
        updateMutation.mutate(
          { id: contactId, updates: payload },
          { onSuccess: () => router.back(), onError: () => setSaving(false) },
        );
      } else {
        addMutation.mutate(payload, {
          onSuccess: () => router.back(),
          onError: () => setSaving(false),
        });
      }
    } catch {
      setSaving(false);
      Alert.alert("Error", "Could not save contact. Please try again.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (contacts.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must have at least one emergency contact.",
      );
      return;
    }
    Alert.alert(
      "Delete Contact",
      `Remove ${existing?.name} from your care team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteMutation.mutate(contactId, {
              onSuccess: () => router.back(),
            }),
        },
      ],
    );
  };

  const currentPhotoSource =
    photoUri ?? (!photoRemoved ? existingPhotoUrl : null);
  const filteredContacts = allContacts
    .filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
    .slice(0, 60);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 20,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: 999,
            backgroundColor: "#D09F9A",
            opacity: 0.15,
            top: -60,
            right: -40,
          }}
        />
        <View
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: 999,
            backgroundColor: "#781D11",
            opacity: 0.15,
            bottom: -20,
            left: -30,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isEditing ? (
              <ChevronLeft size={24} color="#F8E9E7" />
            ) : (
              <X size={22} color="#F8E9E7" />
            )}
          </TouchableOpacity>

          <Text
            style={{ fontFamily: fonts.bold, fontSize: 20, color: "#F8E9E7" }}
          >
            {isEditing ? "Edit Contact" : "Add Contact"}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={!isValid || saving}
            style={{
              backgroundColor:
                isValid && !saving
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(255,255,255,0.1)",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.semibold,
                fontSize: 14,
                color: isValid && !saving ? "#F8E9E7" : "rgba(248,233,231,0.4)",
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 60,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Gate (create mode, before form) ── */}
          {mode === "gate" && (
            <View style={styles.gateCard}>
              <View style={styles.gateIconWrap}>
                <BookUser size={32} color={C.accent} strokeWidth={1.6} />
              </View>
              <Text style={styles.gateTitle}>Import from Contacts</Text>
              <Text style={styles.gateBody}>
                Select someone from your phone's contact book — their name and
                number will be filled in automatically.
              </Text>

              {isLoadingContacts ? (
                <ActivityIndicator color={C.accent} style={{ marginTop: 8 }} />
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.accessBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handlePickContact}
                >
                  <BookUser size={18} color="#fff" strokeWidth={2} />
                  <Text style={styles.accessBtnText}>Select a Contact</Text>
                </Pressable>
              )}

              <Pressable onPress={() => setMode("form")} hitSlop={8}>
                <Text style={styles.manualLink}>Add manually instead</Text>
              </Pressable>
            </View>
          )}

          {/* ── Form ── */}
          {mode === "form" && (
            <>
              {/* Photo avatar */}
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                <TouchableOpacity
                  onPress={handlePhotoPress}
                  activeOpacity={0.8}
                >
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: "#F0E4E1",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {currentPhotoSource ? (
                      <Image
                        source={{ uri: currentPhotoSource }}
                        style={{ width: 88, height: 88 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 28,
                          color: C.accent,
                        }}
                      >
                        {getInitials(name) || "?"}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: C.accent,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: C.bg,
                    }}
                  >
                    <Camera size={14} color="#fff" strokeWidth={2} />
                  </View>
                </TouchableOpacity>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: C.muted,
                    marginTop: 8,
                  }}
                >
                  Tap to add photo
                </Text>
              </View>

              {/* If came from picker, show "Change Contact" option */}
              {!isEditing && name.length > 0 && (
                <TouchableOpacity
                  onPress={handlePickContact}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    alignSelf: "flex-end",
                    marginBottom: 12,
                  }}
                >
                  <PenLine size={13} color={C.accent} strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: fonts.medium,
                      fontSize: 13,
                      color: C.accent,
                    }}
                  >
                    Change contact
                  </Text>
                </TouchableOpacity>
              )}

              {/* Name */}
              <Text style={styles.fieldLabel}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "name" && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="rgba(9,51,44,0.35)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Phone */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                Phone Number
              </Text>
              <PhoneInput
                defaultCode="GB"
                layout="first"
                placeholder="Phone number"
                value={phone}
                onChangeFormattedText={setPhone}
                containerStyle={styles.phoneContainer}
                textContainerStyle={styles.phoneTextContainer}
                textInputStyle={styles.phoneTextInput}
                codeTextStyle={styles.phoneCodeText}
                flagButtonStyle={styles.phoneFlagBtn}
                textInputProps={{
                  placeholderTextColor: "rgba(9,51,44,0.35)",
                  keyboardType: "phone-pad",
                  onFocus: () => setFocusedField("phone"),
                  onBlur: () => setFocusedField(null),
                }}
                countryPickerProps={{
                  withFilter: true,
                  withAlphaFilter: true,
                  withEmoji: true,
                }}
              />

              {/* Relationship chips */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
                Relationship
              </Text>
              <View style={styles.relChips}>
                {RELATIONSHIPS.map((rel) => {
                  const selected = relationship === rel;
                  return (
                    <Pressable
                      key={rel}
                      style={[
                        styles.relChip,
                        selected && styles.relChipSelected,
                      ]}
                      onPress={() => { setRelationship(selected ? "" : rel); setRelError(false); }}
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
              {relError && (
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: '#DC2626', marginTop: 6 }}>
                  Please select a relationship
                </Text>
              )}

              {/* Primary contact toggle */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 16,
                  marginTop: 20,
                  borderWidth: 1,
                  borderColor: "#F0EDE8",
                }}
              >
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 15,
                      color: C.dark,
                    }}
                  >
                    Primary Contact
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 13,
                      color: C.muted,
                      marginTop: 2,
                    }}
                  >
                    First person contacted in an emergency
                  </Text>
                </View>
                <Switch
                  value={isPrimary}
                  onValueChange={setIsPrimary}
                  trackColor={{ false: "#E5E7EB", true: C.accent }}
                  thumbColor="#fff"
                />
              </View>

              {/* Delete button (edit mode only) */}
              {isEditing && (
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 32,
                    paddingVertical: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "#FCA5A5",
                  }}
                >
                  <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 15,
                      color: "#DC2626",
                    }}
                  >
                    Delete Contact
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Android contacts picker modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContactModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a contact</Text>
              <Pressable onPress={() => setShowContactModal(false)} hitSlop={8}>
                <X size={22} color={C.dark} strokeWidth={2} />
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
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 40,
              }}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(9,51,44,0.06)",
                    marginLeft: 62,
                  }}
                />
              )}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.contactRow,
                    pressed && { backgroundColor: "rgba(169,51,77,0.04)" },
                  ]}
                  onPress={() => {
                    applyPickedContact(item);
                    setShowContactModal(false);
                  }}
                >
                  <View style={styles.rowInitials}>
                    {item.image?.uri ? (
                      <Image
                        source={{ uri: item.image.uri }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.rowInitialsText}>
                        {getInitials(item.name)}
                      </Text>
                    )}
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
                <View style={{ paddingTop: 48, alignItems: "center" }}>
                  <Text
                    style={{
                      fontFamily: fonts.regular,
                      fontSize: 14,
                      color: "rgba(9,51,44,0.45)",
                      textAlign: "center",
                    }}
                  >
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
    </View>
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
    color: "#09332C",
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
  fieldLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "rgba(9,51,44,0.55)",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0EBE5",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputFocused: {
    borderColor: "#A9334D",
    backgroundColor: "rgba(169,51,77,0.04)",
  },
  input: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#09332C",
    padding: 0,
    margin: 0,
  },
  phoneContainer: {
    width: "100%",
    backgroundColor: "#F0EBE5",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.08)",
    height: 52,
  },
  phoneTextContainer: {
    backgroundColor: "#F0EBE5",
    borderRadius: 12,
    paddingVertical: 0,
  },
  phoneTextInput: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "#09332C",
    height: 52,
  },
  phoneCodeText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 14,
    color: "#09332C",
  },
  phoneFlagBtn: { backgroundColor: "transparent" },
  relChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  relChip: {
    backgroundColor: "#F0EBE5",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: "rgba(9,51,44,0.1)",
  },
  relChipSelected: { backgroundColor: "#A9334D", borderColor: "#A9334D" },
  relChipText: {
    fontFamily: "Geist_500Medium",
    fontSize: 13,
    color: "#09332C",
  },
  relChipTextSelected: { color: "#FFFFFF" },
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
    color: "#09332C",
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
    color: "#09332C",
    padding: 0,
    margin: 0,
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
  rowName: { fontFamily: "Geist_500Medium", fontSize: 15, color: "#09332C" },
  rowPhone: {
    fontFamily: "Geist_400Regular",
    fontSize: 13,
    color: "rgba(9,51,44,0.5)",
    marginTop: 1,
  },
});
