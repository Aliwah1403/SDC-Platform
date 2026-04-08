import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAppStore } from "@/store/appStore";
import { mockFacilities, FACILITY_TYPES } from "@/data/mockFacilities";

// ── Constants ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#F8F4F0",
  card: "#FFFFFF",
  dark: "#09332C",
  muted: "rgba(9,51,44,0.45)",
  faint: "rgba(9,51,44,0.1)",
  accent: "#A9334D",
  success: "#059669",
  border: "rgba(9,51,44,0.08)",
};

const TYPE_GRADIENT = {
  [FACILITY_TYPES.HOSPITAL]: ["#DC2626", "#991B1B", "#7F1D1D"],
  [FACILITY_TYPES.URGENT_CARE]: ["#D09F9A", "#A9334D", "#781D11"],
  [FACILITY_TYPES.CLINIC]: ["#059669", "#047857", "#065F46"],
  [FACILITY_TYPES.SCD_SPECIALIST]: ["#1A5C52", "#09332C", "#052620"],
};

const TYPE_CONFIG = {
  [FACILITY_TYPES.HOSPITAL]: { color: "#DC2626", bg: "#FEE2E2" },
  [FACILITY_TYPES.URGENT_CARE]: { color: "#A9334D", bg: "#F8E9E7" },
  [FACILITY_TYPES.CLINIC]: { color: "#059669", bg: "#D1FAE5" },
  [FACILITY_TYPES.SCD_SPECIALIST]: { color: "#09332C", bg: "#F8E9E7" },
};

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function todayAbbr() {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
}

// ── Haversine distance in miles ───────────────────────────────────────────────
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ── Contact row ───────────────────────────────────────────────────────────────
function ContactRow({ icon: Icon, label, value, onPress, actionLabel }) {
  return (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      disabled={!onPress}
    >
      <View style={styles.contactIconWrap}>
        <Icon size={18} color={C.accent} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      {actionLabel && (
        <View style={styles.contactAction}>
          <Text style={styles.contactActionText}>{actionLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Hours row ─────────────────────────────────────────────────────────────────
function HoursRow({ day, hours, isToday }) {
  return (
    <View style={[styles.hoursRow, isToday && styles.hoursRowToday]}>
      <Text style={[styles.hoursDay, isToday && styles.hoursDayToday]}>{day}</Text>
      <Text
        style={[
          styles.hoursValue,
          isToday && styles.hoursValueToday,
          hours === "Closed" && styles.hoursValueClosed,
        ]}
      >
        {hours}
      </Text>
      {isToday && <View style={styles.todayDot} />}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function FacilityDetailScreen() {
  const { id, userLat, userLng } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favouriteHospitalIds, toggleFavouriteHospital } = useAppStore();

  const facility = mockFacilities.find((f) => f.id === id);
  const isFavourite = favouriteHospitalIds.includes(id);

  // Guard against bad id
  useEffect(() => {
    if (!facility) router.back();
  }, [facility]);

  if (!facility) return null;

  const gradient = TYPE_GRADIENT[facility.type] ?? ["#09332C", "#052620"];
  const cfg = TYPE_CONFIG[facility.type] ?? { color: "#666", bg: "#F3F4F6" };

  const userLocation =
    userLat && userLng
      ? { lat: parseFloat(userLat), lng: parseFloat(userLng) }
      : null;

  const distance = userLocation
    ? distanceMiles(userLocation.lat, userLocation.lng, facility.lat, facility.lng).toFixed(1)
    : null;

  const today = todayAbbr();

  const handleToggleFavourite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavouriteHospital(facility.id);
  };

  const handleCall = () => Linking.openURL(`tel:${facility.phone}`);
  const handleDirections = () => {
    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const query = encodeURIComponent(facility.address);
    Linking.openURL(`${scheme}?q=${query}&daddr=${facility.lat},${facility.lng}`);
  };
  const handleWebsite = () => {
    if (facility.website) Linking.openURL(facility.website);
  };

  // Sort weeklyHours by canonical day order
  const sortedHours = facility.weeklyHours
    ? [...facility.weeklyHours].sort(
        (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
      )
    : [];

  const todayHours = sortedHours.find((h) => h.day === today);

  return (
    <View style={styles.screen}>
      {/* ── Hero ── */}
      <LinearGradient colors={gradient} style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.deco1} />
        <View style={styles.deco2} />

        {/* Top bar */}
        <View style={[styles.heroTopBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavourite} style={styles.heroBtn}>
            <Heart
              size={20}
              color="#FFFFFF"
              fill={isFavourite ? "#FFFFFF" : "transparent"}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </View>

        {/* Icon + name */}
        <View style={styles.heroBody}>
          <View style={styles.heroIconWrap}>
            <Building2 size={40} color="#FFFFFF" strokeWidth={1.5} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <View style={[styles.typeBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Text style={[styles.typeBadgeText, { color: "#FFFFFF" }]}>{facility.type}</Text>
            </View>
            {facility.scdSpecialist && (
              <View style={[styles.typeBadge, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
                <Star size={10} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={[styles.typeBadgeText, { color: "#FFFFFF" }]}>SCD Specialist</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{facility.name}</Text>

          {/* Meta chips */}
          <View style={styles.heroMeta}>
            {distance && (
              <View style={styles.heroMetaChip}>
                <Navigation size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroMetaText}>{distance} mi away</Text>
              </View>
            )}
            {facility.rating && (
              <View style={styles.heroMetaChip}>
                <Star size={12} color="#FCD34D" fill="#FCD34D" />
                <Text style={styles.heroMetaText}>{facility.rating} rating</Text>
              </View>
            )}
            {todayHours && (
              <View style={styles.heroMetaChip}>
                <Clock size={12} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroMetaText}>{todayHours.hours}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ── Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── About ── */}
        {facility.description && (
          <Section title="About">
            <View style={styles.card}>
              <Text style={styles.description}>{facility.description}</Text>
            </View>
          </Section>
        )}

        {/* ── Contact ── */}
        <Section title="Contact & Location">
          <View style={styles.card}>
            <ContactRow
              icon={MapPin}
              label="Address"
              value={facility.address}
              onPress={handleDirections}
              actionLabel="Directions"
            />
            <View style={styles.divider} />
            <ContactRow
              icon={Phone}
              label="Phone"
              value={facility.phone}
              onPress={handleCall}
              actionLabel="Call"
            />
            {facility.website && (
              <>
                <View style={styles.divider} />
                <ContactRow
                  icon={ExternalLink}
                  label="Website"
                  value={facility.website.replace(/^https?:\/\//, "")}
                  onPress={handleWebsite}
                  actionLabel="Open"
                />
              </>
            )}
          </View>
        </Section>

        {/* ── Opening Hours ── */}
        {sortedHours.length > 0 && (
          <Section title="Opening Hours">
            <View style={styles.card}>
              {sortedHours.map((h, i) => (
                <View key={h.day}>
                  <HoursRow day={h.day} hours={h.hours} isToday={h.day === today} />
                  {i < sortedHours.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </Section>
        )}
      </ScrollView>

      {/* ── Sticky action bar ── */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.actionBtnOutlined} onPress={handleDirections}>
          <Navigation size={18} color={C.accent} />
          <Text style={[styles.actionBtnText, { color: C.accent }]}>Get Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnFilled} onPress={handleCall}>
          <Phone size={18} color="#FFFFFF" />
          <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },

  // Hero
  hero: {
    paddingBottom: 28,
    overflow: "hidden",
  },
  deco1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -50,
  },
  deco2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -30,
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBody: {
    paddingHorizontal: 24,
    alignItems: "flex-start",
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroName: {
    fontFamily: "Geist_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 16,
  },
  heroMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroMetaText: {
    fontFamily: "Geist_500Medium",
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },

  // Type badges
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 11,
    letterSpacing: 0.2,
  },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 13,
    color: "rgba(9,51,44,0.45)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#09332C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Description
  description: {
    fontFamily: "Geist_400Regular",
    fontSize: 15,
    color: "rgba(9,51,44,0.75)",
    lineHeight: 24,
    padding: 18,
  },

  // Contact rows
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 14,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8E9E7",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontFamily: "Geist_500Medium",
    fontSize: 12,
    color: "rgba(9,51,44,0.4)",
    marginBottom: 2,
  },
  contactValue: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "#09332C",
  },
  contactAction: {
    backgroundColor: "#F8E9E7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contactActionText: {
    fontFamily: "Geist_600SemiBold",
    fontSize: 12,
    color: "#A9334D",
  },

  // Hours rows
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  hoursRowToday: { backgroundColor: "#FFF5F5" },
  hoursDay: {
    fontFamily: "Geist_500Medium",
    fontSize: 14,
    color: "rgba(9,51,44,0.5)",
    width: 40,
  },
  hoursDayToday: {
    fontFamily: "Geist_700Bold",
    color: "#A9334D",
  },
  hoursValue: {
    flex: 1,
    fontFamily: "Geist_400Regular",
    fontSize: 14,
    color: "#09332C",
    marginLeft: 12,
  },
  hoursValueToday: { fontFamily: "Geist_600SemiBold", color: "#09332C" },
  hoursValueClosed: { color: "rgba(9,51,44,0.35)" },
  todayDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#A9334D",
    marginLeft: 8,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(9,51,44,0.06)",
    marginHorizontal: 18,
  },

  // Sticky action bar
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(9,51,44,0.07)",
  },
  actionBtnOutlined: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#A9334D",
  },
  actionBtnFilled: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: "#A9334D",
  },
  actionBtnText: { fontFamily: "Geist_600SemiBold", fontSize: 15 },
});
