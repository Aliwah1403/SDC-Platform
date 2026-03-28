import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Plus, Users, Search, X } from "lucide-react-native";
import { useEmergencyContactsQuery } from "@/hooks/queries/useEmergencyContactsQuery";
import { fonts } from "@/utils/fonts";
import { useState } from "react";

const RELATIONSHIP_COLORS = {
  doctor:    { color: "#2563EB", bg: "#DBEAFE" },
  nurse:     { color: "#0891B2", bg: "#CFFAFE" },
  family:    { color: "#A9334D", bg: "#F8E9E7" },
  friend:    { color: "#059669", bg: "#D1FAE5" },
  caregiver: { color: "#7C3AED", bg: "#EDE9FE" },
  parent:    { color: "#A9334D", bg: "#F8E9E7" },
  sibling:   { color: "#F0531C", bg: "#FEF0EB" },
  partner:   { color: "#A9334D", bg: "#FBE9ED" },
  carer:     { color: "#7C3AED", bg: "#EDE9FE" },
};

function getAccent(relationship = "") {
  const key = relationship.toLowerCase();
  return RELATIONSHIP_COLORS[key] ?? { color: "#A9334D", bg: "#F8E9E7" };
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function ContactCard({ contact, onPress }) {
  const { color, bg } = getAccent(contact.relationship);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#F0EDE8",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
          overflow: "hidden",
        }}
      >
        {contact.photoUrl ? (
          <Image
            source={{ uri: contact.photoUrl }}
            style={{ width: 52, height: 52 }}
            contentFit="cover"
          />
        ) : (
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color }}>
            {initials(contact.name)}
          </Text>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#09332C", marginBottom: 4 }}>
          {contact.name}
        </Text>
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {contact.relationship ? (
            <View style={{ backgroundColor: bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color, textTransform: "capitalize" }}>
                {contact.relationship}
              </Text>
            </View>
          ) : null}
          {contact.isPrimary ? (
            <View style={{ backgroundColor: "#FEF3C7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#92400E" }}>Primary</Text>
            </View>
          ) : null}
        </View>
        {contact.phone ? (
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
            {contact.phone}
          </Text>
        ) : null}
      </View>

      {/* Chevron */}
      <ChevronLeft size={18} color="#D1D5DB" style={{ transform: [{ rotate: "180deg" }] }} />
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#F0EDE8",
        borderStyle: "dashed",
        marginTop: 8,
      }}
    >
      <Users size={36} color="#D09F9A" style={{ marginBottom: 12 }} />
      <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#09332C", marginBottom: 6 }}>
        No contacts yet
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20 }}>
        Add emergency contacts so they can be reached quickly in a crisis.
      </Text>
    </View>
  );
}

export default function CareTeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: contacts = [], isLoading } = useEmergencyContactsQuery();
  const [query, setQuery] = useState("");

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(trimmed) ||
          c.relationship?.toLowerCase().includes(trimmed) ||
          c.phone?.toLowerCase().includes(trimmed),
      )
    : contacts;

  const primary = filtered.filter((c) => c.isPrimary);
  const others = filtered.filter((c) => !c.isPrimary);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F4F0" }}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={["#D09F9A", "#A9334D", "#781D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", width: 180, height: 180, borderRadius: 999, backgroundColor: "#D09F9A", opacity: 0.15, top: -60, right: -40 }} />
        <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 999, backgroundColor: "#781D11", opacity: 0.15, bottom: -20, left: -30 }} />

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={24} color="#F8E9E7" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: "#F8E9E7" }}>My Care Team</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(248,233,231,0.6)", marginTop: 2 }}>
              {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/add-contact")}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}
          >
            <Plus size={22} color="#F8E9E7" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.15)",
            borderRadius: 12,
            marginTop: 14,
            paddingHorizontal: 12,
            height: 40,
            gap: 8,
          }}
        >
          <Search size={16} color="rgba(248,233,231,0.7)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search contacts..."
            placeholderTextColor="rgba(248,233,231,0.5)"
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: 14,
              color: "#F8E9E7",
              paddingVertical: 0,
            }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={15} color="rgba(248,233,231,0.7)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!isLoading && contacts.length === 0 && <EmptyState />}

        {/* No results state */}
        {!isLoading && contacts.length > 0 && filtered.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <Search size={32} color="#D09F9A" style={{ marginBottom: 10 }} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: "#09332C", marginBottom: 4 }}>
              No results for "{query}"
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF" }}>
              Try searching by name, relationship, or phone
            </Text>
          </View>
        )}

        {/* Flat results when searching */}
        {trimmed && filtered.length > 0 && (
          <>
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 10 }}>
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </Text>
            {filtered.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onPress={() => router.push(`/contact-detail?contactId=${c.id}`)}
              />
            ))}
          </>
        )}

        {/* Sectioned list when not searching */}
        {!trimmed && (
          <>
            {primary.length > 0 && (
              <>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 10 }}>
                  Primary Contact
                </Text>
                {primary.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onPress={() => router.push(`/contact-detail?contactId=${c.id}`)}
                  />
                ))}
              </>
            )}

            {others.length > 0 && (
              <>
                <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#09332C", marginBottom: 10, marginTop: primary.length > 0 ? 8 : 0 }}>
                  Other Contacts
                </Text>
                {others.map((c) => (
                  <ContactCard
                    key={c.id}
                    contact={c}
                    onPress={() => router.push(`/contact-detail?contactId=${c.id}`)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
