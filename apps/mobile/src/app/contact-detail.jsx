import { View, Text, TouchableOpacity, Alert, Linking } from "react-native";
import { Image } from "expo-image";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ChevronLeft,
  MoreHorizontal,
  Phone,
  User,
  Calendar,
  Clock,
  Star,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import {
  useEmergencyContactsQuery,
  useDeleteEmergencyContactMutation,
  useRecordContactCallMutation,
  useContactCallLogsQuery,
} from "@/hooks/queries/useEmergencyContactsQuery";
import { fonts } from "@/utils/fonts";
import { useState } from "react";

const C = {
  bg: "#F8F4F0",
  card: "#ffffff",
  border: "#F0E4E1",
  divider: "#F0E4E1",
  dark: "#09332C",
  muted: "rgba(9,51,44,0.45)",
  accent: "#A9334D",
};

const RELATIONSHIP_COLORS = {
  doctor:    { color: "#2563EB", bg: "#DBEAFE", gradient: ["#DBEAFE", "#EFF6FF", "#F8F4F0"] },
  nurse:     { color: "#0891B2", bg: "#CFFAFE", gradient: ["#CFFAFE", "#ECFEFF", "#F8F4F0"] },
  family:    { color: "#A9334D", bg: "#F8E9E7", gradient: ["#F8E9E7", "#FDF4F3", "#F8F4F0"] },
  friend:    { color: "#059669", bg: "#D1FAE5", gradient: ["#D1FAE5", "#ECFDF5", "#F8F4F0"] },
  caregiver: { color: "#7C3AED", bg: "#EDE9FE", gradient: ["#EDE9FE", "#F5F3FF", "#F8F4F0"] },
  parent:    { color: "#A9334D", bg: "#F8E9E7", gradient: ["#F8E9E7", "#FDF4F3", "#F8F4F0"] },
  sibling:   { color: "#F0531C", bg: "#FEF0EB", gradient: ["#FEF0EB", "#FFF7F5", "#F8F4F0"] },
  partner:   { color: "#A9334D", bg: "#FBE9ED", gradient: ["#FBE9ED", "#FDF4F6", "#F8F4F0"] },
  carer:     { color: "#7C3AED", bg: "#EDE9FE", gradient: ["#EDE9FE", "#F5F3FF", "#F8F4F0"] },
  other:     { color: "#A9334D", bg: "#F8E9E7", gradient: ["#F8E9E7", "#FDF4F3", "#F8F4F0"] },
};

function getAccent(relationship = "") {
  const key = relationship.toLowerCase();
  return RELATIONSHIP_COLORS[key] ?? RELATIONSHIP_COLORS.other;
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return format(new Date(isoString), "MMM d, yyyy");
  } catch {
    return null;
  }
}

function formatLastCalled(isoString) {
  if (!isoString) return "Never";
  try {
    return format(new Date(isoString), "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "Never";
  }
}

// ── sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ title }) {
  return (
    <Text
      style={{
        fontFamily: fonts.semibold,
        fontSize: 11,
        color: C.muted,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
        marginLeft: 2,
      }}
    >
      {title}
    </Text>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        marginBottom: 24,
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return (
    <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 62 }} />
  );
}

function InfoRow({ icon: Icon, iconColor, label, value, last }) {
  if (!value) return null;
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: "#F2EFEC",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={17} color={iconColor} />
        </View>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: C.muted,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 14,
            color: C.dark,
            maxWidth: "55%",
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      </View>
      {!last && <Divider />}
    </>
  );
}

function StatRow({ icon: Icon, iconColor, label, value, last }) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            backgroundColor: "#F2EFEC",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Icon size={17} color={iconColor} />
        </View>
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 14,
            color: C.muted,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: fonts.semibold,
            fontSize: 14,
            color: C.dark,
            maxWidth: "55%",
            textAlign: "right",
          }}
        >
          {value}
        </Text>
      </View>
      {!last && <Divider />}
    </>
  );
}

// ── main screen ────────────────────────────────────────────────────────────

export default function ContactDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { contactId } = useLocalSearchParams();
  const { data: contacts = [] } = useEmergencyContactsQuery();
  const deleteMutation = useDeleteEmergencyContactMutation();
  const recordCallMutation = useRecordContactCallMutation();
  const { data: callLogs = [] } = useContactCallLogsQuery(contactId);

  const [heroHeight, setHeroHeight] = useState(insets.top + 280);

  const scrollY = useSharedValue(0);
  const NAV_HEIGHT = insets.top + 56;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const heroAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, heroHeight - NAV_HEIGHT],
          [0, -(heroHeight - NAV_HEIGHT)],
          "clamp",
        ),
      },
    ],
  }));

  const compactNavStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [heroHeight * 0.45, heroHeight * 0.75],
      [0, 1],
      "clamp",
    ),
  }));

  const contact = contacts.find((c) => c.id === contactId);

  if (!contact) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontFamily: fonts.medium, fontSize: 16, color: C.muted }}>
          Contact not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: C.accent }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { color, bg, gradient } = getAccent(contact.relationship);

  const handleCall = async () => {
    const phone = contact.phone?.replace(/\s+/g, "");
    if (!phone) return;
    recordCallMutation.mutate(contact.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = () => {
    if (contacts.length <= 1) {
      Alert.alert(
        "Cannot Delete",
        "You must have at least one emergency contact.",
        [{ text: "OK" }],
      );
      return;
    }
    Alert.alert(
      "Delete Contact",
      `Remove ${contact.name} from your care team?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMutation.mutate(contact.id);
            router.back();
          },
        },
      ],
    );
  };

  const handleMore = () => {
    Alert.alert(contact.name, undefined, [
      {
        text: "Edit",
        onPress: () =>
          router.push({ pathname: "/add-contact", params: { contactId: contact.id } }),
      },
      { text: "Delete", style: "destructive", onPress: handleDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const floatBtn = {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Hero ── */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
          heroAnimStyle,
        ]}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
      >
        <LinearGradient
          colors={gradient}
          style={{
            paddingTop: insets.top + 20,
            paddingBottom: 32,
            paddingHorizontal: 16,
            alignItems: "center",
          }}
        >
          {/* Floating nav buttons */}
          <View
            style={{
              position: "absolute",
              top: insets.top + 12,
              left: 16,
              right: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={floatBtn}>
              <ChevronLeft size={20} color={C.dark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleMore} activeOpacity={0.7} style={floatBtn}>
              <MoreHorizontal size={20} color={C.dark} />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: bg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              overflow: "hidden",
              borderWidth: 3,
              borderColor: "rgba(255,255,255,0.6)",
            }}
          >
            {contact.photoUrl ? (
              <Image
                source={{ uri: contact.photoUrl }}
                style={{ width: 88, height: 88 }}
                contentFit="cover"
              />
            ) : (
              <Text style={{ fontFamily: fonts.bold, fontSize: 28, color }}>
                {initials(contact.name)}
              </Text>
            )}
          </View>

          {/* Name */}
          <Text
            numberOfLines={2}
            style={{
              fontFamily: fonts.bold,
              fontSize: 26,
              color: C.dark,
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            {contact.name}
          </Text>

          {/* Badges */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {contact.relationship ? (
              <View
                style={{
                  backgroundColor: bg,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                }}
              >
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color, textTransform: "capitalize" }}>
                  {contact.relationship}
                </Text>
              </View>
            ) : null}
            {contact.isPrimary ? (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Star size={11} color="#92400E" fill="#92400E" />
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#92400E" }}>
                  Primary
                </Text>
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Compact sticky nav ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            height: NAV_HEIGHT,
            backgroundColor: "rgba(248,244,240,0.96)",
            borderBottomWidth: 1,
            borderBottomColor: C.border,
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingBottom: 10,
          },
          compactNavStyle,
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={floatBtn}>
          <ChevronLeft size={20} color={C.dark} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.semibold,
            fontSize: 16,
            color: C.dark,
            flex: 1,
            textAlign: "center",
            marginHorizontal: 8,
          }}
        >
          {contact.name}
        </Text>
        <TouchableOpacity onPress={handleMore} activeOpacity={0.7} style={floatBtn}>
          <MoreHorizontal size={20} color={C.dark} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: heroHeight,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16, paddingTop: 24 }}>
          {/* Contact Info */}
          <SectionLabel title="Contact Info" />
          <Card>
            <InfoRow
              icon={Phone}
              iconColor={color}
              label="Phone"
              value={contact.phone}
            />
            <InfoRow
              icon={User}
              iconColor={color}
              label="Relationship"
              value={contact.relationship
                ? contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)
                : undefined}
            />
            <InfoRow
              icon={Calendar}
              iconColor="#781D11"
              label="Added on"
              value={formatDate(contact.createdAt) ?? "Unknown"}
              last
            />
          </Card>

          {/* Call History */}
          <SectionLabel title={`Call History${callLogs.length > 0 ? ` · ${callLogs.length}` : ""}`} />
          <Card>
            {callLogs.length === 0 ? (
              <View style={{ padding: 24, alignItems: "center" }}>
                <Phone size={28} color="#D1D5DB" style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.muted, textAlign: "center" }}>
                  No calls yet
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>
                  Calls made from this screen will appear here
                </Text>
              </View>
            ) : (
              callLogs.map((log, idx) => {
                const date = new Date(log.calledAt);
                const isLast = idx === callLogs.length - 1;
                return (
                  <View key={log.id}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 13,
                        paddingHorizontal: 16,
                        gap: 12,
                      }}
                    >
                      {/* Timeline dot + line */}
                      <View style={{ alignItems: "center", width: 34 }}>
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: idx === 0 ? color : "#D1D5DB",
                          }}
                        />
                        {!isLast && (
                          <View
                            style={{
                              width: 2,
                              flex: 1,
                              minHeight: 20,
                              backgroundColor: "#F0EDE8",
                              marginTop: 4,
                            }}
                          />
                        )}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: C.dark }}>
                          {date.toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>

                      {idx === 0 && (
                        <View
                          style={{
                            backgroundColor: `${color}15`,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color }}>
                            Latest
                          </Text>
                        </View>
                      )}
                    </View>
                    {!isLast && (
                      <View style={{ height: 1, backgroundColor: C.divider, marginLeft: 62 }} />
                    )}
                  </View>
                );
              })
            )}
          </Card>
        </View>
      </Animated.ScrollView>

      {/* ── Call CTA (sticky bottom) ── */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
          paddingTop: 16,
          backgroundColor: "rgba(248,244,240,0.97)",
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}
      >
        <TouchableOpacity
          onPress={handleCall}
          activeOpacity={0.82}
          style={{
            backgroundColor: color,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Phone size={20} color="#fff" fill="#fff" />
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#fff" }}>
            Call {contact.name.split(" ")[0]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
